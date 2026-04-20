"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SavedWorkout, useWorkoutStore } from "@/lib/workout-store";
import { MuscleGroup } from "@/lib/exercises";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Play,
  Clock,
  Dumbbell,
  Eye,
  CheckCircle2,
} from "lucide-react";

// Derive a human-readable focus label from exercises
function getWorkoutFocus(exercises: SavedWorkout["exercises"], accessories: SavedWorkout["accessories"]): string {
  const all = [...exercises, ...accessories];
  if (all.length === 0) return "General";

  const counts: Partial<Record<MuscleGroup, number>> = {};
  for (const ex of all) {
    counts[ex.muscleGroup] = (counts[ex.muscleGroup] ?? 0) + 1;
  }

  const top = (Object.entries(counts) as [MuscleGroup, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  const labels: Record<MuscleGroup, string> = {
    "full-body": "Full Body",
    "upper-body": "Upper Body",
    "lower-body": "Lower Body",
    "core": "Core",
    "cardio": "Cardio",
    "stretching": "Flexibility",
    "accessories": "Accessories",
  };

  return labels[top] ?? "General";
}

export function SavedWorkouts() {
  const router = useRouter();
  const { savedWorkouts, removeSavedWorkout, updateSavedWorkoutLabel, addScheduledWorkout } = useWorkoutStore();

  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | undefined>(new Date());
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");

  const handleScheduleWorkout = () => {
    if (!selectedWorkout || !selectedScheduleDate) return;
    const dateStr = selectedScheduleDate.toISOString().split("T")[0];
    addScheduledWorkout(dateStr, selectedWorkout);
    setShowScheduleDialog(false);
    setSelectedWorkout(null);
    setSelectedScheduleDate(new Date());
    alert(`Workout scheduled for ${selectedScheduleDate.toLocaleDateString()}! Check the calendar.`);
  };

  const handleEditLabel = (workout: SavedWorkout) => {
    setEditingLabel(workout.id);
    setNewLabel(workout.label || workout.name);
  };

  const handleSaveLabel = (workoutId: string) => {
    updateSavedWorkoutLabel(workoutId, newLabel);
    setEditingLabel(null);
    setNewLabel("");
  };

  const handleStartWorkout = (workout: SavedWorkout) => {
    useWorkoutStore.getState().setPendingWorkout({
      exercises: workout.exercises,
      accessories: workout.accessories,
    });
    router.push("/workout");
  };

  const openViewDialog = (workout: SavedWorkout) => {
    setSelectedWorkout(workout);
    setShowViewDialog(true);
  };

  const openScheduleDialog = (workout: SavedWorkout) => {
    setSelectedWorkout(workout);
    setShowScheduleDialog(true);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m} min` : `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Your Saved Workouts</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {savedWorkouts.length > 0
            ? `${savedWorkouts.length} workout${savedWorkouts.length === 1 ? "" : "s"} saved`
            : "No saved workouts yet"}
        </p>
      </div>

      {/* Empty state */}
      {savedWorkouts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Dumbbell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No saved workouts yet</h3>
            <p className="text-muted-foreground max-w-sm">
              Build a workout on the home page and save it — it will appear here ready to start or schedule.
            </p>
          </CardContent>
        </Card>
      ) : (
        /* Workout cards grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedWorkouts.map((workout) => {
            const focus = getWorkoutFocus(workout.exercises, workout.accessories);
            const totalExercises = workout.exercises.length + workout.accessories.length;
            const createdDate = workout.createdAt
              ? new Date(workout.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
              : null;

            return (
              <Card
                key={workout.id}
                className="flex flex-col rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  {/* Name row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {editingLabel === workout.id ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            className="text-sm h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveLabel(workout.id);
                              if (e.key === "Escape") setEditingLabel(null);
                            }}
                          />
                          <Button size="sm" className="h-8 px-3" onClick={() => handleSaveLabel(workout.id)}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingLabel(null)}>
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <CardTitle className="text-base font-semibold leading-tight truncate">
                          {workout.label || workout.name}
                        </CardTitle>
                      )}
                    </div>
                  </div>

                  {/* Focus & date badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {focus}
                    </Badge>
                    {createdDate && (
                      <span className="text-xs text-muted-foreground">{createdDate}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 pt-0 gap-4">
                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Dumbbell className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""}
                        {workout.accessories.length > 0 && ` + ${workout.accessories.length} acc`}
                      </span>
                    </div>
                    {workout.totalDuration > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{formatDuration(workout.totalDuration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Exercise name pills (up to 3) */}
                  {workout.exercises.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {workout.exercises.slice(0, 3).map((ex) => (
                        <span
                          key={ex.id}
                          className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium truncate max-w-[120px]"
                        >
                          {ex.name}
                        </span>
                      ))}
                      {workout.exercises.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                          +{workout.exercises.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-auto space-y-2">
                    {/* Row 1: View + Start */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => openViewDialog(workout)}
                      >
                        <Eye className="h-4 w-4 mr-1.5" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleStartWorkout(workout)}
                      >
                        <Play className="h-4 w-4 mr-1.5" />
                        Start
                      </Button>
                    </div>
                    {/* Row 2: Edit + Schedule + Delete */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleEditLabel(workout)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => openScheduleDialog(workout)}
                      >
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Plan
                      </Button>
                      {showDeleteConfirm === workout.id ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          onClick={() => {
                            removeSavedWorkout(workout.id);
                            setShowDeleteConfirm(null);
                          }}
                        >
                          Confirm
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setShowDeleteConfirm(workout.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── View Dialog ── */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedWorkout?.label || selectedWorkout?.name}</DialogTitle>
          </DialogHeader>
          {selectedWorkout && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">{getWorkoutFocus(selectedWorkout.exercises, selectedWorkout.accessories)}</Badge>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(selectedWorkout.totalDuration)}
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {selectedWorkout.exercises.length + selectedWorkout.accessories.length} exercises
                </span>
              </div>

              {selectedWorkout.exercises.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Main Exercises</h4>
                  <ul className="space-y-2">
                    {selectedWorkout.exercises.map((ex, i) => (
                      <li
                        key={`${ex.id}-${i}`}
                        className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="font-medium">{ex.name}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {ex.sets} × {ex.reps}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedWorkout.accessories.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Accessories</h4>
                  <ul className="space-y-2">
                    {selectedWorkout.accessories.map((ex, i) => (
                      <li
                        key={`${ex.id}-acc-${i}`}
                        className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                          <span className="font-medium">{ex.name}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {ex.sets} × {ex.reps}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
                <Button onClick={() => { setShowViewDialog(false); handleStartWorkout(selectedWorkout); }}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Workout
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Schedule Dialog ── */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedWorkout && (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold">{selectedWorkout.label || selectedWorkout.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedWorkout.exercises.length} exercises • {formatDuration(selectedWorkout.totalDuration)}
                </p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedScheduleDate}
                onSelect={setSelectedScheduleDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleWorkout} disabled={!selectedScheduleDate}>
                Schedule Workout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
