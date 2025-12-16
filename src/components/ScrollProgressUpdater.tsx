import { useFrame } from "@react-three/fiber";

interface ScrollProgressUpdaterProps {
  scrollState: {
    progress: number;
  };
  progressRef: React.RefObject<number>;
  onProgressChange: (progress: number) => void;
}

export function ScrollProgressUpdater({
  scrollState,
  progressRef,
  onProgressChange,
}: ScrollProgressUpdaterProps) {
  useFrame(() => {
    const progress = scrollState.progress;
    progressRef.current = progress;
    onProgressChange(progress);
  });
  return null;
}
