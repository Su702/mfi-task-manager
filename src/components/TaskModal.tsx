import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  Clock3,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/context/TaskContext";
import {
  DEPT_META,
  PRIORITY_META,
  STATUS_META,
  type Priority,
  type Task,
  type TaskStatus,
  type WorkDepartment,
} from "@/types";

const DEPT_KEYS: WorkDepartment[] = ["mfi-ops", "mfi-it", "daily-life"];
const STATUS_KEYS: TaskStatus[] = ["todo", "in_progress", "review", "blocked", "completed"];
const PRIORITY_KEYS: Priority[] = ["urgent", "high", "medium", "low"];

interface Draft {
  title: string;
  description: string;
  department: WorkDepartment;
  category: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  estimateHours: string;
  assignee: string;
  tags: string;
}

const emptyDraft: Draft = {
  title: "",
  description: "",
  department: "mfi-ops",
  category: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  estimateHours: "1",
  assignee: "Me",
  tags: "",
};

export function TaskModal({
  task,
  open,
  onClose,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}) {
  const {
    createTask,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    removeSubtask,
  } = useTasks();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [subtaskTitle, setSubtaskTitle] = useState("");

  useEffect(() => {
    if (!open) return;
    if (task) {
      setDraft({
        title: task.title,
        description: task.description,
        department: task.department,
        category: task.category,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ?? "",
        estimateHours: String(task.estimateHours),
        assignee: task.assignee,
        tags: task.tags.join(", "),
      });
    } else {
      setDraft(emptyDraft);
    }
    setSubtaskTitle("");
  }, [task, open]);

  const patch = (next: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...next }));

  const handleSave = () => {
    if (!draft.title.trim()) {
      toast.error("Give the task a title first");
      return;
    }
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      department: draft.department,
      category: draft.category.trim() || "General",
      status: draft.status,
      priority: draft.priority,
      dueDate: draft.dueDate || null,
      estimateHours: Number(draft.estimateHours) || 0,
      assignee: draft.assignee.trim() || "Me",
      tags: draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (task) {
      updateTask(task.id, payload);
      toast.success("Task updated");
    } else {
      createTask(payload);
      toast.success("Task created");
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {task ? "Task detail" : "New task"}
                </p>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  {task ? "Edit and track work" : "Add something to the workspace"}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-slate-500 transition hover:bg-muted"
              >
                <X className="h-4 w-4" strokeWidth={1.9} />
              </button>
            </div>

            <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-4 md:grid-cols-[1.35fr_1fr]">
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-medium text-slate-700">Title</label>
                  <input
                    value={draft.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="e.g. Branch cash vault reconciliation"
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Department</label>
                  <div className="mt-1 grid grid-cols-3 gap-1.5">
                    {DEPT_KEYS.map((key) => {
                      const meta = DEPT_META[key];
                      const active = draft.department === key;
                      return (
                        <button
                          key={key}
                          onClick={() => patch({ department: key })}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-border bg-background text-slate-600 hover:bg-muted"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-300" : meta.dot}`} />
                          {meta.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Category</label>
                    <input
                      value={draft.category}
                      onChange={(e) => patch({ category: e.target.value })}
                      placeholder="Compliance"
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Assignee</label>
                    <input
                      value={draft.assignee}
                      onChange={(e) => patch({ assignee: e.target.value })}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Priority</label>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {PRIORITY_KEYS.map((key) => {
                      const meta = PRIORITY_META[key];
                      const active = draft.priority === key;
                      return (
                        <button
                          key={key}
                          onClick={() => patch({ priority: key })}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : `${meta.chip} hover:brightness-95`
                          }`}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-slate-700">
                      <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} /> Due date
                    </label>
                    <input
                      type="date"
                      value={draft.dueDate}
                      onChange={(e) => patch({ dueDate: e.target.value })}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-medium text-slate-700">
                      <Clock3 className="h-3.5 w-3.5" strokeWidth={1.8} /> Estimate (h)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={draft.estimateHours}
                      onChange={(e) => patch({ estimateHours: e.target.value })}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Status</label>
                  <select
                    value={draft.status}
                    onChange={(e) => patch({ status: e.target.value as TaskStatus })}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-emerald-400"
                  >
                    {STATUS_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {STATUS_META[key].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">Notes</label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => patch({ description: e.target.value })}
                    rows={3}
                    placeholder="Context, acceptance criteria, escalation path"
                    className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Tags (comma separated)
                  </label>
                  <input
                    value={draft.tags}
                    onChange={(e) => patch({ tags: e.target.value })}
                    placeholder="vault, reconciliation"
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-slate-800">Checklist</p>
                  {task ? (
                    <>
                      <div className="mt-2 space-y-1.5">
                        {task.subtasks.map((sub) => (
                          <div key={sub.id} className="group flex items-center gap-2">
                            <button
                              onClick={() => toggleSubtask(task.id, sub.id)}
                              className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
                                sub.done
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "border-border bg-background hover:border-emerald-400"
                              }`}
                              aria-label={`Toggle ${sub.title}`}
                            >
                              {sub.done && <Check className="h-3 w-3" strokeWidth={3} />}
                            </button>
                            <span
                              className={`flex-1 text-xs ${
                                sub.done
                                  ? "text-muted-foreground line-through"
                                  : "text-slate-700"
                              }`}
                            >
                              {sub.title}
                            </span>
                            <button
                              onClick={() => removeSubtask(task.id, sub.id)}
                              aria-label={`Remove ${sub.title}`}
                              className="opacity-0 transition group-hover:opacity-100"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-rose-500" />
                            </button>
                          </div>
                        ))}
                        {!task.subtasks.length && (
                          <p className="text-[11px] text-muted-foreground">
                            No checklist items yet.
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <input
                          value={subtaskTitle}
                          onChange={(e) => setSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              addSubtask(task.id, subtaskTitle);
                              setSubtaskTitle("");
                            }
                          }}
                          placeholder="Add a step"
                          className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs outline-none focus:border-emerald-400"
                        />
                        <button
                          onClick={() => {
                            addSubtask(task.id, subtaskTitle);
                            setSubtaskTitle("");
                          }}
                          aria-label="Add checklist item"
                          className="grid h-8 w-8 place-items-center rounded-md bg-slate-900 text-white transition hover:bg-slate-800"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Save the task first, then add checklist steps.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-border p-3">
                  <p className="text-xs font-semibold text-slate-800">Activity</p>
                  <div className="mt-2 space-y-2">
                    {task?.activities.length ? (
                      task.activities.slice(0, 6).map((item) => (
                        <div key={item.id} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          <div>
                            <p className="text-[11px] text-slate-700">{item.message}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(item.at).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Activity appears here as work moves forward.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-5 py-3">
              {task ? (
                <button
                  onClick={() => {
                    deleteTask(task.id);
                    toast.success("Task deleted");
                    onClose();
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.9} /> Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                >
                  {task ? "Save changes" : "Create task"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}