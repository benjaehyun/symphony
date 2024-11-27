import * as React from "react"
import { cn } from "../../utils/cn"

const Progress = React.forwardRef(({ className, value = 0, max = 100, ...props }, ref) => {
  // Ensure value is between 0 and max
  const percentage = Math.min(Math.max(0, value), max)
  const normalizedValue = (percentage / max) * 100

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={percentage}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full flex-1 transition-all",
          "bg-primary",
        )}
        style={{
          transform: `translateX(-${100 - normalizedValue}%)`,
        }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }