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

export interface ScheduledWorkout {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  workoutPlan: WorkoutPlan;
  completed: boolean;
}

interface WorkoutStore {
  scheduledWorkouts: ScheduledWorkout[];
  addScheduledWorkout: (date: string, workoutPlan: WorkoutPlan) => void;
  removeScheduledWorkout: (id: string) => void;
  markCompleted: (id: string) => void;
  getWorkoutsForDate: (date: string) => ScheduledWorkout[];
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      scheduledWorkouts: [],
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
    }),
    {
      name: "workout-store",
    }
  )
);

export function calculateTotalDuration(exercises: WorkoutExercise[], accessories: WorkoutExercise[] = []): number {
  const exerciseDuration = exercises.reduce((total, ex) => total + ex.duration + ex.restAfter, 0);
  const accessoryDuration = accessories.reduce((total, acc) => total + acc.duration + acc.restAfter, 0);
  return exerciseDuration + accessoryDuration;
}

export function generateWorkoutId(): string {
  return `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
