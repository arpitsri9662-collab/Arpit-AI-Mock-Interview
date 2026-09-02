import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md"
  showText?: boolean
  className?: string
}

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const isSmall = size === "sm"

  return (
    <div className={cn("flex items-center", isSmall ? "space-x-2" : "space-x-3", className)}>
      <div
        className={cn(
          "rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 dark:from-indigo-600 dark:via-purple-600 dark:to-violet-700 border border-indigo-300/50 dark:border-purple-400/30 flex items-center justify-center shadow-lg shadow-indigo-500/30 dark:shadow-purple-900/40 hover:scale-110 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300",
          isSmall ? "h-8 w-8" : "h-10 w-10"
        )}
      >
        <Sparkles className={cn("text-white drop-shadow-sm", isSmall ? "h-5 w-5" : "h-6 w-6")} />
      </div>
      {showText && (
        <span
          className={cn(
            "font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 dark:from-indigo-300 dark:via-purple-300 dark:to-violet-200 bg-clip-text text-transparent tracking-tight",
            isSmall ? "text-lg" : "text-2xl"
          )}
        >
          PrepVerse
        </span>
      )}
    </div>
  )
}
