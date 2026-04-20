"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkoutStore } from "@/lib/workout-store";
import { format, isSameDay } from "date-fns";
import { CalendarIcon, Plus, Trash2, Target } from "lucide-react";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const router = useRouter();
  const { scheduledWorkouts, removeScheduledWorkout, getWorkoutsForDate } = useWorkoutStore();

  const workoutsForSelectedDate = selectedDate ? getWorkoutsForDate(format(selectedDate, "yyyy-MM-dd")) : [];

  const handleAddWorkout = () => {
    router.push("/");
  };

  const handleStartWorkout = (workout: any) => {
    const workoutData = {
      exercises: workout.workoutPlan.exercises,
      accessories: workout.workoutPlan.accessories,
    };
    const encoded = encodeURIComponent(JSON.stringify(workoutData));
    router.push(`/workout?workout=${encoded}`);
  };

  const getDaysWithWorkouts = () => {
    return scheduledWorkouts.map((w) => new Date(w.date));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Workout Calendar</h1>
                <p className="text-xs text-muted-foreground">
                  Schedule and track your 30-minute workouts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push('/saved-workouts')}>
                <Target className="h-4 w-4 mr-2" />
                Saved Workouts
              </Button>
              <Button onClick={handleAddWorkout}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Workout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Select a Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                  modifiers={{
                    hasWorkout: getDaysWithWorkouts(),
                  }}
                  modifiersStyles={{
                    hasWorkout: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                      fontWeight: "bold",
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workoutsForSelectedDate.length === 0 ? (
                  <p className="text-muted-foreground">No workouts scheduled for this date.</p>
                ) : (
                  <div className="space-y-4">
                    {workoutsForSelectedDate.map((workout) => (
                      <div key={workout.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{workout.workoutPlan.name}</h3>
                          <div className="flex items-center gap-2">
                            {workout.completed && <Badge variant="secondary">Completed</Badge>}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScheduledWorkout(workout.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {workout.workoutPlan.exercises.length} exercises
                          {workout.workoutPlan.accessories.length > 0 &&
                            ` + ${workout.workoutPlan.accessories.length} accessories`}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Duration: {Math.floor(workout.workoutPlan.totalDuration / 60)}:{(workout.workoutPlan.totalDuration % 60).toString().padStart(2, '0')}
                        </p>
                        {!workout.completed && (
                          <Button
                            size="sm"
                            onClick={() => handleStartWorkout(workout)}
                            className="w-full"
                          >
                            Start Workout
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}