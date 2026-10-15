const SVG_NS = "http://www.w3.org/2000/svg";
const MAP_CACHE_LIMIT = 48;
const NEUTRAL = 128;
const AMPLITUDE = 127;

export interface RefractionOptions {
  bezel?: number;
  scale?: number;
}

const mapCache = new Map<string, string>();
let definitions: SVGDefsElement | null = null;
let sequence = 0;

// Chromium with SVG backdrop filters and full transparency
export const isRefractionSupported = () =>
  typeof navigator !== "undefined" &&
  "userAgentData" in navigator &&
  typeof ResizeObserver === "function" &&
  typeof CSS !== "undefined" &&
  CSS.supports("backdrop-filter", "url(#glass)") &&
  !globalThis.matchMedia("(prefers-reduced-transparency: reduce)").matches;

// Sets several SVG attributes at once
const setAttributes = (element: Element, attributes: Record<string, string | number>) => {
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
};

// Direction away from the nearest edge of a rounded rectangle
const surfaceNormal = (px: number, py: number, qx: number, qy: number, outside: number) => {
  if (qx > 0 && qy > 0 && outside > 0) {
    return [(Math.max(qx, 0) / outside) * Math.sign(px), (Math.max(qy, 0) / outside) * Math.sign(py)] as const;
  }
  return qx > qy ? ([Math.sign(px), 0] as const) : ([0, Math.sign(py)] as const);
};

// How far a pixel bends near the edge of the glass
export const displacementAt = (x: number, y: number, width: number, height: number, radius: number, bezel: number) => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corner = Math.min(radius, halfWidth, halfHeight);
  const px = x + 0.5 - halfWidth;
  const py = y + 0.5 - halfHeight;
  const qx = Math.abs(px) - (halfWidth - corner);
  const qy = Math.abs(py) - (halfHeight - corner);
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const depth = corner - outside - Math.min(Math.max(qx, qy), 0);
  const falloff = Math.min(Math.max(1 - depth / bezel, 0), 1);
  const strength = falloff * falloff;
  const [nx, ny] = surfaceNormal(px, py, qx, qy, outside);

  return [Math.round(NEUTRAL - nx * strength * AMPLITUDE), Math.round(NEUTRAL - ny * strength * AMPLITUDE)] as const;
};

// A displacement map image for a panel size
export const createDisplacementMap = (width: number, height: number, radius: number, bezel: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const image = context.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [red, green] = displacementAt(x, y, width, height, radius, bezel);
      const offset = (y * width + x) * 4;
      image.data[offset] = red;
      image.data[offset + 1] = green;
      image.data[offset + 2] = NEUTRAL;
      image.data[offset + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
};

// A cached displacement map, keeping the most recent sizes
const getDisplacementMap = (width: number, height: number, radius: number, bezel: number) => {
  const key = `${width}x${height}:${radius}:${bezel}`;
  const cached = mapCache.get(key);
  if (cached) return cached;

  const map = createDisplacementMap(width, height, radius, bezel);
  if (!map) return null;

  if (mapCache.size >= MAP_CACHE_LIMIT) {
    const oldest = mapCache.keys().next();
    if (!oldest.done) mapCache.delete(oldest.value);
  }
  mapCache.set(key, map);
  return map;
};

// The shared hidden SVG that holds the refraction filters
const getDefinitions = () => {
  if (definitions?.isConnected) return definitions;

  const svg = document.createElementNS(SVG_NS, "svg");
  setAttributes(svg, { "aria-hidden": "true", focusable: "false", width: 0, height: 0 });
  svg.style.position = "absolute";
  svg.style.pointerEvents = "none";

  definitions = document.createElementNS(SVG_NS, "defs");
  svg.append(definitions);
  document.body.append(svg);
  return definitions;
};

// Gives an element a refraction filter that follows its size
export const attachRefraction = (element: HTMLElement, { bezel = 18, scale = 36 }: RefractionOptions = {}) => {
  sequence += 1;
  const id = `refraction-${sequence}`;
  const filter = document.createElementNS(SVG_NS, "filter");
  const image = document.createElementNS(SVG_NS, "feImage");
  const displacement = document.createElementNS(SVG_NS, "feDisplacementMap");

  setAttributes(filter, {
    id,
    x: 0,
    y: 0,
    filterUnits: "userSpaceOnUse",
    primitiveUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  setAttributes(image, { x: 0, y: 0, preserveAspectRatio: "none", result: "map" });
  setAttributes(displacement, { in: "SourceGraphic", in2: "map", scale, xChannelSelector: "R", yChannelSelector: "G" });
  filter.append(image, displacement);
  getDefinitions().append(filter);

  let frame = 0;
  let appliedKey = "";

  // Builds the map for the current size once the size settles
  const update = () => {
    frame = 0;
    const width = Math.round(element.offsetWidth);
    const height = Math.round(element.offsetHeight);
    const radius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0;
    const key = `${width}x${height}:${radius}`;
    if (width === 0 || height === 0 || key === appliedKey) return;

    const map = getDisplacementMap(width, height, radius, bezel);
    if (!map) return;

    appliedKey = key;
    setAttributes(filter, { width, height });
    setAttributes(image, { width, height, href: map });
    element.style.setProperty("--glass-refraction", `url(#${id})`);
  };

  const observer = new ResizeObserver(() => {
    if (frame === 0) frame = requestAnimationFrame(update);
  });
  observer.observe(element);

  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    filter.remove();
    element.style.removeProperty("--glass-refraction");
  };
};
