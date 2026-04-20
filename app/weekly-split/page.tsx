"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkoutStore, DayOfWeek, WeeklySplitDay } from "@/lib/workout-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Dumbbell, Moon, Play, RotateCcw, Check, X, Save, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_FULL: Record<DayOfWeek, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

export default function WeeklySplitPage() {
  const router = useRouter();
  const { weeklySplit, savedWorkouts, updateWeeklySplitDay, resetWeeklySplit, setPendingWorkout, addSplit, savedSplits } =
    useWorkoutStore();

  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [showSaveSplitDialog, setShowSaveSplitDialog] = useState(false);
  const [splitNameDraft, setSplitNameDraft] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const today = new Date()
    .toLocaleDateString("en-US", { weekday: "short" })
    .slice(0, 3) as DayOfWeek;

  const handleToggleType = (day: DayOfWeek) => {
    const current = weeklySplit[day];
    if (current.type === "rest") {
      updateWeeklySplitDay(day, { type: "workout", workoutId: undefined });
    } else {
      updateWeeklySplitDay(day, { type: "rest", workoutId: undefined, label: undefined });
    }
  };

  const handleAssignWorkout = (day: DayOfWeek, workoutId: string) => {
    const workout = savedWorkouts.find((w) => w.id === workoutId);
    updateWeeklySplitDay(day, {
      workoutId,
      label: workout?.label || workout?.name,
    });
  };

  const handleClearWorkout = (day: DayOfWeek) => {
    updateWeeklySplitDay(day, { workoutId: undefined });
  };

  const handleSaveLabel = (day: DayOfWeek) => {
    updateWeeklySplitDay(day, { label: labelDraft });
    setEditingDay(null);
    setLabelDraft("");
  };

  const handleStartDay = (day: DayOfWeek) => {
    const slot = weeklySplit[day];
    if (slot.type !== "workout") return;
    const workout = savedWorkouts.find((w) => w.id === slot.workoutId);
    if (!workout) return;
    setPendingWorkout({ exercises: workout.exercises, accessories: workout.accessories ?? [] });
    router.push("/workout");
  };

  const workoutDays = DAYS.filter((d) => weeklySplit[d].type === "workout").length;
  const restDays = DAYS.filter((d) => weeklySplit[d].type === "rest").length;

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
                <Dumbbell className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Weekly Split</h1>
                <p className="text-xs text-muted-foreground">
                  {workoutDays} workout day{workoutDays !== 1 ? "s" : ""} ·{" "}
                  {restDays} rest day{restDays !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Saved Splits */}
            <Button variant="outline" size="sm" onClick={() => router.push("/saved-splits")}>
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Splits
              {savedSplits.length > 0 && (
                <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {savedSplits.length}
                </span>
              )}
            </Button>

            {/* Save Split */}
            <Button variant="outline" size="sm" onClick={() => { setSplitNameDraft(""); setShowSaveSplitDialog(true); }}>
              <Save className="h-4 w-4 mr-2" />
              Save Split
            </Button>

            {/* Reset with confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Weekly Split?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all assigned workouts, labels, and rest days. Every day will
                    return to a blank workout day. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      resetWeeklySplit();
                      setEditingDay(null);
                      setLabelDraft("");
                    }}
                  >
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Save Split Dialog */}
      <Dialog open={showSaveSplitDialog} onOpenChange={setShowSaveSplitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Weekly Split</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="split-name">Split Name (optional)</Label>
              <Input
                id="split-name"
                placeholder="e.g. PPL Split, 5-Day Bro Split…"
                value={splitNameDraft}
                onChange={(e) => setSplitNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addSplit(splitNameDraft.trim() || "My Weekly Split");
                    setJustSaved(true);
                    setShowSaveSplitDialog(false);
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This saves a new copy. You currently have {savedSplits.length} saved split{savedSplits.length !== 1 ? "s" : ""}.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveSplitDialog(false)}>Cancel</Button>
              <Button onClick={() => { addSplit(splitNameDraft.trim() || "My Weekly Split"); setJustSaved(true); setShowSaveSplitDialog(false); }}>
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-3">
        {/* Saved split banner */}
        {justSaved && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm">
            <Bookmark className="h-4 w-4 text-primary shrink-0" />
            <span className="flex-1 text-foreground">Split saved! You now have <strong>{savedSplits.length}</strong> saved split{savedSplits.length !== 1 ? "s" : ""}.</span>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => router.push("/saved-splits")}>
              View All
            </Button>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pb-2">
          <span className="flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5 text-primary" />
            Workout day — tap to make Rest
          </span>
          <span className="flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            Rest day — tap to make Workout
          </span>
        </div>

        {DAYS.map((day) => {
          const slot: WeeklySplitDay = weeklySplit[day];
          const isRest = slot.type === "rest";
          const isToday = day === today;
          const assignedWorkout = savedWorkouts.find((w) => w.id === slot.workoutId);

          return (
            <Card
              key={day}
              className={cn(
                "transition-all border-2",
                isToday ? "border-primary" : "border-border",
                isRest ? "bg-muted/30 opacity-80" : "bg-card"
              )}
            >
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Day name */}
                  <div className="w-24 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{DAY_FULL[day]}</span>
                      {isToday && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          Today
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{day}</span>
                  </div>

                  {/* Rest / Workout toggle */}
                  <button
                    onClick={() => handleToggleType(day)}
                    title={isRest ? "Switch to Workout Day" : "Switch to Rest Day"}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border shrink-0",
                      isRest
                        ? "bg-muted border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                    )}
                  >
                    {isRest ? (
                      <>
                        <Moon className="h-3.5 w-3.5" />
                        Rest Day
                      </>
                    ) : (
                      <>
                        <Dumbbell className="h-3.5 w-3.5" />
                        Workout Day
                      </>
                    )}
                  </button>

                  {/* Workout day controls */}
                  {!isRest && (
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      {editingDay === day ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={labelDraft}
                            onChange={(e) => setLabelDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveLabel(day);
                              if (e.key === "Escape") setEditingDay(null);
                            }}
                            placeholder="e.g. Push Day, Leg Day…"
                            className="text-sm h-8"
                            autoFocus
                          />
                          <Button size="sm" className="h-8 px-2" onClick={() => handleSaveLabel(day)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={() => setEditingDay(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {savedWorkouts.length > 0 && (
                            <select
                              value={slot.workoutId ?? ""}
                              onChange={(e) =>
                                e.target.value
                                  ? handleAssignWorkout(day, e.target.value)
                                  : handleClearWorkout(day)
                              }
                              className="text-sm border border-input rounded-md px-2 py-1 bg-background text-foreground min-w-0 max-w-[200px]"
                            >
                              <option value="">— Assign workout —</option>
                              {savedWorkouts.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.label || w.name}
                                </option>
                              ))}
                            </select>
                          )}

                          <button
                            onClick={() => {
                              setEditingDay(day);
                              setLabelDraft(slot.label ?? "");
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline truncate max-w-[140px] shrink-0"
                          >
                            {slot.label && !assignedWorkout ? slot.label : "Add label"}
                          </button>

                          {assignedWorkout && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {assignedWorkout.label || assignedWorkout.name}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {isRest && (
                    <div className="flex-1 text-sm text-muted-foreground italic">
                      Recovery — no workout assigned
                    </div>
                  )}

                  {/* Start button */}
                  {!isRest && slot.workoutId && (
                    <Button size="sm" onClick={() => handleStartDay(day)} className="shrink-0">
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      Start
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {savedWorkouts.length === 0 && (
          <Card className="border-dashed mt-4">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No saved workouts yet.</p>
              <p className="text-xs mt-1">
                Build and save workouts first, then assign them to days here.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.push("/")}
              >
                Build a Workout
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

