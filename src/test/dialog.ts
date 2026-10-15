const FOCUSABLE = "[autofocus], input, textarea, select, button, a[href], [tabindex]:not([tabindex='-1'])";

const modals: HTMLDialogElement[] = [];
const returnFocus = new WeakMap<HTMLDialogElement, Element | null>();

// Opens a dialog without making it modal
function show(this: HTMLDialogElement) {
  this.setAttribute("open", "");
}

// Opens a modal dialog and focuses its first field
function showModal(this: HTMLDialogElement) {
  if (this.hasAttribute("open")) throw new DOMException("The dialog is already open.", "InvalidStateError");
  returnFocus.set(this, document.activeElement);
  this.setAttribute("open", "");
  modals.push(this);
  this.querySelector<HTMLElement>(FOCUSABLE)?.focus();
}

// Closes a dialog and returns the focus
function close(this: HTMLDialogElement) {
  if (!this.hasAttribute("open")) return;
  this.removeAttribute("open");
  modals.splice(modals.indexOf(this), 1);
  const previous = returnFocus.get(this);
  if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
  this.dispatchEvent(new Event("close"));
}

// Adds the dialog methods jsdom lacks
export const installDialogPolyfill = () => {
  const prototype = HTMLDialogElement.prototype;
  if ("showModal" in prototype) return;

  Object.defineProperties(prototype, {
    open: {
      configurable: true,
      get(this: HTMLDialogElement) {
        return this.hasAttribute("open");
      },
    },
    show: { configurable: true, value: show },
    showModal: { configurable: true, value: showModal },
    close: { configurable: true, value: close },
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    modals.at(-1)?.close();
  });
};
