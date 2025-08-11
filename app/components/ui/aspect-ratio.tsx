"use client"

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"
import * as React from "react"

import { cn } from "@/app/lib/utils"

const AspectRatio = React.forwardRef(
  ({ className, ...props }: React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>, ref: React.Ref<HTMLDivElement>) => (
    <AspectRatioPrimitive.Root
      ref={ref}
      className={cn("overflow-hidden", className)}
      {...props}
    />
  )
);
AspectRatio.displayName = AspectRatioPrimitive.Root.displayName

export { AspectRatio }
