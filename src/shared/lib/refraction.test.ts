import { afterEach, describe, expect, it, vi } from "vitest";

import { attachRefraction, createDisplacementMap, displacementAt, isRefractionSupported } from "./refraction";

const getContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "getContext");

// Replaces the 2D context of every canvas
const stubContext = (context: unknown) => {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: () => context });
};

// A 2D canvas that records the painted pixels and returns a fixed image
const stubCanvas = () => {
  const painted: Uint8ClampedArray[] = [];
  stubContext({
    createImageData: (width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
    putImageData: (image: { data: Uint8ClampedArray }) => painted.push(image.data),
  });
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,map");
  return painted;
};

afterEach(() => {
  if (getContext) Object.defineProperty(HTMLCanvasElement.prototype, "getContext", getContext);
});

// A resize observer that reports a change when the test asks for it
const stubResizeObserver = () => {
  const callbacks: (() => void)[] = [];
  vi.stubGlobal(
    "ResizeObserver",
    class {
      readonly callback: () => void;
      constructor(callback: () => void) {
        this.callback = callback;
        callbacks.push(callback);
      }
      observe() {}
      disconnect() {}
    },
  );
  return () => {
    for (const callback of callbacks) callback();
  };
};

// Resolves after the next animation frame
const nextFrame = () =>
  new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });

describe("displacementAt", () => {
  const size = [200, 60, 30, 20] as const;

  it("keeps the center of the surface undistorted", () => {
    expect(displacementAt(100, 30, ...size)).toEqual([128, 128]);
  });

  it("pulls samples inward along each edge", () => {
    const [leftRed, leftGreen] = displacementAt(80, 0, ...size);
    const [rightRed] = displacementAt(199, 30, ...size);
    const [, bottomGreen] = displacementAt(100, 59, ...size);

    expect(leftGreen).toBeGreaterThan(200);
    expect(leftRed).toBe(128);
    expect(rightRed).toBeLessThan(60);
    expect(bottomGreen).toBeLessThan(60);
  });

  it("bends diagonally in rounded corners", () => {
    const [red, green] = displacementAt(4, 4, ...size);
    expect(red).toBeGreaterThan(128);
    expect(green).toBeGreaterThan(128);
  });
});

describe("createDisplacementMap", () => {
  it("needs a 2D canvas", () => {
    stubContext(null);
    expect(createDisplacementMap(4, 4, 2, 2)).toBeNull();
  });

  it("paints the displacement of every pixel", () => {
    const painted = stubCanvas();
    expect(createDisplacementMap(4, 4, 2, 2)).toBe("data:image/png;base64,map");
    expect(painted[0]?.slice(0, 4)).toEqual(new Uint8ClampedArray([...displacementAt(0, 0, 4, 4, 2, 2), 128, 255]));
  });
});

describe("attachRefraction", () => {
  it("gives the element a filter that follows its size and removes it again", async () => {
    stubCanvas();
    const resize = stubResizeObserver();
    const element = document.createElement("div");
    Object.defineProperties(element, { offsetWidth: { value: 40 }, offsetHeight: { value: 20 } });
    document.body.append(element);

    const detach = attachRefraction(element, { bezel: 6 });
    resize();
    await nextFrame();
    const reference = element.style.getPropertyValue("--glass-refraction");
    const id = /url\(#(?<id>[\w-]+)\)/u.exec(reference)?.groups?.id ?? "";
    const filter = document.getElementById(id);
    expect(filter).toHaveAttribute("width", "40");
    expect(filter?.querySelector("feImage")).toHaveAttribute("href", "data:image/png;base64,map");

    detach();
    expect(element.style.getPropertyValue("--glass-refraction")).toBe("");
    expect(document.getElementById(id)).toBeNull();
    element.remove();
  });

  it("waits until the element has a size", async () => {
    stubCanvas();
    const resize = stubResizeObserver();
    const element = document.createElement("div");
    const detach = attachRefraction(element);
    resize();
    await nextFrame();
    expect(element.style.getPropertyValue("--glass-refraction")).toBe("");
    detach();
  });
});

describe("isRefractionSupported", () => {
  it("is disabled outside Chromium", () => {
    expect(isRefractionSupported()).toBe(false);
  });

  it("is enabled in Chromium with SVG backdrop filters", () => {
    stubResizeObserver();
    vi.stubGlobal("navigator", { userAgentData: {} });
    vi.stubGlobal("CSS", { supports: () => true });
    expect(isRefractionSupported()).toBe(true);
  });
});
