"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import { Badge } from "../primitives/badge";
import { Card } from "../primitives/card";
import { cn } from "@onvero/lib/utils";
import { motion } from "framer-motion";
import { BookOpen, Clock } from "lucide-react";

interface GlassBlogCardProps {
  title?: string;
  excerpt?: string;
  image?: string;
  author?: {
    name: string;
    avatar?: string;
  };
  date?: string;
  readTime?: string;
  tags?: string[];
  className?: string;
  href?: string;
  hoverLabel?: string;
}

export function GlassBlogCard({
  title = "The Future of UI Design",
  excerpt = "Exploring the latest trends in glassmorphism, 3D elements, and micro-interactions.",
  image = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
  author = { name: "Onvero", avatar: "" },
  date = "",
  readTime = "5 min",
  tags = [],
  className,
  href,
  hoverLabel = 'Artikel lesen',
}: GlassBlogCardProps) {
  const card = (
      <Card className="group relative h-full overflow-hidden rounded-2xl border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:shadow-xl hover:shadow-black/30">
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

          {tags.length > 0 && (
            <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
              {tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="bg-black/40 backdrop-blur-sm text-white border-white/15">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black shadow-lg"
            >
              <BookOpen className="h-4 w-4" />
              {hoverLabel}
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 p-5">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold leading-tight tracking-tight text-white transition-colors group-hover:text-white/80">
              {title}
            </h3>
            {excerpt && (
              <p className="line-clamp-2 text-sm text-white/50">
                {excerpt}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/8 pt-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 border border-white/15">
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback className="bg-white/10 text-white text-xs">
                  {author.name?.[0] ?? "O"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-xs">
                <span className="font-medium text-white">{author.name}</span>
                {date && <span className="text-white/40">{date}</span>}
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-white/40">
              <Clock className="h-3 w-3" />
              <span>{readTime}</span>
            </div>
          </div>
        </div>
      </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("w-full", className)}
    >
      {href ? <Link href={href}>{card}</Link> : card}
    </motion.div>
  );
}
