const openPopovers = new WeakSet<HTMLElement>();

// Fires a popover toggle event
const dispatchToggle = (element: HTMLElement, type: "beforetoggle" | "toggle", newState: "open" | "closed") => {
  const event = Object.assign(new Event(type, { cancelable: type === "beforetoggle" }), {
    newState,
    oldState: newState === "open" ? "closed" : "open",
  });
  element.dispatchEvent(event);
};

// Opens a popover with its toggle events
const show = (element: HTMLElement) => {
  if (openPopovers.has(element)) return;
  dispatchToggle(element, "beforetoggle", "open");
  element.style.display = "block";
  openPopovers.add(element);
  dispatchToggle(element, "toggle", "open");
};

// Closes a popover with its toggle events
const hide = (element: HTMLElement) => {
  if (!openPopovers.has(element)) return;
  dispatchToggle(element, "beforetoggle", "closed");
  element.style.removeProperty("display");
  openPopovers.delete(element);
  dispatchToggle(element, "toggle", "closed");
};

// Adds the popover methods jsdom lacks
export const installPopoverPolyfill = () => {
  if ("showPopover" in HTMLElement.prototype) return;

  Object.defineProperties(HTMLElement.prototype, {
    showPopover: {
      configurable: true,
      value(this: HTMLElement) {
        show(this);
      },
    },
    hidePopover: {
      configurable: true,
      value(this: HTMLElement) {
        hide(this);
      },
    },
    togglePopover: {
      configurable: true,
      value(this: HTMLElement) {
        if (openPopovers.has(this)) hide(this);
        else show(this);
        return openPopovers.has(this);
      },
    },
  });

  document.addEventListener("click", (event) => {
    const invoker = event.target instanceof Element ? event.target.closest("[popovertarget]") : null;
    const id = invoker?.getAttribute("popovertarget");
    const popover = id ? document.getElementById(id) : null;
    if (popover) popover.togglePopover();
  });
};
