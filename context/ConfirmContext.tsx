"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import styles from "@/styles/components/common/confirmDialog.module.css";

type ConfirmOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmState = ConfirmOptions & {
  message: string;
};

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((message, options) => {
    setState({ message, ...options });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleClose = (result: boolean) => {
    setState(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className={styles.overlay} role="presentation" onClick={() => handleClose(false)}>
          <div
            className={styles.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-label={state.title || "Confirm"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`${styles.iconWrap} ${state.danger ? styles.iconDanger : ""}`}>
              <FiAlertTriangle />
            </div>
            {state.title && <h3 className={styles.title}>{state.title}</h3>}
            <p className={styles.message}>{state.message}</p>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => handleClose(false)}
              >
                {state.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                className={`${styles.confirmBtn} ${state.danger ? styles.confirmDanger : ""}`}
                onClick={() => handleClose(true)}
                autoFocus
              >
                {state.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmProvider");
  return context;
};
