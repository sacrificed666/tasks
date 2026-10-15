import { useEffect, useEffectEvent, useLayoutEffect, useRef, type ReactNode } from "react";

import { useRefraction } from "@/shared/hooks/useRefraction";
import { cx } from "@/shared/lib/cx";

import styles from "./Dialog.module.scss";

interface DialogProps {
  open: boolean;
  label: string;
  onClose: () => void;
  placement?: "center" | "top";
  className?: string;
  header?: ReactNode;
  children: ReactNode;
}

// A native modal dialog that closes on the backdrop and reports every close
const Dialog = ({ open, label, onClose, placement = "center", className, header, children }: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const handleClose = useEffectEvent(onClose);

  useRefraction(ref, { bezel: 24, scale: 40 });

  // Opens or closes the native dialog with the open prop
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Reports closing by Escape, the backdrop or the close method
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // A click on the dialog itself is a click on its backdrop
    const closeOnBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) handleClose();
    };
    // Reports a dialog closed by Escape or the close method
    const close = () => handleClose();
    dialog.addEventListener("click", closeOnBackdrop);
    dialog.addEventListener("close", close);
    return () => {
      dialog.removeEventListener("click", closeOnBackdrop);
      dialog.removeEventListener("close", close);
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      closedby="any"
      className={cx(styles.dialog, className)}
      data-placement={placement}
    >
      {open ? (
        <>
          {header}
          <div className={styles.body}>{children}</div>
        </>
      ) : null}
    </dialog>
  );
};

export default Dialog;
