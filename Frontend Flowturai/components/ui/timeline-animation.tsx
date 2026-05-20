"use client";
import { motion } from "framer-motion";
import React from "react";

type Tag = "div" | "h1" | "h2" | "h3" | "p" | "span" | "section" | "ul" | "li";

interface TimelineContentProps {
  as?: Tag;
  children: React.ReactNode;
  className?: string;
  animationNum?: number;
  timelineRef?: React.RefObject<HTMLElement | null>;
  customVariants?: object;
}

const motionMap: Record<Tag, React.ElementType> = {
  div:     motion.div,
  h1:      motion.h1,
  h2:      motion.h2,
  h3:      motion.h3,
  p:       motion.p,
  span:    motion.span,
  section: motion.section,
  ul:      motion.ul,
  li:      motion.li,
};

const defaultVariants = {
  hidden:  { opacity: 0, y: -20, filter: "blur(8px)" },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { delay: i * 0.12, duration: 0.5 },
  }),
};

export function TimelineContent({
  as = "div",
  children,
  className,
  animationNum = 0,
  customVariants,
}: TimelineContentProps) {
  const Component = motionMap[as] ?? motion.div;

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={(customVariants as any) ?? defaultVariants}
      custom={animationNum}
    >
      {children}
    </Component>
  );
}
