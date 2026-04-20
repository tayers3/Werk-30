"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useWorkoutStore,
  SavedWeeklySplit,
  DayOfWeek,
  WeeklySplitDay,
} from "@/lib/workout-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Moon,
  Dumbbell,
  Upload,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL: Record<DayOfWeek, string> = {
  Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu",
  Fri: "Fri", Sat: "Sat", Sun: "Sun",
};

function SplitDayRow({ day, slot, workoutName }: { day: DayOfWeek; slot: WeeklySplitDay; workoutName?: string }) {
  const isRest = slot.type === "rest";
  return (
    <div className={cn(
      "flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm",
      isRest ? "text-muted-foreground" : "text-foreground"
    )}>
      <span className="w-8 font-medium shrink-0">{DAY_FULL[day]}</span>
      {isRest ? (
        <>
          <Moon className="h-3 w-3 shrink-0" />
          <span className="text-xs italic">Rest</span>
        </>
      ) : (
        <>
          <Dumbbell className="h-3 w-3 text-primary shrink-0" />
          <span className="text-xs truncate">
            {slot.label ?? workoutName ?? "Workout"}
          </span>
        </>
      )}
    </div>
  );
}

function SplitCard({ split, savedWorkouts, onLoad, onEdit, onDelete }: {
  split: SavedWeeklySplit;
  savedWorkouts: { id: string; label?: string; name: string }[];
  onLoad: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const workoutDays = DAYS.filter((d) => split.split[d]?.type === "workout").length;
  const restDays = 7 - workoutDays;
  const updatedAt = new Date(split.updatedAt);
  const createdAt = new Date(split.createdAt);
  const wasEdited = updatedAt.getTime() - createdAt.getTime() > 5000;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold text-foreground truncate">{split.name}</h3>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Dumbbell className="h-3 w-3 mr-1" />
                {workoutDays} workout day{workoutDays !== 1 ? "s" : ""}
              </Badge>
              {restDays > 0 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  <Moon className="h-3 w-3 mr-1" />
                  {restDays} rest day{restDays !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {wasEdited
                ? `Updated ${updatedAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                : `Created ${createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}
            </p>
          </div>
        </div>
      </div>

      {/* Expandable day list */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50"
      >
        <Eye className="h-3.5 w-3.5" />
        {expanded ? "Hide days" : "Show days"}
        {expanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-2">
          {DAYS.map((day) => {
            const slot = split.split[day];
            const workout = savedWorkouts.find((w) => w.id === slot?.workoutId);
            return (
              <SplitDayRow
                key={day}
                day={day}
                slot={slot ?? { day, type: "workout" }}
                workoutName={workout?.label ?? workout?.name}
              />
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-border/50 bg-muted/20">
        <Button size="sm" onClick={onLoad} className="flex-1">
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Load Split
        </Button>
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Rename
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete &ldquo;{split.name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the saved split. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function SavedSplitsPage() {
  const router = useRouter();
  const { savedSplits, savedWorkouts, deleteSplit, loadSplit, updateSplit } = useWorkoutStore();

  const [editTarget, setEditTarget] = useState<{ id: string; name: string } | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const handleLoad = (id: string) => {
    loadSplit(id);
    setLoadedId(id);
    setTimeout(() => router.push("/weekly-split"), 400);
  };

  const handleEditOpen = (split: SavedWeeklySplit) => {
    setEditTarget({ id: split.id, name: split.name });
    setNameDraft(split.name);
  };

  const handleEditSave = () => {
    if (!editTarget) return;
    updateSplit(editTarget.id, { name: nameDraft.trim() || editTarget.name });
    setEditTarget(null);
    setNameDraft("");
  };

  // Sort newest first
  const sorted = [...savedSplits].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Saved Splits</h1>
                <p className="text-xs text-muted-foreground">
                  {savedSplits.length} saved split{savedSplits.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/weekly-split")}>
              <Dumbbell className="h-4 w-4 mr-2" />
              Edit Split
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center gap-4">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-semibold text-foreground">No saved splits yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Go to Weekly Split and tap &ldquo;Save Split&rdquo; to store your first plan.
              </p>
            </div>
            <Button onClick={() => router.push("/weekly-split")}>
              <CalendarDays className="h-4 w-4 mr-2" />
              Go to Weekly Split
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {sorted.map((split) => (
              <SplitCard
                key={split.id}
                split={split}
                savedWorkouts={savedWorkouts}
                onLoad={() => handleLoad(split.id)}
                onEdit={() => handleEditOpen(split)}
                onDelete={() => deleteSplit(split.id)}
              />
            ))}
          </div>
        )}

        {loadedId && (
          <p className="text-center text-sm text-primary mt-6 animate-pulse">
            Split loaded — redirecting to Weekly Split…
          </p>
        )}
      </main>

      {/* Rename dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Split</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="split-rename">New Name</Label>
              <Input
                id="split-rename"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button onClick={handleEditSave}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
