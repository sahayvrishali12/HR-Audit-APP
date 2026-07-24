export function GradientBlob({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute -z-10 select-none ${className}`} aria-hidden="true">
      <div
        className="h-full w-full blur-3xl"
        style={{
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          background:
            "conic-gradient(from 210deg, var(--gradient-blue), var(--gradient-purple), var(--gradient-pink), var(--gradient-orange), var(--gradient-blue))",
        }}
      />
    </div>
  )
}
