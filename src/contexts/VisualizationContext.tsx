import { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type OverlayType =
  | 'gradient'
  | 'direction'
  | 'nextPoint'
  | 'trustRegion'
  | 'hessianEigenvectors';

export interface OverlayData {
  readonly type: OverlayType;
  readonly algorithmId: string;
  readonly currentPoint: readonly [number, number];
  readonly gradient?: readonly [number, number];
  readonly direction?: readonly [number, number];
  readonly nextPoint?: readonly [number, number];
  readonly trustRegionRadius?: number;
  readonly hessianEigenvectors?: {
    readonly v1: readonly [number, number];
    readonly v2: readonly [number, number];
    readonly lambda1: number;
    readonly lambda2: number;
  };
}

interface VisualizationContextValue {
  readonly activeOverlay: OverlayData | null;
  readonly setActiveOverlay: (overlay: OverlayData | null) => void;
  readonly showOverlay: (overlay: OverlayData) => void;
  readonly hideOverlay: () => void;
}

const VisualizationContext = createContext<VisualizationContextValue | null>(null);

export const VisualizationProvider = ({ children }: { readonly children: React.ReactNode }) => {
  const [activeOverlay, setActiveOverlay] = useState<OverlayData | null>(null);

  const showOverlay = useCallback((overlay: OverlayData) => {
    setActiveOverlay(overlay);
  }, []);

  const hideOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  const value = useMemo(
    () => ({
      activeOverlay,
      setActiveOverlay,
      showOverlay,
      hideOverlay,
    }),
    [activeOverlay, showOverlay, hideOverlay],
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
