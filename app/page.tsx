"use client";

import { useEffect, useState } from "react";
import { WorkoutBuilder } from "@/components/workout-builder";
import { SplashScreen } from "@/components/splash-screen";

const SPLASH_DURATION = 7000;
const SESSION_KEY = "werk30_splash_shown";

export default function Home() {
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

  if (isLoading) {
    return <SplashScreen />;
  }

  return <WorkoutBuilder />;
}
