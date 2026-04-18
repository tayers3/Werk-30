"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WorkoutExercise } from "@/lib/workout-store";
import { formatTotalTime } from "@/lib/exercises";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkoutTimerProps {
  exercises: WorkoutExercise[];
  accessories?: WorkoutExercise[];
  onComplete: () => void;
  onClose: () => void;
}

type Phase = "exercise" | "rest" | "complete";

export function WorkoutTimer({ exercises, accessories = [], onComplete, onClose }: WorkoutTimerProps) {
  const allExercises = [...exercises, ...accessories];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("exercise");
  const [timeRemaining, setTimeRemaining] = useState(allExercises[0]?.duration || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);

  const currentExercise = allExercises[currentIndex];
  const nextExercise = allExercises[currentIndex + 1];

  const playBeep = useCallback((frequency: number = 800, duration: number = 150) => {
    if (isMuted) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch {
      // Audio not supported
    }
  }, [isMuted]);

  const goToNext = useCallback(() => {
    if (phase === "exercise" && currentExercise.restAfter > 0 && currentIndex < exercises.length - 1) {
      setPhase("rest");
      setTimeRemaining(currentExercise.restAfter);
      playBeep(600);
    } else if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setPhase("exercise");
      setTimeRemaining(exercises[currentIndex + 1].duration);
      playBeep(800);
    } else {
      setPhase("complete");
      setIsPlaying(false);
      playBeep(1000);
      setTimeout(() => playBeep(1200), 200);
      setTimeout(() => playBeep(1400), 400);
      onComplete();
    }
  }, [phase, currentExercise, currentIndex, exercises, playBeep, onComplete]);

  const goToPrevious = useCallback(() => {
    if (phase === "rest") {
      setPhase("exercise");
      setTimeRemaining(currentExercise.duration);
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setPhase("exercise");
      setTimeRemaining(exercises[currentIndex - 1].duration);
    }
  }, [phase, currentExercise, currentIndex, allExercises]);

  const resetWorkout = useCallback(() => {
    setCurrentIndex(0);
    setPhase("exercise");
    setTimeRemaining(allExercises[0]?.duration || 0);
    setIsPlaying(false);
    setTotalElapsed(0);
  }, [allExercises]);

  useEffect(() => {
    if (!isPlaying || phase === "complete") return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          goToNext();
          return 0;
        }
        // Countdown beeps at 3, 2, 1
        if (prev <= 4 && prev > 1) {
          playBeep(600, 100);
        }
        return prev - 1;
      });
      setTotalElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, phase, goToNext, playBeep]);

  if (allExercises.length === 0) return null;

  const totalWorkoutTime = allExercises.reduce(
    (total, ex, i) => total + ex.duration + (i < allExercises.length - 1 ? ex.restAfter : 0),
    0
  );

  const progress = (totalElapsed / totalWorkoutTime) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
          <span className="text-sm">Exit</span>
        </button>
        <div className="text-sm text-muted-foreground">
          Exercise {currentIndex + 1} of {allExercises.length}
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {phase === "complete" ? (
          <div className="space-y-6">
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <span className="text-4xl">🎉</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Workout Complete!
            </h1>
            <p className="text-muted-foreground">
              Great job! You crushed your 30-minute workout.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={resetWorkout}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart
              </Button>
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Phase indicator */}
            <div
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium mb-4",
                phase === "rest"
                  ? "bg-accent/20 text-accent"
                  : "bg-primary/20 text-primary"
              )}
            >
              {phase === "rest" ? "REST" : "EXERCISE"}
            </div>

            {/* Exercise name */}
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2 text-balance">
              {phase === "rest" ? "Rest" : currentExercise.name}
            </h1>

            {/* Next up preview */}
            {nextExercise && phase === "rest" && (
              <p className="text-muted-foreground mb-8">
                Up next: <span className="text-foreground">{nextExercise.name}</span>
              </p>
            )}

            {/* Timer circle */}
            <div className="relative my-8">
              <svg className="w-48 h-48 md:w-64 md:h-64 transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-secondary"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className={phase === "rest" ? "text-accent" : "text-primary"}
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${
                    2 *
                    Math.PI *
                    45 *
                    (1 -
                      timeRemaining /
                        (phase === "rest"
                          ? currentExercise.restAfter
                          : currentExercise.duration))
                  }%`}
                  style={{ transition: "stroke-dashoffset 0.3s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl md:text-7xl font-bold text-foreground tabular-nums">
                  {formatTotalTime(timeRemaining)}
                </span>
              </div>
            </div>

            {/* Instructions */}
            {phase === "exercise" && (
              <div className="max-w-md mb-8">
                <p className="text-muted-foreground text-sm md:text-base">
                  {currentExercise.description}
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0 && phase === "exercise"}
                className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={cn(
                  "p-6 rounded-full transition-colors",
                  isPlaying
                    ? "bg-accent text-accent-foreground"
                    : "bg-primary text-primary-foreground"
                )}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </button>
              <button
                onClick={goToNext}
                className="p-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                {currentIndex === exercises.length - 1 && phase !== "rest" ? (
                  <SkipForward className="h-6 w-6" />
                ) : (
                  <ChevronRight className="h-6 w-6" />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer - exercise list preview */}
      {phase !== "complete" && (
        <div className="border-t border-border p-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {exercises.map((ex, i) => (
              <div
                key={`${ex.id}-${i}`}
                className={cn(
                  "flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  i === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : i < currentIndex
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {ex.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
