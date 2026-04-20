"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { WorkoutExercise } from "@/lib/workout-store";
import { formatTotalTime } from "@/lib/exercises";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  Square,
  StopCircle,
  LogOut,
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
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [stopTime, setStopTime] = useState<Date | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  const audioContextRef = useRef<AudioContext | null>(null);

  const currentExercise = allExercises[currentIndex];
  const nextExercise = allExercises[currentIndex + 1];

  const handleStartWorkout = () => {
    setStartTime(new Date());
    setStopTime(null);
    setIsPlaying(true);
  };

  const handleStopWorkout = () => {
    // Stop and reset the current exercise timer (does not end the workout)
    setIsPlaying(false);
    setPhase("exercise");
    setTimeRemaining(currentExercise?.duration || 0);
  };

  const handleEndWorkout = () => {
    setStopTime(new Date());
    setIsPlaying(false);
    setPhase("complete");
    onComplete();
  };

  const toggleExerciseComplete = (index: number) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedExercises(newCompleted);
  };

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
    if (phase === "exercise" && currentExercise.restAfter > 0 && currentIndex < allExercises.length - 1) {
      setPhase("rest");
      setTimeRemaining(currentExercise.restAfter);
      playBeep(600);
    } else if (currentIndex < allExercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setPhase("exercise");
      setTimeRemaining(allExercises[currentIndex + 1].duration);
      playBeep(800);
    } else {
      setPhase("complete");
      setIsPlaying(false);
      playBeep(1000);
      setTimeout(() => playBeep(1200), 200);
      setTimeout(() => playBeep(1400), 400);
      onComplete();
    }
  }, [phase, currentExercise, currentIndex, allExercises, playBeep, onComplete]);

  const goToPrevious = useCallback(() => {
    if (phase === "rest") {
      setPhase("exercise");
      setTimeRemaining(currentExercise.duration);
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setPhase("exercise");
      setTimeRemaining(allExercises[currentIndex - 1].duration);
    }
  }, [phase, currentExercise, currentIndex, allExercises]);

  const resetWorkout = useCallback(() => {
    setCurrentIndex(0);
    setPhase("exercise");
    setTimeRemaining(allExercises[0]?.duration || 0);
    setIsPlaying(false);
    setTotalElapsed(0);
    setStartTime(null);
    setStopTime(null);
    setCompletedExercises(new Set());
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

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

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
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Start:</span>
              <span className="font-mono text-sm font-semibold text-foreground">
                {formatTime(startTime)}
              </span>
            </div>
          </div>
          {startTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Stop:</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {formatTime(stopTime)}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
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
                          ? (currentExercise.restAfter || 1)
                          : (currentExercise.duration || 1)))
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
            <div className="flex flex-col items-center gap-3">
              {/* Row 1: Start / Pause / Resume / Stop / End */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {!startTime ? (
                  /* ── START ── */
                  <Button onClick={handleStartWorkout} size="lg" className="px-8">
                    <Play className="h-5 w-5 mr-2" />
                    Start
                  </Button>
                ) : (
                  <>
                    {/* ── PAUSE / RESUME ── */}
                    {isPlaying ? (
                      <Button
                        onClick={() => setIsPlaying(false)}
                        variant="secondary"
                        size="lg"
                        className="px-6"
                      >
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setIsPlaying(true)}
                        size="lg"
                        className="px-6"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Resume
                      </Button>
                    )}

                    {/* ── STOP (reset current timer) ── */}
                    <Button
                      onClick={handleStopWorkout}
                      variant="outline"
                      size="lg"
                      className="px-6"
                    >
                      <StopCircle className="h-5 w-5 mr-2" />
                      Stop
                    </Button>

                    {/* ── END WORKOUT ── */}
                    <Button
                      onClick={handleEndWorkout}
                      variant="destructive"
                      size="lg"
                      className="px-6"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      End Workout
                    </Button>
                  </>
                )}
              </div>

              {/* Row 2: Previous / Next exercise (only once started) */}
              {startTime && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={goToPrevious}
                    variant="outline"
                    size="lg"
                    disabled={currentIndex === 0 && phase === "exercise"}
                    className="px-4"
                  >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Previous
                  </Button>
                  <Button
                    onClick={goToNext}
                    variant="outline"
                    size="lg"
                    disabled={currentIndex === allExercises.length - 1 && phase === "exercise"}
                    className="px-4"
                  >
                    Next
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer - exercise list preview */}
      {phase !== "complete" && (
        <div className="border-t border-border p-4">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Exercises ({completedExercises.size}/{allExercises.length})
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allExercises.map((ex, i) => (
                <button
                  key={`${ex.id}-${i}`}
                  onClick={() => toggleExerciseComplete(i)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    i === currentIndex
                      ? "bg-primary text-primary-foreground"
                      : i < currentIndex
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                  title="Click to mark completed"
                >
                  {completedExercises.has(i) ? (
                    <Check className="h-3.5 w-3.5 flex-shrink-0" />
                  ) : (
                    <Square className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <span className="truncate">{ex.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
