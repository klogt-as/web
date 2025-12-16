import { motion } from "motion/react";

interface AnimatedHeroSectionProps {
  children: React.ReactNode;
  scrollProgress: number;
  visibleFrom: number;
  visibleTo: number;
}

export function AnimatedHeroSection({
  children,
  scrollProgress,
  visibleFrom,
  visibleTo,
}: AnimatedHeroSectionProps) {
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
