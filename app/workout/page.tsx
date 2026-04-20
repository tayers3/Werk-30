"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, useMemo, Suspense } from "react";
import { WorkoutExercise, calculateTotalDuration, useWorkoutStore, WorkoutPlan, generateWorkoutId } from "@/lib/workout-store";
import { WorkoutList } from "@/components/workout-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Clock, Volume2, VolumeX, Timer, StopCircle, LogOut, BookmarkPlus } from "lucide-react";
import { formatTotalTime } from "@/lib/exercises";
import { cn } from "@/lib/utils";

function WorkoutPageContent() {
  const router = useRouter();
  const { pendingWorkout, clearPendingWorkout, saveWorkout } = useWorkoutStore();
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [accessories, setAccessories] = useState<WorkoutExercise[]>([]);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [workoutLabel, setWorkoutLabel] = useState("");
  const [saved, setSaved] = useState(false);

  // ── Timer state ──────────────────────────────────────────────────────────
  type TimerPhase = "exercise" | "rest" | "set-rest" | "complete";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<TimerPhase>("exercise");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  const audioContextRef = useRef<AudioContext | null>(null);

  const allExercises = useMemo(
    () => [...workoutExercises, ...accessories],
    [workoutExercises, accessories]
  );
  const currentExercise = allExercises[currentIndex];
  const nextExercise = allExercises[currentIndex + 1];
  const isCurrentAccessory = currentIndex >= workoutExercises.length;
  const isComplete = phase === "complete";

  // Initialize time when exercises first load
  useEffect(() => {
    if (workoutExercises.length > 0 && timeRemaining === 0) {
      setTimeRemaining(workoutExercises[0].duration);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutExercises]);

  // ── Audio ────────────────────────────────────────────────────────────────
  const playBeep = useCallback((frequency = 800, duration = 150) => {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = frequency;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {
      // Audio not supported
    }
  }, [isMuted]);

  // ── Atomic transition helper ─────────────────────────────────────────────
  // All phase changes go through here so state is always updated consistently.
  type Transition =
    | { phase: "exercise"; index: number; set: number; duration: number }
    | { phase: "set-rest" | "rest"; rest: number }
    | { phase: "complete" };

  const applyTransition = useCallback((t: Transition) => {
    if (t.phase === "exercise") {
      setCurrentIndex(t.index);
      setCurrentSet(t.set);
      setPhase("exercise");
      setTimeRemaining(t.duration);
    } else if (t.phase === "set-rest" || t.phase === "rest") {
      setPhase(t.phase);
      setTimeRemaining(t.rest);
    } else {
      setPhase("complete");
      setIsPlaying(false);
    }
  }, []);

  // ── Navigation ───────────────────────────────────────────────────────────
  const goToNext = useCallback(() => {
    if (!currentExercise) return;
    const rest = currentExercise.restAfter;

    if (phase === "set-rest") {
      // Finished rest between sets — start the next set
      applyTransition({ phase: "exercise", index: currentIndex, set: currentSet, duration: currentExercise.duration });
      playBeep(800);
      return;
    }

    if (phase === "rest") {
      // Finished rest after exercise — start next exercise
      const next = allExercises[currentIndex + 1];
      applyTransition({ phase: "exercise", index: currentIndex + 1, set: 1, duration: next.duration });
      playBeep(800);
      return;
    }

    // phase === "exercise"
    const hasMoreSets = currentSet < currentExercise.sets;
    const hasNextExercise = currentIndex < allExercises.length - 1;

    if (hasMoreSets) {
      if (rest > 0) {
        setCurrentSet(currentSet + 1); // advance set counter before rest
        applyTransition({ phase: "set-rest", rest });
        playBeep(600);
      } else {
        applyTransition({ phase: "exercise", index: currentIndex, set: currentSet + 1, duration: currentExercise.duration });
        playBeep(800);
      }
    } else if (hasNextExercise) {
      if (rest > 0) {
        applyTransition({ phase: "rest", rest });
        playBeep(600);
      } else {
        const next = allExercises[currentIndex + 1];
        applyTransition({ phase: "exercise", index: currentIndex + 1, set: 1, duration: next.duration });
        playBeep(800);
      }
    } else {
      applyTransition({ phase: "complete" });
      playBeep(1000);
      setTimeout(() => playBeep(1200), 200);
      setTimeout(() => playBeep(1400), 400);
    }
  }, [phase, currentExercise, currentIndex, currentSet, allExercises, applyTransition, playBeep]);

  const goToPrevious = useCallback(() => {
    if (!currentExercise) return;

    if (phase === "rest" || phase === "set-rest") {
      // Step back to last set of the current exercise
      applyTransition({ phase: "exercise", index: currentIndex, set: currentExercise.sets, duration: currentExercise.duration });
    } else if (phase === "exercise" && currentSet > 1) {
      applyTransition({ phase: "exercise", index: currentIndex, set: currentSet - 1, duration: currentExercise.duration });
    } else if (currentIndex > 0) {
      const prev = allExercises[currentIndex - 1];
      applyTransition({ phase: "exercise", index: currentIndex - 1, set: prev.sets, duration: prev.duration });
    }
  }, [phase, currentExercise, currentIndex, currentSet, allExercises, applyTransition]);

  // ── Countdown interval ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || isComplete) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { goToNext(); return 0; }
        if (prev <= 4) playBeep(600, 100);
        return prev - 1;
      });
      setTotalElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isComplete, goToNext, playBeep]);

  // ── Workout-level controls ───────────────────────────────────────────────
  const handleStartWorkout = () => {
    const first = allExercises[0];
    if (!first) return;
    setStartTime(new Date());
    setIsPlaying(true);
    setTotalElapsed(0);
    setCompletedExercises(new Set());
    applyTransition({ phase: "exercise", index: 0, set: 1, duration: first.duration });
  };

  const handleEndWorkout = () => {
    applyTransition({ phase: "complete" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStopTimer = () => {
    setIsPlaying(false);
    applyTransition({ phase: "exercise", index: currentIndex, set: 1, duration: currentExercise?.duration || 0 });
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSaveWorkout = () => {
    const totalDuration = calculateTotalDuration(workoutExercises, accessories);
    const plan: WorkoutPlan = {
      id: generateWorkoutId(),
      name: workoutLabel || `Workout ${new Date().toLocaleDateString()}`,
      exercises: workoutExercises,
      accessories,
      totalDuration,
      createdAt: new Date(),
    };
    saveWorkout(plan, workoutLabel || undefined);
    setShowSaveDialog(false);
    setWorkoutLabel("");
    setSaved(true);
  };

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
    <div className="min-h-screen bg-background pb-36">{/* pb-36 reserves space for sticky controls */}
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
                    : isCurrentAccessory
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-primary/20 text-primary"
                )}>
                  {phase === "rest" ? "REST" : phase === "set-rest" ? "SET REST" : isCurrentAccessory ? "ACCESSORY" : "EXERCISE"}
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
              <div className="flex justify-center mb-2">
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
            onRemove={() => {}}
            onReorder={() => {}}
            onRestChange={() => {}}
            totalDuration={totalDuration}
            maxDuration={30 * 60}
          />

          {/* Accessories overview */}
          {accessories.length > 0 && (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                  ACCESSORIES
                </span>
                {accessories.length} accessory exercise{accessories.length !== 1 ? "s" : ""}
              </h3>
              <div className="space-y-2">
                {accessories.map((acc, i) => {
                  const globalIndex = workoutExercises.length + i;
                  const isDone = completedExercises.has(globalIndex);
                  const isCurrent = currentIndex === globalIndex;
                  return (
                    <div
                      key={`acc-${acc.id}-${i}`}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                        isCurrent
                          ? "border-orange-500/40 bg-orange-500/10"
                          : isDone
                          ? "border-border/40 bg-muted/30 opacity-60"
                          : "border-border/60 bg-card"
                      )}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 text-[10px] font-bold text-orange-400 shrink-0">
                        {globalIndex + 1}
                      </span>
                      <span className="flex-1 font-medium text-foreground">{acc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {acc.sets} &times; {acc.reps}
                      </span>
                      {isCurrent && (
                        <span className="text-xs text-orange-400 font-medium">Active</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Sticky Controls Footer ── always visible ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col items-center gap-2">
          {/* Row 1: Start / Pause / Resume / Stop / End / Back */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {isComplete ? (
              <>
                <Button onClick={handleStartWorkout} size="lg" className="px-10">
                  <Play className="h-5 w-5 mr-2" />
                  Start Again
                </Button>
                <Button onClick={handleBackToBuilder} variant="outline" size="default" className="px-5">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Builder
                </Button>
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  variant="outline"
                  size="default"
                  disabled={saved}
                  className="px-4"
                >
                  <BookmarkPlus className="h-4 w-4 mr-1" />
                  {saved ? "Saved" : "Save Workout"}
                </Button>
              </>
            ) : !startTime ? (
              <Button onClick={handleStartWorkout} size="lg" className="px-10">
                <Play className="h-5 w-5 mr-2" />
                Start Workout
              </Button>
            ) : (
              <>
                {isPlaying ? (
                  <Button onClick={() => setIsPlaying(false)} variant="secondary" size="default" className="px-5">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={() => setIsPlaying(true)} size="default" className="px-5">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                <Button onClick={handleStopTimer} variant="outline" size="default" className="px-5">
                  <StopCircle className="h-4 w-4 mr-2" />
                  Stop
                </Button>
                <Button onClick={handleEndWorkout} variant="destructive" size="default" className="px-5">
                  <LogOut className="h-4 w-4 mr-2" />
                  End Workout
                </Button>
              </>
            )}
          </div>

          {/* Row 2: Previous / Next + Save — only shown during active workout */}
          {startTime && !isComplete && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={goToPrevious}
                  variant="outline"
                  size="default"
                  disabled={currentIndex === 0 && phase === "exercise" && currentSet === 1}
                  className="px-4"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  onClick={goToNext}
                  variant="outline"
                  size="default"
                  disabled={
                    currentIndex === allExercises.length - 1 &&
                    phase === "exercise" &&
                    currentSet === currentExercise?.sets
                  }
                  className="px-4"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  variant="outline"
                  size="default"
                  disabled={saved}
                  className="px-4"
                >
                  <BookmarkPlus className="h-4 w-4 mr-1" />
                  {saved ? "Saved" : "Save"}
                </Button>
              </div>
          )}
        </div>
      </div>

      {/* Save Workout Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="workout-label">Workout Name</Label>
              <Input
                id="workout-label"
                placeholder={`Workout ${new Date().toLocaleDateString()}`}
                value={workoutLabel}
                onChange={(e) => setWorkoutLabel(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveWorkout}>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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