import { Exercise } from "./exercises";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WorkoutExercise extends Exercise {
  order: number;
  restAfter: number; // rest time in seconds after this exercise
}

export interface WorkoutPlan {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  accessories: WorkoutExercise[]; // up to 2 accessories
  totalDuration: number;
  createdAt: Date;
}

export interface SavedWorkout extends WorkoutPlan {
  label?: string; // optional custom label
}

export interface ScheduledWorkout {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  workoutPlan: WorkoutPlan;
  completed: boolean;
}

interface WorkoutStore {
  scheduledWorkouts: ScheduledWorkout[];
  savedWorkouts: SavedWorkout[];
  addScheduledWorkout: (date: string, workoutPlan: WorkoutPlan) => void;
  removeScheduledWorkout: (id: string) => void;
  markCompleted: (id: string) => void;
  getWorkoutsForDate: (date: string) => ScheduledWorkout[];
  saveWorkout: (workoutPlan: WorkoutPlan, label?: string) => void;
  removeSavedWorkout: (id: string) => void;
  updateSavedWorkoutLabel: (id: string, label: string) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      scheduledWorkouts: [],
      savedWorkouts: [],
      addScheduledWorkout: (date, workoutPlan) => {
        const newScheduled: ScheduledWorkout = {
          id: generateWorkoutId(),
          date,
          workoutPlan,
          completed: false,
        };
        set((state) => ({
          scheduledWorkouts: [...state.scheduledWorkouts, newScheduled],
        }));
      },
      removeScheduledWorkout: (id) => {
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.filter((w) => w.id !== id),
        }));
      },
      markCompleted: (id) => {
        set((state) => ({
          scheduledWorkouts: state.scheduledWorkouts.map((w) =>
            w.id === id ? { ...w, completed: true } : w
          ),
        }));
      },
      getWorkoutsForDate: (date) => {
        return get().scheduledWorkouts.filter((w) => w.date === date);
      },
      saveWorkout: (workoutPlan, label) => {
        const savedWorkout: SavedWorkout = {
          ...workoutPlan,
          label: label || workoutPlan.name,
        };
        set((state) => ({
          savedWorkouts: [...state.savedWorkouts, savedWorkout],
        }));
      },
      removeSavedWorkout: (id) => {
        set((state) => ({
          savedWorkouts: state.savedWorkouts.filter((w) => w.id !== id),
        }));
      },
      updateSavedWorkoutLabel: (id, label) => {
        set((state) => ({
          savedWorkouts: state.savedWorkouts.map((w) =>
            w.id === id ? { ...w, label } : w
          ),
        }));
      },
    }),
    {
      name: "workout-store",
    }
  )
);

export function calculateTotalDuration(exercises: WorkoutExercise[], accessories: WorkoutExercise[] = []): number {
  const exerciseDuration = exercises.reduce((total, ex, i) => {
    // Each set takes the exercise duration + rest time (except for the last set of each exercise)
    const setsDuration = ex.sets * ex.duration;
    const restDuration = (ex.sets - 1) * ex.restAfter; // rest between sets
    const betweenExerciseRest = i < exercises.length - 1 ? ex.restAfter : 0; // rest after last set to next exercise
    return total + setsDuration + restDuration + betweenExerciseRest;
  }, 0);

  const accessoryDuration = accessories.reduce((total, acc, i) => {
    const setsDuration = acc.sets * acc.duration;
    const restDuration = (acc.sets - 1) * acc.restAfter;
    const betweenAccessoryRest = i < accessories.length - 1 ? acc.restAfter : 0;
    return total + setsDuration + restDuration + betweenAccessoryRest;
  }, 0);

  return exerciseDuration + accessoryDuration;
}

export function generateWorkoutId(): string {
  return `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
