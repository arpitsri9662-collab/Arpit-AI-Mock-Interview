const shapes = [
  'left-[12%] top-[18%] h-28 w-28 rotate-12 border-cyan-300/40 bg-cyan-400/10 shadow-cyan-400/20',
  'right-[14%] top-[28%] h-32 w-32 -rotate-12 rounded-full border-violet-300/40 bg-violet-400/10 shadow-violet-400/20',
  'left-[42%] top-[46%] h-36 w-36 rotate-45 border-pink-300/35 bg-pink-400/10 shadow-pink-400/20',
  'left-[22%] bottom-[14%] h-24 w-24 -rotate-6 border-emerald-300/35 bg-emerald-400/10 shadow-emerald-400/20',
  'right-[26%] bottom-[20%] h-24 w-24 rotate-[28deg] border-amber-300/35 bg-amber-400/10 shadow-amber-400/20',
]

export function BackgroundScene() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.18),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.14),transparent_28%)]" />
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(255,255,255,0.65)_1px,transparent_1px)] [background-size:28px_28px]" />
      {shapes.map((className) => (
        <div
          key={className}
          className={`absolute border shadow-2xl backdrop-blur-sm ${className}`}
        />
      ))}
    </div>
  )
}
