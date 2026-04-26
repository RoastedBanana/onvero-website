"use client";

import * as React from "react";
import { cn } from "@onvero/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import { Button } from "../primitives/button";
import { MessageLoading } from "../chat/message-loading";

interface ChatBubbleProps {
  variant?: "sent" | "received";
  layout?: "default" | "ai";
  className?: string;
  children: React.ReactNode;
}

export function ChatBubble({
  variant = "received",
  layout = "default",
  className,
  children,
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 mb-4",
        variant === "sent" && "flex-row-reverse",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ChatBubbleMessageProps {
  variant?: "sent" | "received";
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ChatBubbleMessage({
  variant = "received",
  isLoading,
  className,
  children,
}: ChatBubbleMessageProps) {
  return (
    <div
      className={cn("rounded-xl p-3 text-sm max-w-[80%]", className)}
      style={
        variant === "sent"
          ? { backgroundColor: "#ffffff", color: "#000000" }
          : {
              backgroundColor: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.08)",
            }
      }
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <MessageLoading />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

export function ChatBubbleAvatar({
  src,
  fallback = "AI",
  className,
}: ChatBubbleAvatarProps) {
  return (
    <Avatar
      className={cn("h-8 w-8", className)}
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {src && <AvatarImage src={src} />}
      <AvatarFallback
        className="text-xs font-semibold"
        style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
      >
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}

interface ChatBubbleActionProps {
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ChatBubbleAction({ icon, onClick, className }: ChatBubbleActionProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6", className)}
      onClick={onClick}
    >
      {icon}
    </Button>
  );
}
