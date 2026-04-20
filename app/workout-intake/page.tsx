"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkoutStore, IntakeGoal, IntakeFocus } from "@/lib/workout-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Scale,
  Flame,
  RefreshCw,
  Dumbbell,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";

interface GoalOption {
  value: IntakeGoal;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface FocusOption {
  value: IntakeFocus;
  label: string;
  description: string;
  emoji: string;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    value: "lose-weight",
    label: "Lose Weight",
    description: "Burn calories, improve cardiovascular health",
    icon: <Scale className="h-5 w-5" />,
  },
  {
    value: "lose-fat",
    label: "Lose Body Fat",
    description: "Reduce fat while preserving lean mass",
    icon: <Flame className="h-5 w-5" />,
  },
  {
    value: "recomp",
    label: "Body Recomp",
    description: "Build muscle and lose fat simultaneously",
    icon: <RefreshCw className="h-5 w-5" />,
  },
  {
    value: "gain-muscle",
    label: "Gain Muscle",
    description: "Hypertrophy-focused resistance training",
    icon: <Dumbbell className="h-5 w-5" />,
  },
  {
    value: "gain-weight",
    label: "Gain Weight",
    description: "Add size and strength with heavier loads",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    value: "other",
    label: "Other",
    description: "General fitness & feel-good training",
    icon: <HelpCircle className="h-5 w-5" />,
  },
];

const FOCUS_OPTIONS: FocusOption[] = [
  { value: "upper-body", label: "Upper Body", description: "Chest, back, shoulders, arms", emoji: "💪" },
  { value: "lower-body", label: "Lower Body", description: "Quads, hamstrings, glutes, calves", emoji: "🦵" },
  { value: "core",       label: "Core",       description: "Abs, obliques, lower back", emoji: "🎯" },
  { value: "cardio",     label: "Cardio",     description: "Heart rate, endurance, conditioning", emoji: "🏃" },
  { value: "full-body",  label: "Full Body",  description: "Balanced head-to-toe session", emoji: "⚡" },
];

export default function WorkoutIntakePage() {
  const router = useRouter();
  const { setWorkoutIntake, workoutIntake } = useWorkoutStore();

  const [selectedGoal, setSelectedGoal] = useState<IntakeGoal | null>(workoutIntake?.goal ?? null);
  const [selectedFocus, setSelectedFocus] = useState<IntakeFocus | null>(workoutIntake?.focus ?? null);

  const canContinue = selectedGoal !== null && selectedFocus !== null;

  const handleContinue = () => {
    if (!selectedGoal || !selectedFocus) return;
    setWorkoutIntake({ goal: selectedGoal, focus: selectedFocus });
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{workoutIntake ? "Update Your Goals" : "Let's Personalise Your Workout"}</h1>
            <p className="text-xs text-muted-foreground">{workoutIntake ? "Change your training goal and focus" : "Answer two quick questions"}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={cn("h-2 flex-1 rounded-full transition-all", selectedGoal ? "bg-primary" : "bg-border")} />
          <div className={cn("h-2 flex-1 rounded-full transition-all", selectedFocus ? "bg-primary" : "bg-border")} />
        </div>

        {/* Question 1 — Goal */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">What is your main goal?</h2>
            <p className="text-sm text-muted-foreground mt-1">This helps us recommend the right exercise style.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedGoal(opt.value)}
                className={cn(
                  "group flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                  selectedGoal === opt.value
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  selectedGoal === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                )}>
                  {opt.icon}
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    "font-semibold text-sm transition-colors",
                    selectedGoal === opt.value ? "text-primary" : "text-foreground"
                  )}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Question 2 — Focus */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">What's your focus today?</h2>
            <p className="text-sm text-muted-foreground mt-1">Pick the area you want to train in this session.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedFocus(opt.value)}
                className={cn(
                  "group flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                  selectedFocus === opt.value
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
                )}
              >
                <span className="text-2xl shrink-0">{opt.emoji}</span>
                <div className="min-w-0">
                  <p className={cn(
                    "font-semibold text-sm transition-colors",
                    selectedFocus === opt.value ? "text-primary" : "text-foreground"
                  )}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{opt.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Continue CTA */}
        <div className="pb-8">
          <Button
            size="lg"
            className="w-full"
            disabled={!canContinue}
            onClick={handleContinue}
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Build My Workout
          </Button>
          {!canContinue && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Select a goal and a focus to continue
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
