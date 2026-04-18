import { Exercise } from "./exercises";

export interface WorkoutExercise extends Exercise {
  order: number;
  restAfter: number; // rest time in seconds after this exercise
}

export interface WorkoutPlan {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  totalDuration: number;
  createdAt: Date;
}

export function calculateTotalDuration(exercises: WorkoutExercise[]): number {
  return exercises.reduce((total, ex) => total + ex.duration + ex.restAfter, 0);
}

export function generateWorkoutId(): string {
  return `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
