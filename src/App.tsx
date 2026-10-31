import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Filter, ListFilter, X } from "lucide-react";
import { Toaster } from "sonner";
import { TaskProvider, useTasks } from "@/context/TaskContext";
import { Navbar } from "@/components/Navbar";
import { BoardView, ListView } from "@/components/TaskViews";
import { TaskModal } from "@/components/TaskModal";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import {
  DEPT_META,
  PRIORITY_META,
  STATUS_META,
  dueLabel,
  type Priority,
  type SortKey,
  type Task,
  type TaskStatus,
  type ViewMode,
} from "@/types";

const STATUS_OPTIONS: (TaskStatus | "all")[] = [
  "all",
  "todo",
  "in_progress",
  "review",
  "blocked",
  "completed",
];

const PRIORITY_OPTIONS: (Priority | "all")[] = [
  "all",
  "urgent",
  "high",
  "medium",
  "low",
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "due", label: "Due date" },
  { id: "priority", label: "Priority" },
  { id: "created", label: "Newest" },
  { id: "status", label: "Status" },
];

function Workspace() {
  const { tasks, visibleTasks, filters, setFilters, resetFilters } = useTasks();
  const [view, setView] = useState<ViewMode>("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const openTask = (task: Task) => {
    setActiveTask(task);
    setModalOpen(true);
  };

  const newTask = () => {
    setActiveTask(null);
    setModalOpen(true);
  };

  const summary = useMemo(() => {
    const scope =
      filters.department === "all"
        ? tasks
        : tasks.filter((t) => t.department === filters.department);
    const done = scope.filter((t) => t.status === "completed").length;
    const next = scope
      .filter((t) => t.status !== "completed" && t.dueDate)
      .sort(
        (a, b) =>
          new Date(a.dueDate as string).getTime() -
          new Date(b.dueDate as string).getTime(),
      )[0];
    return {
      total: scope.length,
      done,
      pct: scope.length ? Math.round((done / scope.length) * 100) : 0,
      nextLabel: next ? dueLabel(next.dueDate).text : "Nothing scheduled",
      nextTitle: next?.title ?? "Add a due date to your next task",
    };
  }, [tasks, filters.department]);

  const activeFilters =
    filters.status !== "all" || filters.priority !== "all" || filters.query.trim();

  return (
    <div className="min-h-[100dvh] bg-zinc-50 text-foreground">
      <Navbar view={view} onViewChange={setView} onNewTask={newTask} />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6">
        <section className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {filters.department === "all"
                ? "Executive overview"
                : DEPT_META[filters.department].label}
            </p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900">
              {summary.done} of {summary.total} tasks closed
            </h1>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              Next up: <span className="text-slate-700">{summary.nextTitle}</span> ·{" "}
              {summary.nextLabel}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-emerald-500"
                />
              </div>
              <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                {summary.pct}% completion
              </p>
            </div>
            <button
              onClick={newTask}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-muted active:scale-[0.98]"
            >
              Add task
            </button>
          </div>
        </section>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2 py-1.5 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.9} />
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ status: e.target.value as TaskStatus | "all" })
              }
              className="cursor-pointer bg-transparent text-xs font-medium text-slate-700 outline-none"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2 py-1.5 shadow-sm">
            <ListFilter className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.9} />
            <select
              value={filters.priority}
              onChange={(e) =>
                setFilters({ priority: e.target.value as Priority | "all" })
              }
              className="cursor-pointer bg-transparent text-xs font-medium text-slate-700 outline-none"
              aria-label="Filter by priority"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All priorities" : PRIORITY_META[p].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2 py-1.5 shadow-sm">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.9} />
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ sort: e.target.value as SortKey })}
              className="cursor-pointer bg-transparent text-xs font-medium text-slate-700 outline-none"
              aria-label="Sort tasks"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
          </div>

          {activeFilters ? (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-muted"
            >
              <X className="h-3 w-3" strokeWidth={2.4} /> Clear
            </button>
          ) : null}

          <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
            {visibleTasks.length} shown
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {view === "list" && <ListView tasks={visibleTasks} onOpen={openTask} />}
            {view === "board" && <BoardView tasks={visibleTasks} onOpen={openTask} />}
            {view === "analytics" && <DashboardAnalytics onOpen={openTask} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <TaskModal
        task={activeTask}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveTask(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <TaskProvider>
      <Toaster position="top-right" richColors closeButton />
      <Workspace />
    </TaskProvider>
  );
}