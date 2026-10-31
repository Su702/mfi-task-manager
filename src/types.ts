export type DepartmentId = "all" | "mfi-ops" | "mfi-it" | "daily-life";
export type WorkDepartment = Exclude<DepartmentId, "all">;
export type TaskStatus = "todo" | "in_progress" | "review" | "completed" | "blocked";
export type Priority = "urgent" | "high" | "medium" | "low";
export type ViewMode = "list" | "board" | "analytics";
export type SortKey = "due" | "priority" | "created" | "status";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface ActivityItem {
  id: string;
  message: string;
  at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  department: WorkDepartment;
  category: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  estimateHours: number;
  assignee: string;
  tags: string[];
  subtasks: Subtask[];
  activities: ActivityItem[];
  createdAt: string;
}

export interface Filters {
  department: DepartmentId;
  status: TaskStatus | "all";
  priority: Priority | "all";
  query: string;
  sort: SortKey;
}

export interface DepartmentMeta {
  id: DepartmentId;
  label: string;
  short: string;
  chip: string;
  dot: string;
  bar: string;
  text: string;
}

export const DEPT_META: Record<DepartmentId, DepartmentMeta> = {
  all: {
    id: "all",
    label: "All tasks",
    short: "All",
    chip: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    bar: "bg-slate-400",
    text: "text-slate-600",
  },
  "mfi-ops": {
    id: "mfi-ops",
    label: "MFI Operations",
    short: "Operations",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    text: "text-emerald-600",
  },
  "mfi-it": {
    id: "mfi-it",
    label: "MFI IT",
    short: "IT",
    chip: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    bar: "bg-indigo-500",
    text: "text-indigo-600",
  },
  "daily-life": {
    id: "daily-life",
    label: "Daily Life",
    short: "Daily Life",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    text: "text-amber-600",
  },
};

export const STATUS_META: Record<
  TaskStatus,
  { label: string; chip: string; dot: string; order: number }
> = {
  todo: {
    label: "To do",
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
    order: 0,
  },
  in_progress: {
    label: "In progress",
    chip: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
    order: 1,
  },
  review: {
    label: "In review",
    chip: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
    order: 2,
  },
  blocked: {
    label: "Blocked",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    order: 3,
  },
  completed: {
    label: "Completed",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    order: 4,
  },
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; chip: string; weight: number; dot: string }
> = {
  urgent: {
    label: "Urgent",
    chip: "bg-rose-100 text-rose-700 border-rose-200",
    weight: 4,
    dot: "bg-rose-500",
  },
  high: {
    label: "High",
    chip: "bg-orange-100 text-orange-700 border-orange-200",
    weight: 3,
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    chip: "bg-amber-100 text-amber-700 border-amber-200",
    weight: 2,
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    chip: "bg-slate-100 text-slate-600 border-slate-200",
    weight: 1,
    dot: "bg-slate-400",
  },
};

export const BOARD_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "review", label: "In review" },
  { status: "completed", label: "Completed" },
];

export const DEFAULT_FILTERS: Filters = {
  department: "all",
  status: "all",
  priority: "all",
  query: "",
  sort: "due",
};

export function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const due = new Date(`${iso}T12:00:00`).getTime();
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.round((due - now.getTime()) / 86_400_000);
}

export function dueLabel(iso: string | null): { text: string; tone: string } {
  const d = daysUntil(iso);
  if (d === null) return { text: "No due date", tone: "text-muted-foreground" };
  if (d < 0)
    return {
      text: `Overdue ${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"}`,
      tone: "text-rose-600",
    };
  if (d === 0) return { text: "Due today", tone: "text-orange-600" };
  if (d === 1) return { text: "Due tomorrow", tone: "text-amber-600" };
  if (d <= 7) return { text: `Due in ${d} days`, tone: "text-muted-foreground" };
  return {
    text: new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    tone: "text-muted-foreground",
  };
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}