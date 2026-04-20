"use client";

import { useRouter } from "next/navigation";
import { SavedWorkouts } from "@/components/saved-workouts";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SavedWorkoutsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <div className="text-primary-foreground font-bold text-lg">💾</div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Saved Workouts</h1>
                <p className="text-xs text-muted-foreground">Manage your workout templates</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <SavedWorkouts />
      </main>
    </div>
  );
}