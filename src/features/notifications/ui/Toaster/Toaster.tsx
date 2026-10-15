import { useEffect, useRef, useState, type FocusEvent } from "react";
import { flushSync } from "react-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { exportData, undo } from "@/features/data/model/thunks";
import { listChanged } from "@/features/lists/model/viewSlice";
import { undoRemoval } from "@/features/tasks/model/thunks";
import { toggleId } from "@/features/tasks/ui/ids";
import { useRefraction } from "@/shared/hooks/useRefraction";
import { useI18n } from "@/shared/i18n/useI18n";
import { applyUpdate } from "@/shared/lib/serviceWorker";
import Icon from "@/shared/ui/Icon/Icon";
import type { IconName } from "@/shared/ui/Icon/icons";
import IconButton from "@/shared/ui/IconButton/IconButton";

import { formatMessage } from "../../model/format";
import { selectToast } from "../../model/selectors";
import { toastDismissed, type Toast, type ToastAction } from "../../model/toastSlice";

import styles from "./Toaster.module.scss";

export const TOAST_DURATION = 6000;

interface ToastCardProps {
  toast: Toast;
}

// One toast with its action, closing itself unless hovered or focused
const ToastCard = ({ toast }: ToastCardProps) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const persistent = toast.action?.type === "reload" || toast.action?.type === "export";
  const paused = hovered || focused || persistent;

  useRefraction(ref, { bezel: 20, scale: 36 });

  // Dismisses the toast after a while unless it is paused
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => dispatch(toastDismissed(toast.id)), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [dispatch, paused, toast.id]);

  // Runs the toast action: restore, undo, reload, export or show the task
  const run = (action: ToastAction) => {
    switch (action.type) {
      case "restore": {
        const [first] = action.tasks;
        flushSync(() => dispatch(undoRemoval()));
        if (first) document.getElementById(toggleId(first.task.id))?.focus();
        return;
      }
      case "undo":
        dispatch(undo());
        return;
      case "reload":
        applyUpdate();
        return;
      case "export":
        dispatch(exportData());
        return;
      case "show":
        flushSync(() => {
          dispatch(listChanged(action.list));
          dispatch(toastDismissed(toast.id));
        });
        document.getElementById(toggleId(action.taskId))?.focus();
    }
  };

  const actionButtons: Readonly<Record<ToastAction["type"], { icon: IconName; label: string }>> = {
    restore: { icon: "undo", label: t("toast.undo") },
    undo: { icon: "undo", label: t("toast.undo") },
    reload: { icon: "rotate", label: t("toast.reload") },
    export: { icon: "download", label: t("toast.export") },
    show: { icon: "arrowRight", label: t("toast.show") },
  };
  const action = toast.action;
  const button = action ? actionButtons[action.type] : null;

  // Resumes the timer once the focus leaves the toast
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
  };

  return (
    <div
      ref={ref}
      className={styles.toast}
      data-tone={toast.tone}
      data-glass-light=""
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
    >
      <div className={styles.body}>
        {toast.tone === "success" ? <Icon name="sparkles" className={styles.icon} /> : null}
        {toast.tone === "error" ? <Icon name="alert" className={styles.icon} /> : null}
        <p className={styles.message}>{formatMessage(t, toast.message)}</p>
      </div>
      <div className={styles.controls}>
        {action && button ? (
          <button type="button" className={styles.action} onClick={() => run(action)}>
            <Icon name={button.icon} />
            {button.label}
          </button>
        ) : null}
        <IconButton
          icon="xmark"
          label={t("toast.dismiss")}
          variant="ghost"
          size="small"
          onClick={() => dispatch(toastDismissed(toast.id))}
        />
      </div>
    </div>
  );
};

// The toast area and a live region for screen readers
const Toaster = () => {
  const toast = useAppSelector(selectToast);
  const { t } = useI18n();

  return (
    <>
      <output className="visually-hidden" aria-live="polite" aria-label={t("toast.region")}>
        {toast ? formatMessage(t, toast.message) : null}
      </output>
      <div className={styles.region}>{toast ? <ToastCard key={toast.id} toast={toast} /> : null}</div>
    </>
  );
};

export default Toaster;
