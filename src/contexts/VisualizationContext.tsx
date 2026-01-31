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
  readonly hessianApprox?: readonly (readonly number[])[];
  readonly hessianEigenvectors?: {
    readonly v1: readonly [number, number];
    readonly v2: readonly [number, number];
    readonly lambda1: number;
    readonly lambda2: number;
  };
}

export interface OverlayConfig {
  readonly type: OverlayType;
  readonly algorithmId: string;
}

interface VisualizationContextValue {
  /** Pinned overlay config (only type + algorithmId) */
  readonly pinnedConfig: OverlayConfig | null;
  /** Hover overlay (full data, for immediate display) */
  readonly hoverOverlay: OverlayData | null;
  readonly showHover: (overlay: OverlayData) => void;
  readonly hideHover: (algorithmId: string) => void;
  readonly togglePin: (config: OverlayConfig) => void;
  readonly isPinnedFor: (algorithmId: string, type: OverlayType) => boolean;
}

const VisualizationContext = createContext<VisualizationContextValue | null>(null);

export const VisualizationProvider = ({ children }: { readonly children: React.ReactNode }) => {
  const [pinnedConfig, setPinnedConfig] = useState<OverlayConfig | null>(null);
  const [hoverOverlay, setHoverOverlay] = useState<OverlayData | null>(null);

  const showHover = useCallback((overlay: OverlayData) => {
    // Don't update hover if pinned for a different overlay
    if (!pinnedConfig) {
      setHoverOverlay(overlay);
    }
  }, [pinnedConfig]);

  const hideHover = useCallback((algorithmId: string) => {
    if (!pinnedConfig) {
      setHoverOverlay((prev) => (prev?.algorithmId === algorithmId ? null : prev));
    }
  }, [pinnedConfig]);

  const togglePin = useCallback((config: OverlayConfig) => {
    setPinnedConfig((prev) => {
      if (prev?.type === config.type && prev?.algorithmId === config.algorithmId) {
        return null; // Unpin
      }
      return config; // Pin
    });
    setHoverOverlay(null);
  }, []);

  const isPinnedFor = useCallback((algorithmId: string, type: OverlayType) => {
    return pinnedConfig?.algorithmId === algorithmId && pinnedConfig?.type === type;
  }, [pinnedConfig]);

  const value = useMemo(
    () => ({
      pinnedConfig,
      hoverOverlay,
      showHover,
      hideHover,
      togglePin,
      isPinnedFor,
    }),
    [pinnedConfig, hoverOverlay, showHover, hideHover, togglePin, isPinnedFor],
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
