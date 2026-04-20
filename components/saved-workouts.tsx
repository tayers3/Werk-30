"use client";

import { useState } from "react";
import { SavedWorkout, useWorkoutStore } from "@/lib/workout-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  Play,
  Clock,
  Dumbbell,
} from "lucide-react";

export function SavedWorkouts() {
  const { savedWorkouts, removeSavedWorkout, updateSavedWorkoutLabel, addScheduledWorkout } = useWorkoutStore();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<SavedWorkout | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | undefined>(new Date());
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");

  const handleScheduleWorkout = () => {
    if (!selectedWorkout || !selectedScheduleDate) return;
    const dateStr = selectedScheduleDate.toISOString().split('T')[0];
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
    const workoutData = {
      exercises: workout.exercises,
      accessories: workout.accessories,
    };
    const encoded = encodeURIComponent(JSON.stringify(workoutData));
    window.location.href = `/workout?workout=${encoded}`;
  };

  const openScheduleDialog = (workout: SavedWorkout) => {
    setSelectedWorkout(workout);
    setShowScheduleDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Previous Workouts</h2>
          <p className="text-muted-foreground">Your saved workout templates</p>
        </div>
      </div>

      {savedWorkouts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No saved workouts yet</h3>
            <p className="text-muted-foreground text-center">
              Create and save your favorite workouts to reuse them later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedWorkouts.map((workout) => (
            <Card key={workout.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingLabel === workout.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveLabel(workout.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingLabel(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <CardTitle className="text-lg truncate">
                        {workout.label || workout.name}
                      </CardTitle>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLabel(workout)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSavedWorkout(workout.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {Math.floor(workout.totalDuration / 60)}:{(workout.totalDuration % 60).toString().padStart(2, '0')}
                  <Badge variant="secondary" className="text-xs">
                    {workout.exercises.length} exercises
                    {workout.accessories.length > 0 && ` + ${workout.accessories.length} acc`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleStartWorkout(workout)}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openScheduleDialog(workout)}
                    className="flex-1"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                  {selectedWorkout.exercises.length} exercises • {Math.floor(selectedWorkout.totalDuration / 60)}:{(selectedWorkout.totalDuration % 60).toString().padStart(2, '0')}
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