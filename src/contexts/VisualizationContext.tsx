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

interface PinnedConfig {
  readonly type: OverlayType;
  readonly algorithmId: string;
}

interface VisualizationContextValue {
  readonly activeOverlay: OverlayData | null;
  readonly pinnedConfig: PinnedConfig | null;
  readonly showOverlay: (overlay: OverlayData) => void;
  readonly hideOverlay: (algorithmId: string) => void;
  readonly togglePin: (overlay: OverlayData) => void;
  readonly updatePinnedOverlay: (overlay: OverlayData) => void;
}

const VisualizationContext = createContext<VisualizationContextValue | null>(null);

export const VisualizationProvider = ({ children }: { readonly children: React.ReactNode }) => {
  const [activeOverlay, setActiveOverlay] = useState<OverlayData | null>(null);
  const [pinnedConfig, setPinnedConfig] = useState<PinnedConfig | null>(null);

  const showOverlay = useCallback((overlay: OverlayData) => {
    // Only show if not pinned, or if this is the pinned algorithm updating its data
    if (!pinnedConfig) {
      setActiveOverlay(overlay);
    }
  }, [pinnedConfig]);

  const hideOverlay = useCallback((algorithmId: string) => {
    // Only hide if not pinned for this algorithm
    if (!pinnedConfig || pinnedConfig.algorithmId !== algorithmId) {
      setActiveOverlay((prev) => (prev?.algorithmId === algorithmId ? null : prev));
    }
  }, [pinnedConfig]);

  const togglePin = useCallback((overlay: OverlayData) => {
    if (pinnedConfig?.type === overlay.type && pinnedConfig?.algorithmId === overlay.algorithmId) {
      // Unpin if clicking the same overlay
      setPinnedConfig(null);
      setActiveOverlay(null);
    } else {
      // Pin this overlay
      setPinnedConfig({ type: overlay.type, algorithmId: overlay.algorithmId });
      setActiveOverlay(overlay);
    }
  }, [pinnedConfig]);

  // Called by StepDetails to update the pinned overlay data when iteration changes
  const updatePinnedOverlay = useCallback((overlay: OverlayData) => {
    if (pinnedConfig?.type === overlay.type && pinnedConfig?.algorithmId === overlay.algorithmId) {
      setActiveOverlay(overlay);
    }
  }, [pinnedConfig]);

  const value = useMemo(
    () => ({
      activeOverlay,
      pinnedConfig,
      showOverlay,
      hideOverlay,
      togglePin,
      updatePinnedOverlay,
    }),
    [activeOverlay, pinnedConfig, showOverlay, hideOverlay, togglePin, updatePinnedOverlay],
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
