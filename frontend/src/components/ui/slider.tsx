"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
    "value" | "defaultValue" | "onValueChange"
  > {
  value?: number | number[]
  defaultValue?: number | number[]
  onValueChange?: (value: number | number[]) => void
  thumbClassName?: string
  thumbProps?: Omit<
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Thumb>,
    "className"
  >
}

function Slider({
  className,
  defaultValue,
  value,
  onValueChange,
  thumbClassName,
  thumbProps,
  min = 0,
  max = 100,
  ...props
}: SliderProps) {
  const normalizedValue = React.useMemo(
    () =>
      value !== undefined
        ? Array.isArray(value)
          ? value
          : [value]
        : undefined,
    [value]
  )

  const normalizedDefault = React.useMemo(
    () =>
      defaultValue !== undefined
        ? Array.isArray(defaultValue)
          ? defaultValue
          : [defaultValue]
        : undefined,
    [defaultValue]
  )

  const isSingleValue =
    value !== undefined
      ? !Array.isArray(value)
      : defaultValue !== undefined
        ? !Array.isArray(defaultValue)
        : true

  const handleValueChange = React.useCallback(
    (newValue: number[]) => {
      if (onValueChange) {
        onValueChange(isSingleValue ? newValue[0] : newValue)
      }
    },
    [onValueChange, isSingleValue]
  )

  const values = normalizedValue ?? normalizedDefault ?? [min]

  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      data-slot="slider"
      defaultValue={normalizedDefault}
      value={normalizedValue}
      onValueChange={handleValueChange}
      min={min}
      max={max}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1 w-full grow overflow-hidden rounded-full bg-muted"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-primary"
        />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50",
            thumbClassName
          )}
          {...thumbProps}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
export type { SliderProps }
