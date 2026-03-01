import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { TextInputProps } from 'react-native';
import { FocusedInputOverlay } from './FocusedInputOverlay';

// ── Types ────────────────────────────────────────────────────────────

/** Props forwarded from the trigger input to the overlay clone. */
export interface FocusInputConfig {
  /** Label shown above the overlay input (optional). */
  label?: string;
  /** All relevant TextInput props to clone into the overlay. */
  inputProps: Pick<
    TextInputProps,
    | 'placeholder'
    | 'placeholderTextColor'
    | 'keyboardType'
    | 'autoCapitalize'
    | 'autoCorrect'
    | 'secureTextEntry'
    | 'textContentType'
    | 'returnKeyType'
    | 'maxLength'
    | 'multiline'
  >;
  /** Current value when the overlay opens – becomes the draft. */
  initialValue: string;
  /** Called with the committed value on "Done". */
  onCommit: (value: string) => void;
  /** Called when the user cancels (optional). */
  onCancel?: () => void;
  /** Called on submit editing inside the overlay (e.g. tag input "add" action). */
  onSubmitEditing?: () => void;
  /** Style overrides for the overlay input text. */
  inputStyle?: TextInputProps['style'];
}

export interface FocusInputContextValue {
  isOpen: boolean;
  open: (config: FocusInputConfig) => void;
  close: (commit?: boolean) => void;
  config: FocusInputConfig | null;
  draftValue: string;
  setDraftValue: (v: string) => void;
}

// ── Context ──────────────────────────────────────────────────────────

const FocusInputContext = createContext<FocusInputContextValue | null>(null);

export function useFocusInput(): FocusInputContextValue {
  const ctx = useContext(FocusInputContext);
  if (!ctx) throw new Error('useFocusInput must be used within <FocusInputProvider>');
  return ctx;
}

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
