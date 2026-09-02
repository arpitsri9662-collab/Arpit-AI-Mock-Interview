interface AnimatedCanvasProps {
  className?: string
  height?: string
}

export function AnimatedCanvas({ className = '', height = 'h-64' }: AnimatedCanvasProps) {
  return (
    <div className={`relative w-full ${height} overflow-hidden rounded-lg bg-slate-950 ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.35),transparent_28%),radial-gradient(circle_at_70%_65%,rgba(168,85,247,0.28),transparent_30%)]" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-md border border-cyan-300/50 bg-cyan-400/15 shadow-2xl shadow-cyan-400/30" />
      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle,rgba(255,255,255,0.75)_1px,transparent_1px)] [background-size:22px_22px]" />
    </div>
  )
}
