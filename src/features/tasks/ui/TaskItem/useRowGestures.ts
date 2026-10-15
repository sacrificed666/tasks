import { useEffect, useRef, type MouseEvent, type PointerEvent, type RefObject } from "react";

import { tap } from "@/shared/lib/haptics";
import type { MenuPoint } from "@/shared/ui/ContextMenu/ContextMenu";

const SWIPE_THRESHOLD = 88;
const SWIPE_LIMIT = 132;
const LONG_PRESS = 480;
const PRESS_TOLERANCE = 8;

interface Swipe {
  pointerId: number;
  startX: number;
  startY: number;
  offset: number;
  engaged: boolean;
  armed: boolean;
}

interface RowGestureOptions {
  itemRef: RefObject<HTMLLIElement | null>;
  titleRef: RefObject<HTMLButtonElement | null>;
  disabled: boolean;
  menuOpen: boolean;
  openMenu: (point: MenuPoint, touch?: boolean) => void;
  onComplete: () => void;
  onDelete: () => void;
}

// A swipe that slows down past its limit, like a rubber band
const resist = (distance: number) => {
  const magnitude = Math.abs(distance);
  const eased = magnitude <= SWIPE_LIMIT ? magnitude : SWIPE_LIMIT + (magnitude - SWIPE_LIMIT) * 0.25;
  return Math.sign(distance) * eased;
};

// The point under an element where its menu opens
export const anchorOf = (element: Element | null): MenuPoint => {
  if (!element) return { x: 0, y: 0 };
  const { left, bottom } = element.getBoundingClientRect();
  return { x: left, y: bottom + 6 };
};

// Swipes to check or delete, a long press or a right click for the menu
export const useRowGestures = ({
  itemRef,
  titleRef,
  disabled,
  menuOpen,
  openMenu,
  onComplete,
  onDelete,
}: RowGestureOptions) => {
  const pressTimer = useRef(0);
  const swipeRef = useRef<Swipe | null>(null);
  const suppressClick = useRef(false);

  // Drops a pending long press when the row goes away
  useEffect(() => () => clearTimeout(pressTimer.current), []);

  // Puts a swiped row back in place
  const resetSwipe = () => {
    const item = itemRef.current;
    if (!item) return;
    delete item.dataset.swipe;
    delete item.dataset.armed;
    item.style.removeProperty("--swipe");
  };

  // Cancels a pending long press
  const cancelPress = () => clearTimeout(pressTimer.current);

  // Starts a swipe or a long press on touch screens
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    if (event.pointerType !== "touch" || !event.isPrimary || disabled) return;
    if (event.target instanceof Element && event.target.closest("[data-swipe-ignore], [popover]")) return;
    const point = { x: event.clientX, y: event.clientY };
    clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => {
      if (swipeRef.current?.engaged) return;
      swipeRef.current = null;
      suppressClick.current = true;
      tap(12);
      openMenu(point, true);
    }, LONG_PRESS);
    swipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offset: 0,
      engaged: false,
      armed: false,
    };
  };

  // Follows the finger and arms an action past the threshold
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    const item = itemRef.current;
    if (!swipe || !item || swipe.pointerId !== event.pointerId) return;

    const dx = event.clientX - swipe.startX;
    const dy = event.clientY - swipe.startY;
    if (Math.hypot(dx, dy) > PRESS_TOLERANCE) cancelPress();

    if (!swipe.engaged) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        swipeRef.current = null;
        return;
      }
      if (Math.abs(dx) < 12) return;
      swipe.engaged = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    swipe.offset = resist(dx);
    const armed = Math.abs(swipe.offset) >= SWIPE_THRESHOLD;
    if (armed !== swipe.armed) {
      swipe.armed = armed;
      if (armed) tap(14);
    }

    item.dataset.swipe = swipe.offset > 0 ? "complete" : "delete";
    if (armed) item.dataset.armed = "";
    else delete item.dataset.armed;
    item.style.setProperty("--swipe", `${swipe.offset}px`);
  };

  // Runs the armed swipe action, or snaps back
  const onPointerUp = () => {
    cancelPress();
    const swipe = swipeRef.current;
    swipeRef.current = null;
    if (!swipe?.engaged) return;

    suppressClick.current = true;
    resetSwipe();
    if (swipe.offset >= SWIPE_THRESHOLD) onComplete();
    else if (swipe.offset <= -SWIPE_THRESHOLD) onDelete();
  };

  // Snaps back when the browser takes over the gesture
  const onPointerCancel = () => {
    cancelPress();
    swipeRef.current = null;
    resetSwipe();
  };

  // Opens our menu instead of the browser's
  const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("input, textarea, [popover]")) return;
    event.preventDefault();
    if (menuOpen) return;
    cancelPress();
    swipeRef.current = null;
    const fromKeyboard = event.clientX === 0 && event.clientY === 0;
    openMenu(fromKeyboard ? anchorOf(titleRef.current) : { x: event.clientX, y: event.clientY });
  };

  // Swallows the click that ends a swipe or a long press
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu, onClickCapture };
};
