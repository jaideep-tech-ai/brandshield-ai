"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
  Send,
  Lock,
  GitBranch,
  FolderGit2,
  Search,
  Check,
  Copy,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/brandshield/client";
import { cn } from "@/lib/brandshield/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface GitLabStatusResponse {
  configured: boolean;
  patAvailable: boolean;
  connected: boolean;
  status: "connecting" | "connected" | "failed" | "disconnected";
  gitlabUsername: string | null;
  projectId: string | null;
  projectName: string | null;
  projectPath: string | null;
  projectUrl: string | null;
  projectVisibility: string | null;
  webhookId: number | null;
  webhookConfigured: boolean;
  lastEventAt: string | null;
  lastEventStatus: "PASSED" | "BLOCKED" | "FAILED" | null;
  lastEventError: string | null;
  lastAuditId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GitLabProjectSummary {
  id: string;
  name: string;
  nameWithNamespace: string;
  pathWithNamespace: string;
  webUrl: string;
  visibility: string;
  avatarUrl: string | null;
  defaultBranch: string;
}

export interface GitLabTestResponse {
  success: boolean;
  status: number;
  latencyMs: number;
  verdict?: string;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

// Official GitLab SVG Icon
function GitLabIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M22.65 14.39L20.61 8.1c-.13-.41-.7-.41-.83 0l-1.92 5.92H6.14L4.22 8.1c-.13-.41-.7-.41-.83 0L1.35 14.39a.84.84 0 00.31.95l10.02 7.28a.63.63 0 00.74 0l10.02-7.28a.84.84 0 00.31-.95z"
        fill="#E24329"
      />
      <path
        d="M22.65 14.39l-10.33 7.51a.63.63 0 01-.74 0L1.35 14.39a.84.84 0 01-.31-.95L4.22 8.1c.13-.41.7-.41.83 0l1.92 5.92h10.06l1.92-5.92c.13-.41.7-.41.83 0l3.18 5.34a.84.84 0 01-.31.95z"
        fill="#FC6D26"
      />
      <path
        d="M12 21.9l-5.86-7.51h11.72L12 21.9z"
        fill="#E24329"
      />
      <path
        d="M12 21.9L6.14 14.39H1.35L12 21.9z"
        fill="#FCA326"
      />
      <path
        d="M12 21.9l5.86-7.51h4.79L12 21.9z"
        fill="#FCA326"
      />
    </svg>
  );
}

export function GitLabIntegrationCard() {
  const qc = useQueryClient();
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("gitlab") === "authorized";
    }
    return false;
  });
  const [projectSearch, setProjectSearch] = useState("");
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [isManualSetupOpen, setIsManualSetupOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ── 1. Status Query ──
  const statusQuery = useQuery({
    queryKey: ["gitlab-status"],
    queryFn: () => api.get<GitLabStatusResponse>("/api/integrations/gitlab/status"),
    refetchInterval: 15000, // Refresh status periodically
  });

  // Handle URL callback notifications on mount (synchronizing external window and toast state)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const gitlabParam = params.get("gitlab");
    const statusParam = params.get("status");
    const errorParam = params.get("error");
    const detailsParam = params.get("details");

    if (gitlabParam === "authorized") {
      toast.success("GitLab account authorized! Please select a repository to connect.");
      qc.invalidateQueries({ queryKey: ["gitlab-status"] });
      // Clean query params
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("gitlab");
      window.history.replaceState({}, "", cleanUrl.toString());
    } else if (statusParam === "error") {
      toast.error(detailsParam || errorParam || "GitLab authorization encountered an error.");
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("status");
      cleanUrl.searchParams.delete("error");
      cleanUrl.searchParams.delete("details");
      window.history.replaceState({}, "", cleanUrl.toString());
    }
  }, [qc]);

  // ── 2. Projects Query (only fetched when project picker is open) ──
  const projectsQuery = useQuery({
    queryKey: ["gitlab-projects", projectSearch],
    queryFn: () =>
      api.get<{ count: number; projects: GitLabProjectSummary[] }>(
        `/api/integrations/gitlab/projects${projectSearch ? `?search=${encodeURIComponent(projectSearch)}` : ""}`
      ),
    enabled: isProjectPickerOpen,
  });

  // ── 3. Setup Webhook Mutation ──
  const setupWebhook = useMutation({
    mutationFn: (projectId: string) =>
      api.post<{ success: boolean; message: string; project?: any }>("/api/integrations/gitlab/setup-webhook", {
        projectId,
      }),
    onSuccess: (data) => {
      toast.success(data.message || "GitLab repository connected and webhook provisioned!");
      setIsProjectPickerOpen(false);
      qc.invalidateQueries({ queryKey: ["gitlab-status"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to configure webhook on selected project.");
    },
  });

  // ── 4. Test Connection Mutation ──
  const testConnection = useMutation({
    mutationFn: () => api.post<GitLabTestResponse>("/api/integrations/gitlab/test"),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Synthetic test push verified! Latency: ${data.latencyMs}ms`);
      } else {
        toast.error(`Webhook test failed: ${data.error || "Receiver returned error"}`);
      }
      qc.invalidateQueries({ queryKey: ["gitlab-status"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to dispatch test event.");
    },
  });

  // ── 5. Disconnect Mutation ──
  const disconnectMutation = useMutation({
    mutationFn: () => api.post<{ success: boolean; message: string }>("/api/integrations/gitlab/disconnect"),
    onSuccess: (data) => {
      toast.success(data.message || "GitLab integration disconnected.");
      setIsDisconnectDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["gitlab-status"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to disconnect GitLab integration.");
    },
  });

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  const data = statusQuery.data;
  const isConnected = data?.connected && Boolean(data?.projectId);
  const isConnecting = data?.status === "connecting";

  return (
    <>
      <Card className="rounded-2xl border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-orange-50/20 shadow-sm overflow-hidden">
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-teal-500" />

        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100/80 p-2 shadow-xs ring-1 ring-orange-200/60">
                <GitLabIcon className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-slate-900">
                    GitLab Self-Service Integration
                  </CardTitle>
                  {isConnected ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] font-semibold text-emerald-700">
                      CONNECTED
                    </Badge>
                  ) : isConnecting ? (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] font-semibold text-amber-700">
                      SELECTING PROJECT
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-600">
                      NOT CONNECTED
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-500">
                  Automated pre-publishing brand compliance gates for GitLab CI/CD pipelines & merge requests
                </CardDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => statusQuery.refetch()}
              disabled={statusQuery.isFetching}
              className="h-8 gap-1.5 self-start sm:self-center rounded-lg text-xs"
            >
              <RefreshCw className={cn("size-3", statusQuery.isFetching && "animate-spin")} />
              <span>Refresh</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {statusQuery.isLoading ? (
            <div className="flex items-center justify-center p-8 text-xs text-slate-400">
              <Loader2 className="mr-2 size-4 animate-spin text-orange-500" />
              Checking GitLab connection status...
            </div>
          ) : isConnected ? (
            /* ── CONNECTED STATE ── */
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="size-4 text-orange-600" />
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {data.projectPath || data.projectName}
                      </span>
                      {data.projectVisibility && (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono text-slate-600">
                          {data.projectVisibility}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      {data.gitlabUsername && (
                        <span>
                          Connected by: <strong className="text-slate-800">@{data.gitlabUsername}</strong>
                        </span>
                      )}
                      {data.webhookId && (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Webhook #{data.webhookId} Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {data.projectUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="h-8 gap-1 rounded-lg text-xs"
                      >
                        <a href={data.projectUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3 text-slate-600" />
                          <span>View on GitLab</span>
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsProjectPickerOpen(true)}
                      className="h-8 gap-1 rounded-lg text-xs"
                    >
                      <GitBranch className="size-3 text-slate-600" />
                      <span>Change Repo</span>
                    </Button>
                  </div>
                </div>

                {/* Health & Diagnostics Grid */}
                <div className="mt-4 grid grid-cols-1 gap-2 rounded-lg bg-slate-50/80 p-3 sm:grid-cols-3 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Last Webhook Event
                    </span>
                    <p className="mt-0.5 text-xs font-semibold text-slate-800">
                      {data.lastEventAt ? new Date(data.lastEventAt).toLocaleString() : "Awaiting first event"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Last Compliance Result
                    </span>
                    <div className="mt-0.5">
                      {data.lastEventStatus === "PASSED" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] font-bold">
                          PASSED (APPROVED)
                        </Badge>
                      ) : data.lastEventStatus === "BLOCKED" ? (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-[10px] font-bold">
                          BLOCKED (VIOLATIONS)
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-500">No audits recorded</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Security & Encryption
                    </span>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-600 font-medium">
                      <Lock className="size-3 text-teal-600" />
                      AES-256-GCM at rest
                    </p>
                  </div>
                </div>

                {data.lastEventError && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                    <ShieldAlert className="size-4 shrink-0 text-red-600" />
                    <span>Error: {data.lastEventError}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => testConnection.mutate()}
                  disabled={testConnection.isPending}
                  className="h-8 gap-1.5 rounded-lg bg-teal-700 text-xs font-semibold text-white hover:bg-teal-800 shadow-xs"
                >
                  {testConnection.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  <span>Test Connection</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDisconnectDialogOpen(true)}
                  className="h-8 gap-1 rounded-lg text-xs text-slate-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-3.5" />
                  <span>Disconnect GitLab</span>
                </Button>
              </div>
            </div>
          ) : isConnecting ? (
            /* ── AUTHORIZED BUT PROJECT PENDING ── */
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                <Info className="size-4 text-amber-600" />
                <span>Authorized as @{data?.gitlabUsername}. Select a repository to complete setup.</span>
              </div>
              <p className="text-xs text-slate-600">
                BrandShield needs to know which GitLab repository to monitor for push and merge request events.
              </p>
              <Button
                size="sm"
                onClick={() => setIsProjectPickerOpen(true)}
                className="h-9 gap-2 rounded-xl bg-orange-600 text-xs font-semibold text-white hover:bg-orange-700 shadow-xs"
              >
                <FolderGit2 className="size-4" />
                <span>Select GitLab Repository</span>
              </Button>
            </div>
          ) : (
            /* ── DISCONNECTED STATE ── */
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-5 text-center space-y-3">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-xs">
                  <GitLabIcon className="size-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">Connect Your GitLab Project</h3>
                  <p className="text-xs text-slate-500">
                    One-click onboarding automatically provisions webhooks with dynamic secrets and configures commit status checks.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {data?.configured ? (
                    <Button
                      size="sm"
                      asChild
                      className="h-9 gap-2 rounded-xl bg-orange-600 text-xs font-semibold text-white hover:bg-orange-700 shadow-xs"
                    >
                      <a href="/api/integrations/gitlab/auth">
                        <GitLabIcon className="size-4" />
                        <span>Connect GitLab</span>
                      </a>
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 text-left max-w-lg mx-auto">
                        <p className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="size-4 text-amber-600" />
                          GitLab OAuth App Not Configured
                        </p>
                        <p className="mt-1 text-[11px] text-amber-700">
                          Set <code className="font-mono font-bold">GITLAB_CLIENT_ID</code> and{" "}
                          <code className="font-mono font-bold">GITLAB_CLIENT_SECRET</code> in environment settings to enable one-click OAuth customer onboarding.
                        </p>
                      </div>

                      {data?.patAvailable && (
                        <Button
                          size="sm"
                          onClick={() => setIsProjectPickerOpen(true)}
                          className="h-9 gap-2 rounded-xl bg-orange-600 text-xs font-semibold text-white hover:bg-orange-700 shadow-xs"
                        >
                          <FolderGit2 className="size-4" />
                          <span>Select Repository (Using Server PAT)</span>
                        </Button>
                      )}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsManualSetupOpen(true)}
                    className="h-9 gap-1.5 rounded-xl text-xs"
                  >
                    <Info className="size-3.5 text-slate-500" />
                    <span>Manual Setup Guide</span>
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Lock className="size-3 text-teal-600" /> AES-256-GCM Tokens
                  </span>
                  <span>•</span>
                  <span>Least-Privilege Scopes</span>
                  <span>•</span>
                  <span>Anti-CSRF Nonce Protection</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── PROJECT PICKER DIALOG ── */}
      <Dialog open={isProjectPickerOpen} onOpenChange={setIsProjectPickerOpen}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <GitLabIcon className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Select GitLab Repository
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select a repository where you have Maintainer or Developer access to automatically install the BrandShield webhook.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                placeholder="Search your GitLab projects..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="pl-9 h-9 rounded-xl text-xs"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {projectsQuery.isLoading ? (
                <div className="flex items-center justify-center p-8 text-xs text-slate-400">
                  <Loader2 className="mr-2 size-4 animate-spin text-orange-500" />
                  Loading your accessible repositories...
                </div>
              ) : projectsQuery.isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs text-red-700">
                  <ShieldAlert className="mx-auto size-5 text-red-500 mb-1" />
                  <p className="font-semibold">Failed to load GitLab projects</p>
                  <p className="mt-1 text-[11px] text-red-600">
                    {(projectsQuery.error as Error)?.message || "Authorization may have expired. Please reconnect."}
                  </p>
                </div>
              ) : projectsQuery.data?.projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                  No repositories found matching your search. Ensure your GitLab account has at least Developer access.
                </div>
              ) : (
                projectsQuery.data?.projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-orange-300 hover:bg-orange-50/20 transition-colors shadow-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 truncate">
                          {p.pathWithNamespace}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono uppercase text-slate-600">
                          {p.visibility}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Default branch: <span className="font-mono text-slate-600">{p.defaultBranch}</span>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      disabled={setupWebhook.isPending}
                      onClick={() => setupWebhook.mutate(p.id)}
                      className="h-8 shrink-0 rounded-lg bg-orange-600 text-xs font-semibold text-white hover:bg-orange-700 shadow-xs"
                    >
                      {setupWebhook.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <span>Connect</span>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-slate-100 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsManualSetupOpen(true)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Manual setup fallback
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProjectPickerOpen(false)}
              className="text-xs rounded-lg"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DISCONNECT CONFIRMATION DIALOG ── */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Disconnect GitLab Integration?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This will remove the automated webhook from your GitLab repository and stop pre-publishing compliance checks for incoming commits.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDisconnectDialogOpen(false)}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={disconnectMutation.isPending}
              onClick={() => disconnectMutation.mutate()}
              className="rounded-lg bg-red-600 text-xs font-semibold text-white hover:bg-red-700 shadow-xs"
            >
              {disconnectMutation.isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
              <span>Confirm Disconnect</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MANUAL SETUP FALLBACK MODAL ── */}
      <Dialog open={isManualSetupOpen} onOpenChange={setIsManualSetupOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Manual GitLab Webhook Configuration
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              If your GitLab account lacks project webhook creation permissions, you can manually configure the webhook in GitLab project settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-slate-600">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Webhook URL</span>
              <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] text-slate-800 break-all">
                <span>{typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/incoming/prepublish?orgSlug=nimbus-labs` : "/api/webhooks/incoming/prepublish"}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    copy(
                      typeof window !== "undefined"
                        ? `${window.location.origin}/api/webhooks/incoming/prepublish?orgSlug=nimbus-labs`
                        : "https://brandshield-ai-five.vercel.app/api/webhooks/incoming/prepublish?orgSlug=nimbus-labs",
                      "manual_url"
                    )
                  }
                  className="size-7 shrink-0 text-slate-500"
                >
                  {copiedKey === "manual_url" ? <Check className="size-3 text-teal-600" /> : <Copy className="size-3" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 rounded-xl bg-orange-50/60 p-3 text-[11px] text-orange-950 border border-orange-200/50">
              <p className="font-semibold">GitLab Configuration Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-700">
                <li>Navigate to your repository on GitLab.</li>
                <li>Go to <span className="font-semibold">Settings → Webhooks</span>.</li>
                <li>Paste the URL above into the <span className="font-semibold">URL</span> field.</li>
                <li>Under Trigger, check <span className="font-semibold">Push events</span> and <span className="font-semibold">Merge requests events</span>.</li>
                <li>Check <span className="font-semibold">Enable SSL verification</span>.</li>
                <li>Click <span className="font-semibold">Add webhook</span>.</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsManualSetupOpen(false)}
              className="rounded-lg text-xs"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
