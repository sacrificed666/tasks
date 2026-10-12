import { useEffect, useEffectEvent } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectProjects } from "@/features/projects/model/selectors";
import { tap } from "@/shared/lib/haptics";
import { prefersReducedMotion } from "@/shared/lib/motion";

import { LISTS, projectView, type ViewId } from "./lists";
import { selectDetailsId, selectList, selectOverlay, selectSearching } from "./selectors";
import { listChanged } from "./viewSlice";

const ENGAGE = 24;
const COMMIT = 64;
const FOLLOW = 0.3;

interface Gesture {
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  engaged: boolean;
}

// Whether a gesture that starts here belongs to the element under the finger
const ownsGesture = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return true;
  if (target.closest("[data-own-swipe], [popover], dialog")) return true;
  // A field keeps its touches only while it is being edited
  const field = target.closest("input, textarea, select, [contenteditable]");
  if (field && field === document.activeElement) return true;
  for (let node: Element | null = target; node; node = node.parentElement) {
    const scrollsSideways = /auto|scroll/.test(getComputedStyle(node).overflowX);
    if (scrollsSideways && node.scrollWidth > node.clientWidth) return true;
  }
  return false;
};

// The page next to the current one in the order of the sidebar, if there is one
const neighbourView = (views: readonly ViewId[], current: ViewId, step: 1 | -1) => {
  const index = views.indexOf(current);
  return index === -1 ? undefined : views[index + step];
};

// A sideways swipe on phones turns to the next or the previous list
export const useSwipeNavigation = (enabled: boolean, surfaceId: string) => {
  const dispatch = useAppDispatch();
  const list = useAppSelector(selectList);
  const projects = useAppSelector(selectProjects);
  const busy = useAppSelector(
    (state) => selectOverlay(state) !== null || selectDetailsId(state) !== null || selectSearching(state),
  );

  // Opens the neighbouring list and lets it slide in from the side of the swipe
  const turn = useEffectEvent((step: 1 | -1) => {
    const views = [...LISTS, ...projects.map((project) => projectView(project.id))];
    const next = neighbourView(views, list, step);
    if (!next) return;
    tap();
    dispatch(listChanged(next));
    const surface = document.getElementById(surfaceId);
    if (!surface || prefersReducedMotion()) return;
    // A reflow in between restarts the slide when two swipes go the same way
    delete surface.dataset.pageEnter;
    void surface.offsetWidth;
    surface.dataset.pageEnter = step > 0 ? "next" : "previous";
  });

  // Follows touches on the whole page while no sheet, dialog or search is open
  useEffect(() => {
    if (!enabled || busy) return;
    let gesture: Gesture | null = null;
    let swallowClick = false;
    // The element that takes the swipes
    const surface = () => document.getElementById(surfaceId);

    // Lets the page settle back under the finger's start
    const release = () => {
      const element = surface();
      if (!element) return;
      delete element.dataset.pageSwiping;
      element.style.removeProperty("--page-swipe");
    };

    // Starts tracking a touch that no row or field claims
    const handleDown = (event: PointerEvent) => {
      swallowClick = false;
      if (event.pointerType !== "touch" || !event.isPrimary || ownsGesture(event.target)) return;
      gesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, engaged: false };
    };

    // Engages on a clearly sideways move and lets the page follow a little
    const handleMove = (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const dx = event.clientX - gesture.startX;
      const dy = event.clientY - gesture.startY;
      if (!gesture.engaged) {
        if (Math.abs(dy) > ENGAGE / 2 && Math.abs(dy) > Math.abs(dx)) {
          gesture = null;
          return;
        }
        if (Math.abs(dx) < ENGAGE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        gesture.engaged = true;
      }
      gesture.dx = dx;
      const element = surface();
      if (!element) return;
      element.dataset.pageSwiping = "";
      element.style.setProperty("--page-swipe", `${(dx * FOLLOW).toFixed(1)}px`);
    };

    // Turns the page when the swipe went far enough
    const handleUp = (event: PointerEvent) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const { dx, engaged } = gesture;
      gesture = null;
      release();
      if (!engaged) return;
      swallowClick = true;
      if (Math.abs(dx) >= COMMIT) turn(dx < 0 ? 1 : -1);
    };

    // Drops the gesture when the browser takes it over
    const handleCancel = () => {
      gesture = null;
      release();
    };

    // The click that ends a swipe must not press the button under the finger
    const handleClick = (event: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("pointerdown", handleDown);
    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleCancel);
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("pointerdown", handleDown);
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleCancel);
      document.removeEventListener("click", handleClick, true);
      release();
    };
  }, [enabled, busy, surfaceId]);

  // Clears the slide once the new list has arrived
  useEffect(() => {
    const surface = document.getElementById(surfaceId);
    if (!surface) return;
    // Only the surface's own animation counts, not those of the rows inside
    const handleEnd = (event: AnimationEvent) => {
      if (event.target === surface) delete surface.dataset.pageEnter;
    };
    surface.addEventListener("animationend", handleEnd);
    return () => surface.removeEventListener("animationend", handleEnd);
  }, [surfaceId]);
};
