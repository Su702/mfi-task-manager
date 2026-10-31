import { AnimatePresence, motion } from "framer-motion";
import {
  Copy,
  Flag,
  ListChecks,
  Pencil,
  SearchX,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/context/TaskContext";
import {
  BOARD_COLUMNS,
  DEPT_META,
  PRIORITY_META,
  daysUntil,
  dueLabel,
  type Task,
  type TaskStatus,
} from "@/types";

interface ViewProps {
  tasks: Task[];
  onOpen: (task: Task) => void;
}

function Progress({ task }: { task: Task }) {
  const total = task.subtasks.length;
  if (!total) return null;
  const done = task.subtasks.filter((s) => s.done).length;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {done}/{total}
      </span>
    </div>
  );
}

function DeptChip({ task }: { task: Task }) {
  const meta = DEPT_META[task.department];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.short}
    </span>
  );
}

function PriorityChip({ task }: { task: Task }) {
  const meta = PRIORITY_META[task.priority];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.chip}`}
    >
      <Flag className="h-3 w-3" strokeWidth={2.2} />
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = BOARD_COLUMNS.find((c) => c.status === status);
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "completed"
            ? "bg-emerald-500"
            : status === "blocked"
              ? "bg-rose-500"
              : "bg-slate-400"
        }`}
      />
      {meta?.label ?? "Blocked"}
    </span>
  );
}

function EmptyState() {
  const { resetFilters } = useTasks();
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-background text-slate-400 shadow-sm">
        <SearchX className="h-5 w-5" strokeWidth={1.7} />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-800">No tasks match this view</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        Adjust the department, status or priority filters, or clear the search to
        see the rest of the workspace.
      </p>
      <button
        onClick={resetFilters}
        className="mt-4 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-muted active:scale-[0.98]"
      >
        Clear filters
      </button>
    </div>
  );
}

export function ListView({ tasks, onOpen }: ViewProps) {
  const { cycleStatus, deleteTask, duplicateTask } = useTasks();

  if (!tasks.length) return <EmptyState />;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[28px_1fr_120px_110px_130px_96px] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:grid">
        <span />
        <span>Task</span>
        <span>Department</span>
        <span>Priority</span>
        <span>Due</span>
        <span className="text-right">Actions</span>
      </div>
      <AnimatePresence initial={false}>
        {tasks.map((task) => {
          const due = dueLabel(task.dueDate);
          const overdue = (daysUntil(task.dueDate) ?? 1) < 0;
          const done = task.status === "completed";
          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="group grid grid-cols-[28px_1fr_auto] items-start gap-3 border-b border-border/70 px-4 py-3 transition last:border-b-0 hover:bg-muted/30 lg:grid-cols-[28px_1fr_120px_110px_130px_96px] lg:items-center"
            >
              <button
                onClick={() => cycleStatus(task.id)}
                aria-label="Toggle task status"
                className={`mt-0.5 grid h-5 w-5 place-items-center rounded-md border transition lg:mt-0 ${
                  done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-border bg-background hover:border-emerald-400"
                }`}
              >
                {done && (
                  <motion.svg
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                )}
              </button>

              <button
                onClick={() => onOpen(task)}
                className="min-w-0 text-left"
              >
                <p
                  className={`truncate text-sm font-medium ${
                    done ? "text-muted-foreground line-through" : "text-slate-900"
                  }`}
                >
                  {task.title}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="font-medium text-slate-500">{task.category}</span>
                  <StatusBadge status={task.status} />
                  <span className="lg:hidden">{due.text}</span>
                  <span className="lg:hidden">{PRIORITY_META[task.priority].label}</span>
                  <Progress task={task} />
                </div>
              </button>

              <div className="hidden lg:block">
                <DeptChip task={task} />
              </div>

              <div className="hidden lg:block">
                <PriorityChip task={task} />
              </div>

              <div className="hidden lg:block">
                <p
                  className={`text-xs font-medium ${
                    overdue && !done ? "text-rose-600" : due.tone
                  }`}
                >
                  {due.text}
                </p>
              </div>

              <div className="flex items-center justify-end gap-0.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                <button
                  onClick={() => onOpen(task)}
                  aria-label="Edit task"
                  className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-muted hover:text-slate-900"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
                <button
                  onClick={() => {
                    duplicateTask(task.id);
                    toast.success("Task duplicated");
                  }}
                  aria-label="Duplicate task"
                  className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-muted hover:text-slate-900"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
                <button
                  onClick={() => {
                    deleteTask(task.id);
                    toast.success("Task deleted");
                  }}
                  aria-label="Delete task"
                  className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function BoardView({ tasks, onOpen }: ViewProps) {
  const { setStatus } = useTasks();
  const columns = [
    ...BOARD_COLUMNS,
    { status: "blocked" as TaskStatus, label: "Blocked" },
  ];

  if (!tasks.length) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {columns.map((column) => {
        const items = tasks.filter((t) => t.status === column.status);
        return (
          <div key={column.status} className="flex min-w-0 flex-col rounded-2xl bg-muted/40 p-2">
            <div className="flex items-center justify-between px-1.5 py-1.5">
              <p className="text-xs font-semibold text-slate-700">{column.label}</p>
              <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] tabular-nums text-slate-500">
                {items.length}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <AnimatePresence initial={false}>
                {items.map((task) => (
                  <motion.article
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="rounded-xl border border-border bg-card p-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
                  >
                    <button onClick={() => onOpen(task)} className="w-full text-left">
                      <div className="flex items-center justify-between gap-2">
                        <DeptChip task={task} />
                        <PriorityChip task={task} />
                      </div>
                      <p
                        className={`mt-2 text-sm font-medium leading-snug ${
                          task.status === "completed"
                            ? "text-muted-foreground line-through"
                            : "text-slate-900"
                        }`}
                      >
                        {task.title}
                      </p>
                    </button>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className={dueLabel(task.dueDate).tone}>
                          {dueLabel(task.dueDate).text}
                        </span>
                      </div>
                      <Progress task={task} />
                    </div>
                    <div className="mt-2 flex items-center gap-1 border-t border-border/60 pt-2">
                      <ListChecks className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.8} />
                      <select
                        value={task.status}
                        onChange={(e) => setStatus(task.id, e.target.value as TaskStatus)}
                        className="w-full cursor-pointer rounded-md bg-transparent text-[11px] text-slate-600 outline-none"
                        aria-label={`Move ${task.title}`}
                      >
                        {columns.map((c) => (
                          <option key={c.status} value={c.status}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
              {!items.length && (
                <p className="rounded-xl border border-dashed border-border px-2 py-6 text-center text-[11px] text-muted-foreground">
                  Nothing here
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}