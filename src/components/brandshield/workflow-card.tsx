"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileCheck2,
  FolderGit2,
  GitBranch,
  Layers,
  Lock,
  PlayCircle,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWorkflow, type WorkflowStageItem } from "@/lib/brandshield/client";
import { useLang } from "@/lib/brandshield/i18n";
import { useUIStore, type ViewKey } from "@/lib/brandshield/store";
import { cn } from "@/lib/brandshield/utils";

const STAGE_ICONS = [
  FolderGit2,
  GitBranch,
  Layers,
  ScanSearch,
  ShieldAlert,
  FileCheck2,
  ShieldCheck,
];

export function WorkflowCard() {
  const { lang, t } = useLang();
  const workflow = useWorkflow();
  const setView = useUIStore((s) => s.setView);

  const data = workflow.data;
  if (!data) return null;

  const isHindi = lang === "hi";

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-6">
        {/* Header with Title and Progress */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <Workflow className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                {isHindi ? "7-चरणीय ब्रांड शासन जीवनचक्र" : "7-Stage Brand Governance Lifecycle"}
              </h2>
              <Badge
                variant="outline"
                className="border-teal-200 bg-teal-50/70 text-xs font-semibold text-teal-800"
              >
                {isHindi
                  ? `${data.completedCount} / ${data.totalStages} पूर्ण (${data.percentage}%)`
                  : `${data.completedCount} of ${data.totalStages} Completed (${data.percentage}%)`}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {isHindi
                ? "दिशानिर्देश अंतर्ग्रहण से अपरिवर्तनीय ऑडिट तक पूर्ण डेटाबेस-संचालित प्रगति"
                : "Live database-driven governance progression from guideline ingestion to cryptographic audit trail"}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:w-64">
            <Progress value={data.percentage} className="h-2.5 flex-1 bg-slate-100" />
            <span className="font-mono text-xs font-bold text-teal-700">{data.percentage}%</span>
          </div>
        </div>

        {/* 7-Stage Horizontal Step Grid */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
          {data.stages.map((stage, idx) => {
            const Icon = STAGE_ICONS[idx % STAGE_ICONS.length];
            const title = isHindi ? stage.nameHi : stage.name;
            const desc = isHindi ? stage.descriptionHi : stage.description;
            const detail = isHindi ? stage.detailHi : stage.detail;

            return (
              <motion.button
                key={stage.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView(stage.targetView as ViewKey)}
                className={cn(
                  "group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all",
                  stage.completed
                    ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50/80"
                    : stage.current
                    ? "border-teal-400 bg-teal-50/30 shadow-sm ring-1 ring-teal-300 hover:bg-teal-50/60"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white"
                )}
              >
                <div>
                  {/* Top indicator & icon */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                        stage.completed
                          ? "bg-emerald-600 text-white"
                          : stage.current
                          ? "bg-teal-700 text-white"
                          : "bg-slate-200 text-slate-600"
                      )}
                    >
                      {stage.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                      ) : (
                        stage.id
                      )}
                    </span>

                    <span
                      className={cn(
                        "text-[10px] font-medium uppercase tracking-wider",
                        stage.completed
                          ? "text-emerald-700"
                          : stage.current
                          ? "text-teal-700"
                          : "text-slate-400"
                      )}
                    >
                      {stage.completed
                        ? isHindi
                          ? "पूर्ण"
                          : "Done"
                        : stage.current
                        ? isHindi
                          ? "सक्रिय"
                          : "Active"
                        : isHindi
                        ? "आगामी"
                        : "Next"}
                    </span>
                  </div>

                  {/* Stage Name */}
                  <h3 className="mt-2.5 text-xs font-semibold leading-snug text-slate-900 group-hover:text-teal-700">
                    {title}
                  </h3>

                  {/* Description */}
                  <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-slate-500">
                    {desc}
                  </p>
                </div>

                {/* Footer with detail pill & arrow */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[10px]">
                  <span
                    className={cn(
                      "font-mono font-medium",
                      stage.completed ? "text-emerald-800" : "text-slate-600"
                    )}
                  >
                    {detail}
                  </span>
                  <ChevronRight className="h-3 w-3 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-700" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
