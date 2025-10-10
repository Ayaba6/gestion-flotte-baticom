import * as React from "react";
import { cn } from "../../lib/utils.js";

export const Label = React.forwardRef(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium text-gray-700 mb-1 block",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";
