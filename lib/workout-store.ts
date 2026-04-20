import { Exercise, ExerciseType } from "./exercises";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** An exercise placed inside a workout plan. `type` is required here (defaults to "main"). */
export interface WorkoutExercise extends Omit<Exercise, "type"> {
  type: ExerciseType;
  order: number;
  /** Rest time in seconds following this exercise. */
  restAfter: number;
  /** For accessories: the `id` of the main exercise this is paired with. */
  parentExerciseId?: string | null;
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

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface WeeklySplitDay {
  day: DayOfWeek;
  type: "rest" | "workout";
  workoutId?: string; // references a SavedWorkout id
  label?: string;    // custom label e.g. "Push Day", "Leg Day"
}

export type WeeklySplit = Record<DayOfWeek, WeeklySplitDay>;

export interface SavedWeeklySplit {
  id: string;
  name: string;
  split: WeeklySplit;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SPLIT: WeeklySplit = {
  Mon: { day: "Mon", type: "workout" },
  Tue: { day: "Tue", type: "workout" },
  Wed: { day: "Wed", type: "workout" },
  Thu: { day: "Thu", type: "workout" },
  Fri: { day: "Fri", type: "workout" },
  Sat: { day: "Sat", type: "workout" },
  Sun: { day: "Sun", type: "workout" },
};

export type IntakeGoal =
  | "lose-weight"
  | "lose-fat"
  | "recomp"
  | "gain-muscle"
  | "gain-weight"
  | "other";

export type IntakeFocus =
  | "upper-body"
  | "lower-body"
  | "core"
  | "cardio"
  | "full-body";

export interface WorkoutIntake {
  goal: IntakeGoal;
  focus: IntakeFocus;
}

export interface StrengthMaxes {
  bench?: number;
  squat?: number;
  deadlift?: number;
  ohp?: number;
}

interface WorkoutStore {
  scheduledWorkouts: ScheduledWorkout[];
  savedWorkouts: SavedWorkout[];
  weeklySplit: WeeklySplit;
  pendingWorkout: { exercises: WorkoutExercise[]; accessories: WorkoutExercise[] } | null;
  strengthMaxes: StrengthMaxes;
  workoutIntake: WorkoutIntake | null;
  savedSplits: SavedWeeklySplit[];
  setPendingWorkout: (workout: { exercises: WorkoutExercise[]; accessories: WorkoutExercise[] }) => void;
  clearPendingWorkout: () => void;
  updateStrengthMax: (lift: keyof StrengthMaxes, value: number | undefined) => void;
  setWorkoutIntake: (intake: WorkoutIntake) => void;
  clearWorkoutIntake: () => void;
  addSplit: (name: string) => void;
  updateSplit: (id: string, updates: { name?: string; split?: WeeklySplit }) => void;
  deleteSplit: (id: string) => void;
  loadSplit: (id: string) => void;
  // legacy compat
  saveWeeklySplit: (name: string) => void;
  clearSavedWeeklySplit: () => void;
  updateWeeklySplitDay: (day: DayOfWeek, update: Partial<WeeklySplitDay>) => void;
  resetWeeklySplit: () => void;
  addScheduledWorkout: (date: string, workoutPlan: WorkoutPlan) => void;
  removeScheduledWorkout: (id: string) => void;
  markCompleted: (id: string) => void;
  getWorkoutsForDate: (date: string) => ScheduledWorkout[];
  saveWorkout: (workoutPlan: WorkoutPlan, label?: string) => void;
  removeSavedWorkout: (id: string) => void;
  updateSavedWorkoutLabel: (id: string, label: string) => void;
  updateSavedWorkout: (id: string, updates: Partial<Omit<SavedWorkout, "id" | "createdAt">>) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      scheduledWorkouts: [],
      savedWorkouts: [],
      weeklySplit: DEFAULT_SPLIT,
      pendingWorkout: null,
      strengthMaxes: {},
      workoutIntake: null,
      savedSplits: [],
      setPendingWorkout: (workout) => set({ pendingWorkout: workout }),
      clearPendingWorkout: () => set({ pendingWorkout: null }),
      updateStrengthMax: (lift, value) =>
        set((state) => ({ strengthMaxes: { ...state.strengthMaxes, [lift]: value } })),
      setWorkoutIntake: (intake) => set({ workoutIntake: intake }),
      clearWorkoutIntake: () => set({ workoutIntake: null }),
      addSplit: (name) =>
        set((state) => ({
          savedSplits: [
            ...state.savedSplits,
            {
              id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              name,
              split: state.weeklySplit,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),
      updateSplit: (id, updates) =>
        set((state) => ({
          savedSplits: state.savedSplits.map((s) =>
            s.id === id
              ? { ...s, ...updates, updatedAt: new Date() }
              : s
          ),
        })),
      deleteSplit: (id) =>
        set((state) => ({
          savedSplits: state.savedSplits.filter((s) => s.id !== id),
        })),
      loadSplit: (id) =>
        set((state) => {
          const found = state.savedSplits.find((s) => s.id === id);
          return found ? { weeklySplit: found.split } : {};
        }),
      // legacy compat: saveWeeklySplit saves as a named split entry
      saveWeeklySplit: (name) =>
        set((state) => ({
          savedSplits: [
            ...state.savedSplits,
            {
              id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              name,
              split: state.weeklySplit,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),
      clearSavedWeeklySplit: () => set({}),
      updateWeeklySplitDay: (day, update) =>
        set((state) => ({
          weeklySplit: {
            ...state.weeklySplit,
            [day]: { ...state.weeklySplit[day], ...update },
          },
        })),
      resetWeeklySplit: () => set({ weeklySplit: DEFAULT_SPLIT }),
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
      updateSavedWorkout: (id, updates) => {
        set((state) => ({
          savedWorkouts: state.savedWorkouts.map((w) =>
            w.id === id ? { ...w, ...updates } : w
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
    const betweenExerciseRest = i < exercises.length - 1 ? ex.restAfter : 0;
    return total + ex.duration + betweenExerciseRest;
  }, 0);

  const accessoryDuration = accessories.reduce((total, acc, i) => {
    const betweenAccessoryRest = i < accessories.length - 1 ? acc.restAfter : 0;
    return total + acc.duration + betweenAccessoryRest;
  }, 0);

  return exerciseDuration + accessoryDuration;
}

export function generateWorkoutId(): string {
  return `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
