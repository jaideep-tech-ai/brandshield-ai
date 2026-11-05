"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import type {
  AnalyticsPayload,
  AuditEntry,
  Finding,
  GuidelineDoc,
  Inspection,
  Revision,
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

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useSession(options?: Partial<UseQueryOptions<SessionUser | null>>) {
  return useQuery<SessionUser | null>({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await api.get<SessionUser>("/api/auth/me");
      } catch {
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
    mutationFn: (input: { name: string; email: string; password: string; role: string; department?: string }) =>
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

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>("/api/auth/logout"),
    onSuccess: () => {
      qc.setQueryData(["session"], null);
      qc.clear();
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
