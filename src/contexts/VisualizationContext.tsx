import { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type OverlayType =
  | 'gradient'
  | 'direction'
  | 'nextPoint'
  | 'trustRegion'
  | 'hessianEigenvectors'
  | 'quadraticModel';

export interface OverlayData {
  readonly type: OverlayType;
  readonly algorithmId: string;
  readonly currentPoint: readonly [number, number];
  readonly gradient?: readonly [number, number];
  readonly direction?: readonly [number, number];
  readonly nextPoint?: readonly [number, number];
  readonly trustRegionRadius?: number;
  readonly fx?: number;
  readonly hessian?: readonly (readonly number[])[];
  /** Approximate inverse Hessian B_k for quasi-Newton methods */
  readonly hessianApprox?: readonly (readonly number[])[];
  readonly hessianEigenvectors?: {
    readonly v1: readonly [number, number];
    readonly v2: readonly [number, number];
    readonly lambda1: number;
    readonly lambda2: number;
  };
}

interface VisualizationContextValue {
  readonly activeOverlay: OverlayData | null;
  readonly isPinned: boolean;
  readonly showOverlay: (overlay: OverlayData) => void;
  readonly hideOverlay: () => void;
  readonly togglePin: (overlay: OverlayData) => void;
}

const VisualizationContext = createContext<VisualizationContextValue | null>(null);

export const VisualizationProvider = ({ children }: { readonly children: React.ReactNode }) => {
  const [activeOverlay, setActiveOverlay] = useState<OverlayData | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  const showOverlay = useCallback((overlay: OverlayData) => {
    if (!isPinned) {
      setActiveOverlay(overlay);
    }
  }, [isPinned]);

  const hideOverlay = useCallback(() => {
    if (!isPinned) {
      setActiveOverlay(null);
    }
  }, [isPinned]);

  const togglePin = useCallback((overlay: OverlayData) => {
    if (isPinned && activeOverlay?.type === overlay.type && activeOverlay?.algorithmId === overlay.algorithmId) {
      // Unpin if clicking the same overlay
      setIsPinned(false);
      setActiveOverlay(null);
    } else {
      // Pin this overlay
      setActiveOverlay(overlay);
      setIsPinned(true);
    }
  }, [isPinned, activeOverlay]);

  const value = useMemo(
    () => ({
      activeOverlay,
      isPinned,
      showOverlay,
      hideOverlay,
      togglePin,
    }),
    [activeOverlay, isPinned, showOverlay, hideOverlay, togglePin],
  );

  return (
    <VisualizationContext.Provider value={value}>{children}</VisualizationContext.Provider>
  );
};

export const useVisualization = () => {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error('useVisualization must be used within a VisualizationProvider');
  }
  return context;
};
