import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  DEFAULT_FILTERS,
  PRIORITY_META,
  STATUS_META,
  uid,
  type Filters,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/types";
import { seedTasks } from "@/data/mockTasks";

const STORAGE_KEY = "mfi-taskflow-v1";

interface TaskContextValue {
  tasks: Task[];
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  visibleTasks: Task[];
  createTask: (input: Partial<Task>) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (id: string) => void;
  cycleStatus: (id: string) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  exportData: () => void;
  importData: (raw: string) => void;
  resetToSample: () => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

const STATUS_CYCLE: TaskStatus[] = ["todo", "in_progress", "review", "completed"];

function loadInitial(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedTasks;
    const parsed = JSON.parse(raw) as Task[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedTasks;
    return parsed;
  } catch {
    return seedTasks;
  }
}

function logActivity(task: Task, message: string): Task {
  return {
    ...task,
    activities: [
      { id: uid("act"), message, at: new Date().toISOString() },
      ...task.activities,
    ].slice(0, 20),
  };
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(loadInitial);
  const [filters, setFiltersState] = useState<Filters>(DEFAULT_FILTERS);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      toast.error("Could not save tasks to this browser");
    }
  }, [tasks]);

  const setFilters = useCallback((patch: Partial<Filters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), []);

  const createTask = useCallback((input: Partial<Task>) => {
    const draft: Task = {
      id: uid("task"),
      title: input.title?.trim() || "Untitled task",
      description: input.description ?? "",
      department: input.department ?? "mfi-ops",
      category: input.category?.trim() || "General",
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ?? null,
      estimateHours: input.estimateHours ?? 1,
      assignee: input.assignee?.trim() || "Me",
      tags: input.tags ?? [],
      subtasks:
        input.subtasks ??
        (input.title?.includes("|")
          ? []
          : []),
      activities: [
        { id: uid("act"), message: "Task created", at: new Date().toISOString() },
      ],
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [draft, ...prev]);
    return draft;
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        let next = { ...task, ...patch };
        if (patch.status && patch.status !== task.status) {
          next = logActivity(
            next,
            `Status changed to ${STATUS_META[patch.status].label}`,
          );
        }
        if (patch.priority && patch.priority !== task.priority) {
          next = logActivity(
            next,
            `Priority set to ${PRIORITY_META[patch.priority].label}`,
          );
        }
        return next;
      }),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const duplicateTask = useCallback((id: string) => {
    setTasks((prev) => {
      const source = prev.find((task) => task.id === id);
      if (!source) return prev;
      const copy: Task = {
        ...source,
        id: uid("task"),
        title: `${source.title} (copy)`,
        status: "todo",
        createdAt: new Date().toISOString(),
        subtasks: source.subtasks.map((s) => ({ ...s, id: uid("sub"), done: false })),
        activities: [
          { id: uid("act"), message: "Duplicated from an existing task", at: new Date().toISOString() },
        ],
      };
      return [copy, ...prev];
    });
  }, []);

  const setStatus = useCallback(
    (id: string, status: TaskStatus) => updateTask(id, { status }),
    [updateTask],
  );

  const cycleStatus = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const idx = STATUS_CYCLE.indexOf(task.status);
        const nextStatus =
          task.status === "blocked"
            ? "in_progress"
            : STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        return logActivity(
          { ...task, status: nextStatus },
          `Status changed to ${STATUS_META[nextStatus].label}`,
        );
      }),
    );
  }, []);

  const addSubtask = useCallback((taskId: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [...task.subtasks, { id: uid("sub"), title: clean, done: false }],
            }
          : task,
      ),
    );
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, done: !s.done } : s,
              ),
            }
          : task,
      ),
    );
  }, []);

  const removeSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: task.subtasks.filter((s) => s.id !== subtaskId) }
          : task,
      ),
    );
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taskflow-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Tasks exported as JSON");
  }, [tasks]);

  const importData = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error("File must contain an array of tasks");
      const normalized = parsed.map((item: Partial<Task>, index: number): Task => ({
        id: item.id ?? uid(`imp${index}`),
        title: item.title ?? "Imported task",
        description: item.description ?? "",
        department: item.department ?? "mfi-ops",
        category: item.category ?? "General",
        status: (item.status as TaskStatus) ?? "todo",
        priority: (item.priority as Priority) ?? "medium",
        dueDate: item.dueDate ?? null,
        estimateHours: item.estimateHours ?? 1,
        assignee: item.assignee ?? "Me",
        tags: item.tags ?? [],
        subtasks: item.subtasks ?? [],
        activities: item.activities ?? [],
        createdAt: item.createdAt ?? new Date().toISOString(),
      }));
      setTasks(normalized);
      toast.success(`Imported ${normalized.length} tasks`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  }, []);

  const resetToSample = useCallback(() => {
    setTasks(seedTasks);
    setFiltersState(DEFAULT_FILTERS);
    toast.success("Sample workspace restored");
  }, []);

  const visibleTasks = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const list = tasks.filter((task) => {
      if (filters.department !== "all" && task.department !== filters.department)
        return false;
      if (filters.status !== "all" && task.status !== filters.status) return false;
      if (filters.priority !== "all" && task.priority !== filters.priority)
        return false;
      if (!q) return true;
      return (
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.assignee.toLowerCase().includes(q) ||
        task.category.toLowerCase().includes(q) ||
        task.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      switch (filters.sort) {
        case "priority":
          return PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight;
        case "created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "status":
          return STATUS_META[a.status].order - STATUS_META[b.status].order;
        default: {
          const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return aDue - bDue;
        }
      }
    });
  }, [tasks, filters]);

  const value: TaskContextValue = {
    tasks,
    filters,
    setFilters,
    resetFilters,
    visibleTasks,
    createTask,
    updateTask,
    deleteTask,
    duplicateTask,
    cycleStatus,
    setStatus,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    exportData,
    importData,
    resetToSample,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used inside TaskProvider");
  return ctx;
}