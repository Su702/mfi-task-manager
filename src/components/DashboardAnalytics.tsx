import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/context/TaskContext";
import {
  DEPT_META,
  PRIORITY_META,
  daysUntil,
  type Priority,
  type Task,
  type WorkDepartment,
} from "@/types";

const TEMPLATES: {
  title: string;
  department: WorkDepartment;
  category: string;
  priority: Priority;
  estimateHours: number;
  steps: string[];
}[] = [
  {
    title: "Branch cash vault audit",
    department: "mfi-ops",
    category: "Cash management",
    priority: "high",
    estimateHours: 2,
    steps: ["Count cash with a witness", "Match ledger balance", "Sign off variance sheet"],
  },
  {
    title: "Loan disbursement verification",
    department: "mfi-ops",
    category: "Loan disbursement",
    priority: "urgent",
    estimateHours: 3,
    steps: ["Confirm group attendance", "Validate wallet numbers", "Release batch"],
  },
  {
    title: "Core banking EOD run",
    department: "mfi-it",
    category: "Core banking",
    priority: "urgent",
    estimateHours: 2,
    steps: ["Snapshot database", "Run batch", "Check accrual report"],
  },
  {
    title: "Nightly backup restore test",
    department: "mfi-it",
    category: "Backup and recovery",
    priority: "medium",
    estimateHours: 2,
    steps: ["Restore to staging", "Compare row counts"],
  },
  {
    title: "Weekly grocery and meal prep",
    department: "daily-life",
    category: "Household",
    priority: "medium",
    estimateHours: 2,
    steps: ["Write shopping list", "Market run", "Prep lunches"],
  },
];

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Clock;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tone}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function DashboardAnalytics({ onOpen }: { onOpen: (task: Task) => void }) {
  const { tasks, createTask } = useTasks();

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter((t) => {
    const d = daysUntil(t.dueDate);
    return t.status !== "completed" && d !== null && d < 0;
  });
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const deptStats = (["mfi-ops", "mfi-it", "daily-life"] as WorkDepartment[]).map(
    (id) => {
      const items = tasks.filter((t) => t.department === id);
      const done = items.filter((t) => t.status === "completed").length;
      return {
        id,
        total: items.length,
        done,
        open: items.length - done,
        pct: items.length ? Math.round((done / items.length) * 100) : 0,
      };
    },
  );

  const priorities: Priority[] = ["urgent", "high", "medium", "low"];
  const priorityStats = priorities.map((p) => ({
    id: p,
    count: tasks.filter((t) => t.priority === p && t.status !== "completed").length,
  }));
  const maxPriority = Math.max(1, ...priorityStats.map((p) => p.count));

  const attention = [...tasks]
    .filter((t) => t.status !== "completed")
    .sort((a, b) => {
      const aDue = daysUntil(a.dueDate) ?? 999;
      const bDue = daysUntil(b.dueDate) ?? 999;
      if (aDue !== bDue) return aDue - bDue;
      return PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight;
    })
    .slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Open work"
          value={String(total - completed)}
          hint={`${total} tasks tracked in total`}
          icon={Clock}
          tone="bg-slate-100 text-slate-700"
        />
        <StatCard
          label="Completion"
          value={`${completionRate}%`}
          hint={`${completed} closed tasks`}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Overdue"
          value={String(overdue.length)}
          hint="Past the due date and still open"
          icon={AlertTriangle}
          tone="bg-rose-50 text-rose-600"
        />
        <StatCard
          label="MFI ops compliance"
          value={`${deptStats[0].pct}%`}
          hint="Operations tasks closed this cycle"
          icon={TrendingUp}
          tone="bg-indigo-50 text-indigo-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Workload by department</p>
              <p className="text-[11px] text-muted-foreground">
                Closed against open work in each stream
              </p>
            </div>
            <BarChart3 className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
          </div>
          <div className="mt-4 space-y-3.5">
            {deptStats.map((stat) => {
              const meta = DEPT_META[stat.id];
              return (
                <div key={stat.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {stat.done}/{stat.total} closed
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${meta.bar}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-border pt-3">
            <p className="text-xs font-semibold text-slate-800">Open by priority</p>
            <div className="mt-2 flex items-end gap-4">
              {priorityStats.map((p) => (
                <div key={p.id} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-20 w-full items-end justify-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{
                        height: `${Math.max(6, (p.count / maxPriority) * 100)}%`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`w-full max-w-8 rounded-t-md ${PRIORITY_META[p.id].dot}`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {PRIORITY_META[p.id].label}
                  </span>
                  <span className="text-[11px] tabular-nums text-slate-700">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Needs attention</p>
            <AlertTriangle className="h-4 w-4 text-amber-500" strokeWidth={1.8} />
          </div>
          <div className="mt-3 space-y-2">
            {attention.map((task) => {
              const due = daysUntil(task.dueDate);
              return (
                <button
                  key={task.id}
                  onClick={() => onOpen(task)}
                  className="flex w-full items-start gap-2 rounded-xl border border-border/70 p-2.5 text-left transition hover:border-slate-300 hover:bg-muted/30"
                >
                  <span
                    className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                      DEPT_META[task.department].dot
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-800">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {task.category} ·{" "}
                      <span className={due !== null && due < 0 ? "text-rose-600" : ""}>
                        {due === null
                          ? "No due date"
                          : due < 0
                            ? `${Math.abs(due)}d overdue`
                            : due === 0
                              ? "Due today"
                              : `in ${due}d`}
                      </span>
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300" />
                </button>
              );
            })}
            {!attention.length && (
              <p className="rounded-xl border border-dashed border-border py-6 text-center text-[11px] text-muted-foreground">
                Everything is closed. Nice work.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600" strokeWidth={1.9} />
          <p className="text-sm font-semibold text-slate-900">Quick templates</p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Start recurring MFI and personal routines with a checklist already in place.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.title}
              onClick={() => {
                createTask({
                  title: tpl.title,
                  department: tpl.department,
                  category: tpl.category,
                  priority: tpl.priority,
                  estimateHours: tpl.estimateHours,
                  dueDate: new Date().toISOString().slice(0, 10),
                  subtasks: tpl.steps.map((step, i) => ({
                    id: `${Date.now()}-${i}`,
                    title: step,
                    done: false,
                  })),
                });
                toast.success(`${tpl.title} added`);
              }}
              className="group rounded-xl border border-border p-3 text-left transition hover:-translate-y-[1px] hover:border-emerald-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    DEPT_META[tpl.department].chip
                  }`}
                >
                  {DEPT_META[tpl.department].short}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ~{tpl.estimateHours}h
                </span>
              </div>
              <p className="mt-1.5 text-xs font-medium text-slate-800">{tpl.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {tpl.steps.length} checklist steps
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}