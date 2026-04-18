import { Exercise } from "./exercises";

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

export function calculateTotalDuration(exercises: WorkoutExercise[], accessories: WorkoutExercise[] = []): number {
  const exerciseDuration = exercises.reduce((total, ex) => total + ex.duration + ex.restAfter, 0);
  const accessoryDuration = accessories.reduce((total, acc) => total + acc.duration + acc.restAfter, 0);
  return exerciseDuration + accessoryDuration;
}

export function generateWorkoutId(): string {
  return `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
