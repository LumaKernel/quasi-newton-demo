import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAnimationOptions {
  readonly maxIteration: number;
  readonly initialSpeed?: number;
}

export const useAnimation = ({ maxIteration, initialSpeed = 1 }: UseAnimationOptions) => {
  const [currentIteration, setCurrentIteration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const play = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const reset = useCallback(() => {
    setCurrentIteration(0);
    setIsPlaying(false);
  }, []);

  const goToIteration = useCallback((iteration: number) => {
    setCurrentIteration(Math.max(0, Math.min(iteration, maxIteration)));
  }, [maxIteration]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }

      const deltaTime = time - lastTimeRef.current;
      const interval = 500 / speed; // Base interval of 500ms, adjusted by speed

      if (deltaTime >= interval) {
        setCurrentIteration((prev) => {
          if (prev >= maxIteration) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
        lastTimeRef.current = time;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, maxIteration]);

  // Reset iteration when maxIteration changes
  useEffect(() => {
    setCurrentIteration((prev) => Math.min(prev, maxIteration));
  }, [maxIteration]);

  return {
    currentIteration,
    isPlaying,
    speed,
    play,
    pause,
    togglePlayPause,
    reset,
    goToIteration,
    setSpeed,
  };
};
