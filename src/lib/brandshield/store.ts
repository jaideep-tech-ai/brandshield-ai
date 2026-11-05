"use client";

import { create } from "zustand";

export type ViewKey =
  | "dashboard"
  | "knowledge"
  | "scanner"
  | "findings"
  | "approvals"
  | "analytics"
  | "billing"
  | "settings";

interface UIState {
  view: ViewKey;
  selectedSubmissionId: string | null;
  sidebarCollapsed: boolean;
  setView: (v: ViewKey, submissionId?: string | null) => void;
  openSubmission: (submissionId: string, view?: ViewKey) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  view: "dashboard",
  selectedSubmissionId: null,
  sidebarCollapsed: false,
  setView: (v, submissionId = null) => set({ view: v, selectedSubmissionId: submissionId }),
  openSubmission: (submissionId, view = "findings") => set({ view, selectedSubmissionId: submissionId }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
