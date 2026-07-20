"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface PressureSliderProps {
  value: number;
  ariaValueText: string;
  rangeClassName: string;
  onValueChange: (value: number) => void;
}

export function PressureSlider({
  value,
  ariaValueText,
  rangeClassName,
  onValueChange,
}: PressureSliderProps) {
  const thumbAriaLabel = "Team pressure";
  const getThumbAriaValueText = () => ariaValueText;

  return (
    <SliderPrimitive.Root
      value={[value]}
      onValueChange={([nextValue]) => onValueChange(nextValue ?? 0)}
      min={0}
      max={100}
      step={1}
      className="relative flex min-h-11 w-full touch-none select-none items-center"
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range
          className={cn(
            "absolute h-full transition-colors duration-300 motion-reduce:transition-none",
            rangeClassName,
          )}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={thumbAriaLabel}
        aria-valuetext={getThumbAriaValueText()}
        className="block size-5 shrink-0 rounded-full border-2 border-background bg-foreground shadow-[0_0_0_1px_var(--color-ring)] outline-none transition-[box-shadow,transform] duration-200 hover:scale-105 focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-95 motion-reduce:transition-none"
      />
    </SliderPrimitive.Root>
  );
}
