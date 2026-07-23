"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: "words" | "letters";
  direction?: "top" | "bottom";
}

export const BlurText = ({
  text,
  delay = 0,
  className,
  animateBy = "words",
  direction = "bottom",
}: BlurTextProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  
  const defaultVariants = {
    hidden: { 
      opacity: 0, 
      filter: "blur(12px)",
      y: direction === "top" ? -20 : 20
    },
    visible: { 
      opacity: 1, 
      filter: "blur(0px)",
      y: 0
    }
  };

  return (
    <p ref={ref} className={cn("inline-block flex-wrap", className)}>
      {elements.map((el, i) => (
        <motion.span
          key={i}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={defaultVariants}
          transition={{
            duration: 1.2,
            ease: "easeOut" as const,
            delay: delay + i * (animateBy === "words" ? 0.08 : 0.02)
          }}
          className="inline-block"
        >
          {el === " " ? "\u00A0" : el}
          {animateBy === "words" && i < elements.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </p>
  );
};
