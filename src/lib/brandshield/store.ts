"use client";

import { create } from "zustand";

export type ViewKey =
  | "dashboard"
  | "copilot"
  | "knowledge"
  | "scanner"
  | "findings"
  | "approvals"
  | "analytics"
  | "integrations"
  | "billing"
  | "settings";

interface UIState {
  view: ViewKey;
  selectedSubmissionId: string | null;
  sidebarCollapsed: boolean;
  tourOpen: boolean;
  chatbotOpen: boolean;
  setView: (v: ViewKey, submissionId?: string | null) => void;
  openSubmission: (submissionId: string, view?: ViewKey) => void;
  toggleSidebar: () => void;
  setTourOpen: (open: boolean) => void;
  setChatbotOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  view: "dashboard",
  selectedSubmissionId: null,
  sidebarCollapsed: false,
  tourOpen: false,
  chatbotOpen: false,
  setView: (v, submissionId = null) => set({ view: v, selectedSubmissionId: submissionId }),
  openSubmission: (submissionId, view = "findings") => set({ view, selectedSubmissionId: submissionId }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setTourOpen: (open) => set({ tourOpen: open }),
  setChatbotOpen: (open) => set({ chatbotOpen: open }),
}));
