import { motion } from "motion/react";

interface Props {
  children: React.ReactNode;
  scrollProgress: number;
  visibleFrom: number;
  visibleTo: number;
}

export function AnimatedSection({
  children,
  scrollProgress,
  visibleFrom,
  visibleTo,
}: Props) {
  // Simple visibility check
  const isVisible =
    scrollProgress >= visibleFrom && scrollProgress <= visibleTo;

  return (
    <motion.div
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
      }}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      {children}
    </motion.div>
  );
}
