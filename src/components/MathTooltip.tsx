import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import styles from './MathTooltip.module.css';

interface MathTooltipProps {
  readonly symbol: string;
  readonly name: string;
  readonly description: string;
  readonly formula?: string;
  readonly children: React.ReactNode;
  readonly onHover?: () => void;
  readonly onLeave?: () => void;
}

export const MathTooltip = ({
  symbol,
  name,
  description,
  formula,
  children,
  onHover,
  onLeave,
}: MathTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      // Calculate position - prefer above, center horizontally
      let left = rect.left + rect.width / 2;
      let top = rect.top - 8;

      // Adjust if too close to edges
      const tooltipWidth = 280;
      if (left - tooltipWidth / 2 < 10) {
        left = tooltipWidth / 2 + 10;
      } else if (left + tooltipWidth / 2 > viewportWidth - 10) {
        left = viewportWidth - tooltipWidth / 2 - 10;
      }

      setPosition({ top, left });
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    updatePosition();
    setIsVisible(true);
    onHover?.();
  }, [updatePosition, onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
    onLeave?.();
  }, [onLeave]);

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible, updatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        className={styles.trigger}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </span>
      {isVisible &&
        createPortal(
          <div
            className={styles.tooltip}
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            <div className={styles.header}>
              <span className={styles.symbol}>
                <InlineMath math={symbol} />
              </span>
              <span className={styles.name}>{name}</span>
            </div>
            <div className={styles.description}>{description}</div>
            {formula && (
              <div className={styles.formula}>
                <InlineMath math={formula} />
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};
