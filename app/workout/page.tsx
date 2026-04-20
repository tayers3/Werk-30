"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import { WorkoutExercise, calculateTotalDuration, useWorkoutStore } from "@/lib/workout-store";
import { WorkoutList } from "@/components/workout-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Pause, Square, ChevronLeft, ChevronRight, Clock, Volume2, VolumeX, Timer, StopCircle, LogOut } from "lucide-react";
import { formatTotalTime } from "@/lib/exercises";
import { cn } from "@/lib/utils";

function WorkoutPageContent() {
  const router = useRouter();
  const { pendingWorkout, clearPendingWorkout } = useWorkoutStore();
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [accessories, setAccessories] = useState<WorkoutExercise[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  // Timer state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"exercise" | "rest" | "set-rest" | "complete">("exercise");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [stopTime, setStopTime] = useState<Date | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [currentSet, setCurrentSet] = useState(1);

  const audioContextRef = useRef<AudioContext | null>(null);

  const allExercises = useMemo(
    () => [...workoutExercises, ...accessories],
    [workoutExercises, accessories]
  );
  const currentExercise = allExercises[currentIndex];
  const nextExercise = allExercises[currentIndex + 1];

  // Initialize timer duration when exercises are loaded (do NOT auto-start)
  useEffect(() => {
    if (workoutExercises.length > 0 && timeRemaining === 0) {
      setTimeRemaining(workoutExercises[0].duration);
      setCurrentSet(1);
    }
  }, [workoutExercises]);

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

  const handleStartWorkout = () => {
    // Workout auto-starts now, but this function can be used to restart if needed
    setStartTime(new Date());
    setStopTime(null);
    setIsPlaying(true);
    setTimeRemaining(currentExercise?.duration || 0);
    setCurrentIndex(0);
    setPhase("exercise");
    setIsComplete(false);
    setCompletedExercises(new Set());
    setCurrentSet(1);
  };

  const handlePauseWorkout = () => {
    setIsPlaying(false);
  };

  const handleResumeWorkout = () => {
    setIsPlaying(true);
  };

  const handleEndWorkout = () => {
    setStopTime(new Date());
    setIsPlaying(false);
    setPhase("complete");
    setIsComplete(true);
  };

  const handleStopTimer = () => {
    // Stop and reset just the current exercise timer
    setIsPlaying(false);
    setPhase("exercise");
    setCurrentSet(1);
    setTimeRemaining(currentExercise?.duration || 0);
  };

  const goToNext = useCallback(() => {
    if (!currentExercise) return;

    if (phase === "exercise") {
      if (currentSet < currentExercise.sets) {
        // More sets remaining for this exercise
        const nextSet = currentSet + 1;
        setCurrentSet(nextSet);
        if (currentExercise.restAfter > 0) {
          setPhase("set-rest");
          setTimeRemaining(currentExercise.restAfter);
          playBeep(600);
        } else {
          // No rest — stay in exercise phase for the next set
          setTimeRemaining(currentExercise.duration);
          playBeep(800);
        }
      } else if (currentIndex < allExercises.length - 1) {
        // All sets done; move to rest before next exercise
        if (currentExercise.restAfter > 0) {
          setPhase("rest");
          setTimeRemaining(currentExercise.restAfter);
          playBeep(600);
        } else {
          // No rest — jump straight to next exercise
          const nextEx = allExercises[currentIndex + 1];
          setCurrentIndex(currentIndex + 1);
          setPhase("exercise");
          setTimeRemaining(nextEx.duration);
          setCurrentSet(1);
          playBeep(800);
        }
      } else {
        // All exercises complete
        setPhase("complete");
        setIsPlaying(false);
        playBeep(1000);
        setTimeout(() => playBeep(1200), 200);
        setTimeout(() => playBeep(1400), 400);
        setIsComplete(true);
      }
    } else if (phase === "set-rest") {
      // Rest between sets done — resume same exercise, next set
      setPhase("exercise");
      setTimeRemaining(currentExercise.duration);
      playBeep(800);
    } else if (phase === "rest") {
      // Rest after exercise done — start next exercise
      const nextEx = allExercises[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      setPhase("exercise");
      setTimeRemaining(nextEx.duration);
      setCurrentSet(1);
      playBeep(800);
    }
  }, [phase, currentExercise, currentIndex, allExercises, currentSet, playBeep]);

  const goToPrevious = useCallback(() => {
    if (!currentExercise) return;

    if (phase === "rest") {
      // Going back from rest after exercise - go to last set of current exercise
      setPhase("exercise");
      setTimeRemaining(currentExercise.duration);
      setCurrentSet(currentExercise.sets);
    } else if (phase === "set-rest") {
      // Going back from rest between sets - go to previous set
      setPhase("exercise");
      setTimeRemaining(currentExercise.duration);
      setCurrentSet(Math.max(1, currentSet - 1));
    } else if (phase === "exercise" && currentSet > 1) {
      // Going back within the same exercise to previous set
      setPhase("set-rest");
      setTimeRemaining(currentExercise.restAfter);
      setCurrentSet(currentSet - 1);
    } else if (currentIndex > 0) {
      // Going back to previous exercise
      setCurrentIndex(currentIndex - 1);
      setPhase("exercise");
      const prevEx = allExercises[currentIndex - 1];
      if (prevEx) {
        setTimeRemaining(prevEx.duration);
        setCurrentSet(prevEx.sets); // Start from last set of previous exercise
      }
    }
  }, [phase, currentExercise, currentIndex, allExercises, currentSet]);

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

  const handleUpdateSets = (exerciseIndex: number, newSets: number) => {
    const updatedExercises = [...workoutExercises];
    const updatedAccessories = [...accessories];

    if (exerciseIndex < workoutExercises.length) {
      updatedExercises[exerciseIndex] = { ...updatedExercises[exerciseIndex], sets: Math.max(1, newSets) };
      setWorkoutExercises(updatedExercises);
    } else {
      const accessoryIndex = exerciseIndex - workoutExercises.length;
      updatedAccessories[accessoryIndex] = { ...updatedAccessories[accessoryIndex], sets: Math.max(1, newSets) };
      setAccessories(updatedAccessories);
    }
  };

  const handleUpdateReps = (exerciseIndex: number, newReps: string) => {
    const updatedExercises = [...workoutExercises];
    const updatedAccessories = [...accessories];

    if (exerciseIndex < workoutExercises.length) {
      updatedExercises[exerciseIndex] = { ...updatedExercises[exerciseIndex], reps: newReps };
      setWorkoutExercises(updatedExercises);
    } else {
      const accessoryIndex = exerciseIndex - workoutExercises.length;
      updatedAccessories[accessoryIndex] = { ...updatedAccessories[accessoryIndex], reps: newReps };
      setAccessories(updatedAccessories);
    }
  };

  useEffect(() => {
    if (pendingWorkout) {
      setWorkoutExercises(pendingWorkout.exercises);
      setAccessories(pendingWorkout.accessories);
      setShowWelcomeMessage(true);
      clearPendingWorkout();
    } else {
      router.push("/");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalDuration = calculateTotalDuration(workoutExercises, accessories);

  const handleBackToBuilder = () => {
    router.push("/");
  };

  if (workoutExercises.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToBuilder}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Builder
              </Button>
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Timer className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Your Workout</h1>
                <p className="text-xs text-muted-foreground">
                  {startTime ? "In progress" : "Ready to start"} • {workoutExercises.length} exercises{accessories.length > 0 ? ` + ${accessories.length} accessories` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {startTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">
                    {startTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showWelcomeMessage && !startTime && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-center text-primary-foreground shadow-sm">
            Congratulations you made the first step!! It's time to put the work in!!
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Current Exercise Display — always visible once exercises loaded */}
          {!isComplete && (
            <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-sm">
              <div className="text-center mb-4">
                <div className={cn(
                  "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4",
                  phase === "rest"
                    ? "bg-accent/20 text-accent"
                    : phase === "set-rest"
                    ? "bg-blue-500/20 text-blue-600"
                    : "bg-primary/20 text-primary"
                )}>
                  {phase === "rest" ? "REST" : phase === "set-rest" ? "SET REST" : "EXERCISE"}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {phase === "rest" ? "Rest" : currentExercise?.name || "Loading..."}
                </h3>
                {phase === "exercise" && currentExercise && (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium">Sets:</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={currentExercise.sets}
                          onChange={(e) => handleUpdateSets(currentIndex, parseInt(e.target.value) || 1)}
                          className="w-12 px-2 py-1 text-xs border border-input rounded bg-background"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium">Reps:</label>
                        <input
                          type="text"
                          value={currentExercise.reps}
                          onChange={(e) => handleUpdateReps(currentIndex, e.target.value)}
                          className="w-16 px-2 py-1 text-xs border border-input rounded bg-background"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Set {currentSet} of {currentExercise.sets}
                      </div>
                    </div>
                    <p>{currentExercise.description}</p>
                  </div>
                )}
                {nextExercise && phase === "rest" && (
                  <p className="text-muted-foreground">Up next: <span className="text-foreground font-medium">{nextExercise.name}</span></p>
                )}
              </div>

              {/* Timer Circle */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <svg className="w-32 h-32 md:w-40 md:h-40 transform -rotate-90">
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
                            (phase === "rest" || phase === "set-rest"
                              ? currentExercise?.restAfter || 30
                              : currentExercise?.duration || 30))
                      }%`}
                      style={{ transition: "stroke-dashoffset 0.3s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl md:text-4xl font-bold text-foreground tabular-nums">
                      {formatTotalTime(timeRemaining)}
                    </span>
                  </div>
                </div>
              </div>

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
                        <Button onClick={handlePauseWorkout} variant="secondary" size="lg" className="px-6">
                          <Pause className="h-5 w-5 mr-2" />
                          Pause
                        </Button>
                      ) : (
                        <Button onClick={handleResumeWorkout} size="lg" className="px-6">
                          <Play className="h-5 w-5 mr-2" />
                          Resume
                        </Button>
                      )}

                      {/* ── STOP (reset current timer) ── */}
                      <Button onClick={handleStopTimer} variant="outline" size="lg" className="px-6">
                        <StopCircle className="h-5 w-5 mr-2" />
                        Stop
                      </Button>

                      {/* ── END WORKOUT ── */}
                      <Button onClick={handleEndWorkout} variant="destructive" size="lg" className="px-6">
                        <LogOut className="h-5 w-5 mr-2" />
                        End Workout
                      </Button>
                    </>
                  )}
                </div>

                {/* Row 2: Previous / Next exercise */}
                {startTime && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={goToPrevious}
                      variant="outline"
                      size="lg"
                      disabled={currentIndex === 0 && phase === "exercise" && currentSet === 1}
                      className="px-4"
                    >
                      <ChevronLeft className="h-5 w-5 mr-1" />
                      Previous Exercise
                    </Button>
                    <Button
                      onClick={goToNext}
                      variant="outline"
                      size="lg"
                      disabled={currentIndex === allExercises.length - 1 && phase === "exercise" && currentSet === currentExercise?.sets}
                      className="px-4"
                    >
                      Next Exercise
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completion Message */}
          {isComplete && (
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6 text-center shadow-sm">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Workout Complete!</h3>
              <p className="text-muted-foreground">Great job! You crushed your workout.</p>
            </div>
          )}

          {/* Workout Overview */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              🎯 Your Crafted Workout
            </h2>
            <p className="text-muted-foreground">
              {workoutExercises.length} exercises{accessories.length > 0 ? ` + ${accessories.length} accessories` : ""}
              {startTime && !isComplete && " • Workout in progress"}
              {isComplete && " • Completed"}
            </p>
            {startTime && !isComplete && (
              <div className="mt-4">
                <Button onClick={handleStartWorkout} variant="outline" size="sm">
                  🔄 Restart Workout
                </Button>
              </div>
            )}
          </div>

          <WorkoutList
            exercises={workoutExercises}
            onRemove={() => {}} // Read-only on this page
            onReorder={() => {}} // Read-only on this page
            onRestChange={() => {}} // Read-only on this page
            totalDuration={totalDuration}
            maxDuration={30 * 60}
          />
        </div>
      </main>
    </div>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workout...</p>
        </div>
      </div>
    }>
      <WorkoutPageContent />
    </Suspense>
  );
}