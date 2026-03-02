import React, { useCallback, useRef, useState } from 'react';
import { FocusedInputOverlay } from './FocusedInputOverlay';
import {
  FocusInputContext,
  type FocusInputConfig,
  type FocusInputContextValue,
} from './FocusInputStore';

export { useFocusInput } from './FocusInputStore';
export type { FocusInputConfig, FocusInputContextValue } from './FocusInputStore';

// ── Provider ─────────────────────────────────────────────────────────

export function FocusInputProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState('');
  const configRef = useRef<FocusInputConfig | null>(null);
  const [config, setConfig] = useState<FocusInputConfig | null>(null);

  const open = useCallback((cfg: FocusInputConfig) => {
    // If already open, commit previous value first
    if (configRef.current) {
      configRef.current.onCommit(draftValue);
    }
    configRef.current = cfg;
    setConfig(cfg);
    setDraftValue(cfg.initialValue);
    setIsOpen(true);
  }, [draftValue]);

  const close = useCallback((commit = true) => {
    if (configRef.current) {
      if (commit) {
        configRef.current.onCommit(draftValue);
      } else {
        configRef.current.onCancel?.();
      }
    }
    configRef.current = null;
    setConfig(null);
    setIsOpen(false);
    setDraftValue('');
  }, [draftValue]);

  const value: FocusInputContextValue = {
    isOpen,
    open,
    close,
    config,
    draftValue,
    setDraftValue,
  };

  return (
    <FocusInputContext.Provider value={value}>
      {children}
      <FocusedInputOverlay />
    </FocusInputContext.Provider>
  );
}
