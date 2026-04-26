import * as React from "react";
import { Textarea } from "../primitives/textarea";
import { cn } from "@onvero/lib/utils";

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  ({ className, ...props }, ref) => (
    <Textarea
      autoComplete="off"
      ref={ref}
      name="message"
      className={cn(
        "max-h-12 px-4 py-3 bg-transparent text-sm placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-md flex items-center h-16 resize-none border-0 text-white",
        className,
      )}
      {...props}
    />
  ),
);
ChatInput.displayName = "ChatInput";

export { ChatInput };
