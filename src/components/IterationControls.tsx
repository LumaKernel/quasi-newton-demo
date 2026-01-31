import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './IterationControls.module.css';

interface IterationControlsProps {
  readonly currentIteration: number;
  readonly maxIteration: number;
  readonly isPlaying: boolean;
  readonly speed: number;
  readonly onIterationChange: (iteration: number) => void;
  readonly onPlayPause: () => void;
  readonly onReset: () => void;
  readonly onSpeedChange: (speed: number) => void;
}

export const IterationControls = ({
  currentIteration,
  maxIteration,
  isPlaying,
  speed,
  onIterationChange,
  onPlayPause,
  onReset,
  onSpeedChange,
}: IterationControlsProps) => {
  const { t } = useTranslation();

  const handlePrev = useCallback(() => {
    if (currentIteration > 0) {
      onIterationChange(currentIteration - 1);
    }
  }, [currentIteration, onIterationChange]);

  const handleNext = useCallback(() => {
    if (currentIteration < maxIteration) {
      onIterationChange(currentIteration + 1);
    }
  }, [currentIteration, maxIteration, onIterationChange]);

  return (
    <div className={styles.container}>
      <div className={styles.buttons}>
        <button
          className={styles.button}
          onClick={onReset}
          title={t('iteration.reset')}
        >
          ⏮
        </button>
        <button
          className={styles.button}
          onClick={handlePrev}
          disabled={currentIteration === 0}
          title={t('iteration.previous')}
        >
          ⏪
        </button>
        <button
          className={`${styles.button} ${styles.playButton}`}
          onClick={onPlayPause}
          title={isPlaying ? t('iteration.pause') : t('iteration.play')}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className={styles.button}
          onClick={handleNext}
          disabled={currentIteration >= maxIteration}
          title={t('iteration.next')}
        >
          ⏩
        </button>
      </div>

      <div className={styles.sliderContainer}>
        <label className={styles.sliderLabel}>
          {t('iteration.title', { current: currentIteration, max: maxIteration })}
        </label>
        <input
          type="range"
          className={styles.slider}
          min={0}
          max={maxIteration}
          value={currentIteration}
          onChange={(e) => onIterationChange(Number(e.target.value))}
        />
      </div>

      <div className={styles.speedContainer}>
        <label className={styles.speedLabel}>
          {t('iteration.speed', { speed })}
        </label>
        <input
          type="range"
          className={styles.speedSlider}
          min={0.5}
          max={5}
          step={0.5}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
};
