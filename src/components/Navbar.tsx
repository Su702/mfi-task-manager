import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  Kanban,
  ListTodo,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Upload,
} from "lucide-react";
import { useTasks } from "@/context/TaskContext";
import { DEPT_META, type DepartmentId, type ViewMode } from "@/types";

const VIEWS: { id: ViewMode; label: string; icon: typeof ListTodo }[] = [
  { id: "list", label: "List", icon: ListTodo },
  { id: "board", label: "Board", icon: Kanban },
  { id: "analytics", label: "Insights", icon: BarChart3 },
];

const DEPARTMENTS: DepartmentId[] = ["all", "mfi-ops", "mfi-it", "daily-life"];

interface NavbarProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onNewTask: () => void;
}

export function Navbar({ view, onViewChange, onNewTask }: NavbarProps) {
  const { tasks, filters, setFilters, exportData, importData, resetToSample } =
    useTasks();
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openCount = tasks.filter((t) => t.status !== "completed").length;

  const counts: Record<DepartmentId, number> = {
    all: tasks.length,
    "mfi-ops": tasks.filter((t) => t.department === "mfi-ops").length,
    "mfi-it": tasks.filter((t) => t.department === "mfi-it").length,
    "daily-life": tasks.filter((t) => t.department === "daily-life").length,
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
              <Building2 className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-slate-900">
                TaskFlow
              </p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                MFI operations, IT and daily life
              </p>
            </div>
          </div>

          <div className="relative ml-auto hidden w-64 items-center md:flex">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              value={filters.query}
              onChange={(e) => setFilters({ query: e.target.value })}
              placeholder="Search tasks, people, tags"
              className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-background focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="hidden items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 sm:flex">
              {VIEWS.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                      active
                        ? "text-slate-900"
                        : "text-muted-foreground hover:text-slate-700"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="view-pill"
                        className="absolute inset-0 rounded-md bg-background shadow-sm"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="relative h-3.5 w-3.5" strokeWidth={1.8} />
                    <span className="relative hidden lg:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onNewTask}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              <span className="hidden sm:inline">New task</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Workspace settings"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border text-slate-600 transition hover:bg-muted"
              >
                <Settings2 className="h-4 w-4" strokeWidth={1.8} />
              </button>
              {menuOpen && (
                <>
                  <button
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
                    <button
                      onClick={() => {
                        exportData();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-muted"
                    >
                      <Download className="h-4 w-4" strokeWidth={1.8} /> Export JSON
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition hover:bg-muted"
                    >
                      <Upload className="h-4 w-4" strokeWidth={1.8} /> Import JSON
                    </button>
                    <button
                      onClick={() => {
                        resetToSample();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                    >
                      <RotateCcw className="h-4 w-4" strokeWidth={1.8} /> Reset sample data
                    </button>
                  </div>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  importData(await file.text());
                  setMenuOpen(false);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pb-3 pt-1 md:hidden">
          <div className="relative flex w-full items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              value={filters.query}
              onChange={(e) => setFilters({ query: e.target.value })}
              placeholder="Search tasks, people, tags"
              className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DEPARTMENTS.map((id) => {
            const meta = DEPT_META[id];
            const active = filters.department === id;
            return (
              <button
                key={id}
                onClick={() => setFilters({ department: id })}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-border bg-background text-slate-600 hover:bg-muted"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "bg-emerald-300" : meta.dot
                  }`}
                />
                {id === "all" ? "All tasks" : meta.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                    active ? "bg-white/15 text-white" : "bg-muted text-slate-500"
                  }`}
                >
                  {counts[id]}
                </span>
              </button>
            );
          })}
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 pr-1 text-[11px] text-muted-foreground sm:flex">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
            {openCount} open
          </span>
        </div>
      </div>
    </header>
  );
}