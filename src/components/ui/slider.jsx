import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "../../utils/cn"

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20"
    >
      <SliderPrimitive.Range 
        className="absolute h-full bg-spotify-green" 
      />
    </SliderPrimitive.Track>
    {props.value?.map((_, index) => (
      <SliderPrimitive.Thumb
        key={index}
        className={cn(
          "block h-4 w-4 rounded-full border border-primary/50 bg-background",
          "ring-offset-background transition-colors focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "hover:bg-background-elevated hover:border-spotify-green",
          "active:scale-110"
        )}
      />
    ))}
  </SliderPrimitive.Root>
))
Slider.displayName = "Slider"

export { Slider }