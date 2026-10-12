import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { cx } from "@/shared/lib/cx";

import styles from "./ContextMenu.module.scss";

export interface MenuPoint {
  x: number;
  y: number;
}

interface ContextMenuProps {
  menuRef: RefObject<HTMLDivElement | null>;
  point: MenuPoint;
  label: string;
  page?: string;
  touch?: boolean;
  onBack?: () => void;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

const MARGIN = 8;
const ITEM_SELECTOR = '[role="menuitem"]:not(:disabled), [role="menuitemradio"]:not(:disabled)';

// The menu items of a menu
const items = (menu: HTMLElement) => Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR));

const ARM_DELAY = 120;

// A menu at a point with keyboard navigation, closed outside or on Escape
const ContextMenu = ({
  menuRef,
  point,
  label,
  page = "",
  touch = false,
  onBack,
  onClose,
  className,
  children,
}: ContextMenuProps) => {
  const returnFocus = useRef<Element | null>(null);
  const armed = useRef(!touch);
  const handleClose = useEffectEvent(onClose);

  // Ignores the release of the press that opened the menu
  useEffect(() => {
    if (armed.current) return;
    let timer = 0;
    // Accepts clicks a moment after the opening press ends
    const arm = () => {
      timer = window.setTimeout(() => {
        armed.current = true;
      }, ARM_DELAY);
    };
    window.addEventListener("pointerup", arm, { once: true });
    window.addEventListener("pointercancel", arm, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerup", arm);
      window.removeEventListener("pointercancel", arm);
    };
  }, []);

  // Opens the menu inside the window and focuses its first item
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    returnFocus.current ??= document.activeElement;
    menu.dataset.page = page;
    menu.showPopover();

    const { width, height } = menu.getBoundingClientRect();
    const left = Math.max(MARGIN, Math.min(point.x, window.innerWidth - width - MARGIN));
    const below = point.y + height + MARGIN <= window.innerHeight;
    const top = below ? point.y : Math.max(MARGIN, point.y - height);
    menu.style.setProperty("--menu-x", `${left}px`);
    menu.style.setProperty("--menu-y", `${top}px`);
    menu.dataset.origin = below ? "top" : "bottom";
    (menu.querySelector<HTMLElement>("[data-autofocus]") ?? items(menu)[0])?.focus({ preventScroll: true });
  }, [menuRef, point, page]);

  // Returns the focus and reports when the menu closes
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    // Only the closing toggle matters
    const handleToggle = (event: Event) => {
      if (!("newState" in event) || event.newState !== "closed") return;
      const target = returnFocus.current;
      const focused = document.activeElement;
      if (target instanceof HTMLElement && (focused === document.body || menu.contains(focused))) {
        target.focus({ preventScroll: true });
      }
      handleClose();
    };
    menu.addEventListener("toggle", handleToggle);
    return () => menu.removeEventListener("toggle", handleToggle);
  }, [menuRef]);

  // Arrows, Home and End move; Left goes back; Tab closes
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" && onBack) {
      event.preventDefault();
      onBack();
      return;
    }
    const all = items(event.currentTarget);
    const current = all.findIndex((item) => item === document.activeElement);
    if (current === -1) return;
    if (event.key === "Tab") {
      event.preventDefault();
      event.currentTarget.hidePopover();
      return;
    }
    const targets: Record<string, number | undefined> = {
      ArrowDown: (current + 1) % all.length,
      ArrowUp: (current - 1 + all.length) % all.length,
      Home: 0,
      End: all.length - 1,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    all[next]?.focus();
  };

  return (
    <div
      ref={menuRef}
      popover="auto"
      role="menu"
      tabIndex={-1}
      aria-label={label}
      className={cx(styles.menu, className)}
      onKeyDown={handleKeyDown}
      onClickCapture={(event) => {
        if (armed.current) return;
        event.preventDefault();
        event.stopPropagation();
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export default ContextMenu;
