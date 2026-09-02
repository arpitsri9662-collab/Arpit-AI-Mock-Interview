import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean
  onToggle?: () => void
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, isCollapsed = false, onToggle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-64 flex-col border-r bg-background/50 backdrop-blur-sm transition-all duration-300",
          isCollapsed && "w-16",
          className
        )}
        {...props}
      >
        <div className={cn("flex h-16 items-center border-b px-4", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && <Logo size="sm" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 shrink-0"
          >
            <MenuIcon className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {children}
          </nav>
        </ScrollArea>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isActive?: boolean
    icon?: React.ReactNode
  }
>(({ className, isActive, icon, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start h-10 px-3 text-left font-normal",
        isActive && "bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100",
        className
      )}
      {...props}
    >
      {icon && <span className="mr-3 h-4 w-4">{icon}</span>}
      {children}
    </Button>
  )
})
SidebarItem.displayName = "SidebarItem"

export { Sidebar, SidebarItem }

// Simple icon component for the menu button
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  )
}
