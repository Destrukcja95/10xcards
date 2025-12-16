import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /** Enable auto-resize based on content */
  autoResize?: boolean;
}

function Textarea({ className, autoResize = false, ...props }: TextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInput = React.useCallback(() => {
    if (!autoResize || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [autoResize]);

  React.useEffect(() => {
    if (autoResize) {
      handleInput();
    }
  }, [autoResize, handleInput, props.value]);

  return (
    <textarea
      ref={textareaRef}
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        autoResize && "resize-none overflow-hidden",
        className
      )}
      onInput={handleInput}
      {...props}
    />
  )
}

export { Textarea }

