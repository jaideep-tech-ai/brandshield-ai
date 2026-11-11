"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import type {
  AnalyticsPayload,
  AuditEntry,
  Finding,
  GuidelineDoc,
  Inspection,
  Revision,
  Role,
  SessionUser,
  Submission,
  SubscriptionInfo,
  TeamMember,
  Tier,
  VisualToken,
} from "./types";

// ─── Fetch helpers ───────────────────────────────────────────────────────────

export class ApiRequestError extends Error {
  code?: string;
  upgradeTier?: Tier;
  status: number;
  constructor(message: string, status: number, code?: string, upgradeTier?: Tier) {
    super(message);
    this.status = status;
    this.code = code;
    this.upgradeTier = upgradeTier;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "same-origin",
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = (data ?? {}) as { error?: string; code?: string; upgradeTier?: Tier };
    throw new ApiRequestError(err.error ?? `Request failed (${res.status})`, res.status, err.code, err.upgradeTier);
  }
  return data as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  patch: <T,>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  del: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ─── Session hint (localStorage) ───────────────────────────────────────

// Tracks whether this browser has ever held a signed-in session. Anonymous
// visitors (no hint) render the landing instantly instead of waiting on the
// /api/auth/me round trip; returning users get the branded gate while the
// session check and signed-in chunk warm-up run in parallel.
const AUTH_HINT_KEY = "bs.auth.hint";

export function markAuthHint(): void {
  try {
    localStorage.setItem(AUTH_HINT_KEY, "1");
  } catch {
    /* private browsing — the hint is an optimization only */
  }
}

export function clearAuthHint(): void {
  try {
    localStorage.removeItem(AUTH_HINT_KEY);
  } catch {
    /* private browsing */
  }
}

export function hasAuthHint(): boolean {
  try {
    return localStorage.getItem(AUTH_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useSession(options?: Partial<UseQueryOptions<SessionUser | null>>) {
  return useQuery<SessionUser | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        const user = await api.get<SessionUser>("/api/auth/me");
        markAuthHint();
        return user;
      } catch {
        clearAuthHint();
        return null;
      }
    },
    staleTime: 60_000,
    ...options,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) => api.post<SessionUser>("/api/auth/login", input),
    onSuccess: (user) => {
      qc.setQueryData(["session"], user);
      qc.invalidateQueries();
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string; role: string; department?: string; organizationName?: string }) =>
      api.post<SessionUser>("/api/auth/register", input),
    onSuccess: (user) => {
      qc.setQueryData(["session"], user);
      qc.invalidateQueries();
    },
  });
}

export function useDemoLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => api.post<SessionUser>("/api/auth/login", { email, password: "demo1234" }),
    onSuccess: (user) => {
      qc.setQueryData(["session"], user);
      qc.invalidateQueries();
    },
  });
}

export function useAutoLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetRole?: Role) =>
      api.post<SessionUser>("/api/auth/auto-login", targetRole ? { role: targetRole } : {}),
    onSuccess: (user) => {
      markAuthHint();
      qc.setQueryData(["session"], user);
      qc.invalidateQueries();
    },
  });
}

export function useSwitchRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targetRole: Role) => api.post<SessionUser>("/api/auth/switch-role", { targetRole }),
    onSuccess: (user) => {
      markAuthHint();
      qc.setQueryData(["session"], user);
      qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>("/api/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(["session"], null);
      qc.clear();
      clearAuthHint();
    },
  });
}

// ─── Stage 1: Knowledge Base ─────────────────────────────────────────────────

export function useGuidelines() {
  return useQuery<GuidelineDoc[]>({ queryKey: ["guidelines"], queryFn: () => api.get("/api/guidelines") });
}

export function useCreateGuideline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; docType: string; content: string; sourceName?: string }) =>
      api.post<GuidelineDoc>("/api/guidelines", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guidelines"] }),
  });
}

export function useDeleteGuideline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: boolean }>(`/api/guidelines/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guidelines"] }),
  });
}

export function useUploadGuidelinePdf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/guidelines/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload guideline PDF");
      }
      return res.json() as Promise<GuidelineDoc>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guidelines"] }),
  });
}

export function useReindexGuideline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ ok: boolean; chunkCount: number }>(`/api/guidelines/${id}/reindex`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guidelines"] }),
  });
}

export interface SearchPassage {
  id: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  ruleTag: string | null;
  text: string;
  score: number;
  matchType: "hybrid" | "vector" | "lexical";
}

export function useSearchKnowledge() {
  return useMutation({
    mutationFn: (input: { query: string; documentId?: string; limit?: number }) =>
      api.post<{ passages: SearchPassage[]; total: number; query: string }>("/api/guidelines/search", input),
  });
}

export function useVisualTokens() {
  return useQuery<VisualToken[]>({ queryKey: ["visual-tokens"], queryFn: () => api.get("/api/visual-tokens") });
}

export function useCreateVisualToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { tokenType: string; name: string; value: string; secondary?: string; usageNotes?: string }) =>
      api.post<VisualToken>("/api/visual-tokens", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visual-tokens"] }),
  });
}

export function useDeleteVisualToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: boolean }>(`/api/visual-tokens/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visual-tokens"] }),
  });
}

// ─── Stage 2: Submissions & Scanning ─────────────────────────────────────────

export type SubmissionWithDetails = Omit<Submission, "findings" | "revisions" | "inspections" | "authorName" | "authorRole"> & {
  findings: Finding[];
  revisions: Revision[];
  inspections: Inspection[];
  authorName: string;
  authorRole: string;
};

export function useSubmissions() {
  return useQuery<Submission[]>({ queryKey: ["submissions"], queryFn: () => api.get("/api/submissions") });
}

export function useSubmission(id: string | null) {
  return useQuery<SubmissionWithDetails>({
    queryKey: ["submission", id],
    queryFn: () => api.get(`/api/submissions/${id}`),
    enabled: !!id,
  });
}

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; contentType: string; content?: string; imageData?: string; imagePalette?: string[]; department?: string; creatorNote?: string }) =>
      api.post<Submission>("/api/submissions", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["submissions"] }),
  });
}

export function useUpdateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; title?: string; content?: string; imageData?: string; imagePalette?: string[] }) =>
      api.patch<Submission>(`/api/submissions/${id}`, patch),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["submission", vars.id] });
    },
  });
}

export function useScanSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ submission: Submission; inspection: Inspection }>(`/api/submissions/${id}/scan`),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["submission", id] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// ─── Stage 3: Findings & Remediation ─────────────────────────────────────────

export function useResolveFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, suggestion }: { id: string; suggestion?: string | null }) =>
      api.post<{ ok: boolean; contentUpdated: boolean; submission: Submission | null }>(`/api/findings/${id}/resolve`, { suggestion }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["submission"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useOverrideFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      api.post<Finding>(`/api/findings/${id}/override`, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["submission"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useRewriteSuggestion() {
  return useMutation({
    mutationFn: (findingId: string) => api.post<{ suggestion: string }>(`/api/findings/${findingId}/rewrite`),
  });
}

// ─── Stage 4: Review Workflow & Audit ────────────────────────────────────────

export function useTransitionSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: "submit_for_review" | "request_changes" | "approve" | "reopen"; note?: string }) =>
      api.post<Submission>(`/api/submissions/${id}/transition`, { action, note }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["submission", vars.id] });
      qc.invalidateQueries({ queryKey: ["audit"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useAuditTrail(submissionId: string | null) {
  return useQuery<AuditEntry[]>({
    queryKey: ["audit", submissionId],
    queryFn: () => api.get(`/api/audit?submissionId=${submissionId}`),
    enabled: !!submissionId,
  });
}

export function useOrgAuditTrail() {
  return useQuery<AuditEntry[]>({ queryKey: ["audit", "org"], queryFn: () => api.get("/api/audit") });
}

// ─── Stage 5: Analytics ──────────────────────────────────────────────────────

export function useAnalytics() {
  return useQuery<AnalyticsPayload>({ queryKey: ["analytics"], queryFn: () => api.get("/api/analytics") });
}

export interface WorkflowStageItem {
  id: number;
  key: string;
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  completed: boolean;
  current: boolean;
  count: number;
  detail: string;
  detailHi: string;
  targetView: string;
}

export interface WorkflowData {
  stages: WorkflowStageItem[];
  completedCount: number;
  totalStages: number;
  percentage: number;
  orgName: string;
}

export function useWorkflow() {
  return useQuery<WorkflowData>({
    queryKey: ["workflow-stages"],
    queryFn: () => api.get("/api/system/workflow"),
    staleTime: 10_000,
  });
}

// ─── Tour & Onboarding State ────────────────────────────────────────────────

export interface TourStateData {
  completed: boolean;
  stepIndex: number;
  role: Role;
  dismissed: boolean;
  paused: boolean;
  tasksCompleted: string[];
  liveTaskStatus: Record<string, boolean>;
  updatedAt?: string;
}

export function useTourState() {
  return useQuery<TourStateData>({
    queryKey: ["user-tour-state"],
    queryFn: () => api.get("/api/user/tour"),
    staleTime: 10_000,
  });
}

export function useUpdateTourState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (update: {
      completed?: boolean;
      stepIndex?: number;
      dismissed?: boolean;
      paused?: boolean;
      taskCompleted?: string;
      restart?: boolean;
      reset?: boolean;
    }) => api.post<{ ok: boolean; state: Partial<TourStateData> }>("/api/user/tour", update),
    onSuccess: (_, variables) => {
      // Only invalidate on terminal / reset / dismiss states to avoid racing intermediate steps
      if (variables.reset || variables.completed || variables.dismissed) {
        qc.invalidateQueries({ queryKey: ["user-tour-state"] });
      }
    },
  });
}

// ─── Billing & Org ───────────────────────────────────────────────────────────

export function useSubscription() {
  return useQuery<SubscriptionInfo>({ queryKey: ["subscription"], queryFn: () => api.get("/api/billing/subscription") });
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: (tier: Tier) => api.post<{ sessionId: string; url: string | null; tier: Tier; sandbox: boolean }>("/api/billing/checkout", { tier }),
  });
}

export function useCompleteCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.post<SubscriptionInfo>("/api/billing/complete", { sessionId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscription"] });
      qc.invalidateQueries({ queryKey: ["audit", "org"] });
    },
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: () => api.post<{ url: string | null; sandbox: boolean }>("/api/billing/portal"),
  });
}

export function useUpdateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { zeroDataRetention?: boolean; name?: string }) => api.post<{ ok: boolean }>("/api/org/settings", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useTeam() {
  return useQuery<TeamMember[]>({ queryKey: ["team"], queryFn: () => api.get("/api/org/team") });
}

// ─── Database health & integrity (live, real numbers only) ───────────────────

export interface DatabaseHealth {
  connection: {
    engine: "SQLite" | "PostgreSQL";
    supplier: string;
    pooled: boolean;
    host: string | null;
  };
  counts: {
    organizations: number;
    users: number;
    submissions: number;
    findings: number;
    auditLogs: number;
    guidelineDocs: number;
  };
  integrity: {
    duplicateEmails: number;
    usersWithoutOrg: number;
    orgsWithoutSubscription: number;
    submissionsWithBadAuthor: number;
    brokenAuditChains: number;
    consistent: boolean;
  };
  chains: { organization: string; entries: number; valid: boolean }[];
  generatedAt: string;
  fingerprint: string;
}

export function useDatabaseHealth(options?: { refetchInterval?: number }) {
  return useQuery<DatabaseHealth>({
    queryKey: ["db-health"],
    queryFn: () => api.get("/api/system/database"),
    refetchInterval: options?.refetchInterval,
  });
}
