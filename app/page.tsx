"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkoutBuilder } from "@/components/workout-builder";
import { SplashScreen } from "@/components/splash-screen";
import { useWorkoutStore } from "@/lib/workout-store";

const SPLASH_DURATION = 7000;
const SESSION_KEY = "werk30_splash_shown";

export default function Home() {
  const router = useRouter();
  const workoutIntake = useWorkoutStore((s) => s.workoutIntake);
  // Default true so the main page never renders on first paint
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip splash if already shown this session
    if (sessionStorage.getItem(SESSION_KEY)) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // After splash, redirect to intake if no preferences have been set
  useEffect(() => {
    if (!isLoading && !workoutIntake) {
      router.replace("/workout-intake");
    }
  }, [isLoading, workoutIntake, router]);

  if (isLoading) {
    return <SplashScreen />;
  }

  // While redirecting (no intake yet), render nothing to avoid flash
  if (!workoutIntake) {
    return null;
  }

  return <WorkoutBuilder />;
}
