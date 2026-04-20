"use client";

const SPLASH_DURATION = 7000;

export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[oklch(0.09_0.01_250)]"
    >
      {/* Glow ring */}
      <div className="relative flex items-center justify-center mb-8">
        <div
          className="absolute h-52 w-52 rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75_0.18_145/0.25) 0%, transparent 70%)",
          }}
        />
        {/* Logo mark */}
        <div className="relative flex h-36 w-36 items-center justify-center rounded-2xl border-2 border-[oklch(0.75_0.18_145)] bg-[oklch(0.13_0.01_250)] shadow-lg">
          <span
            className="select-none font-extrabold tracking-tighter leading-none text-center"
            style={{
              fontSize: "2.25rem",
              color: "oklch(0.75 0.18 145)",
              fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
            }}
          >
            WERK
            <br />
            <span style={{ fontSize: "3rem" }}>30</span>
          </span>
        </div>
      </div>

      {/* Tagline */}
      <p
        className="text-sm tracking-widest uppercase"
        style={{ color: "oklch(0.55 0 0)" }}
      >
        30-Minute Workout Builder
      </p>

      {/* Progress bar */}
      <div
        className="absolute bottom-12 h-0.5 w-32 overflow-hidden rounded-full"
        style={{ background: "oklch(0.25 0.01 250)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "oklch(0.75 0.18 145)",
            animation: `werk-progress ${SPLASH_DURATION}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes werk-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
