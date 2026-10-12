import { prefersReducedMotion } from "./motion";

const PARTICLES = 36;
const PALETTE = ["--orb-1", "--orb-2", "--orb-3", "--orb-4", "--orb-5", "--color-accent"];

// Confetti from a point, skipped when motion is reduced
export const celebrate = (origin: { x: number; y: number } = { x: innerWidth / 2, y: innerHeight / 3 }) => {
  if (prefersReducedMotion() || typeof Element.prototype.animate !== "function") return;

  const styles = getComputedStyle(document.documentElement);
  const colors = PALETTE.map((name) => styles.getPropertyValue(name).trim()).filter(Boolean);
  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden";
  document.body.append(layer);

  const animations = Array.from({ length: PARTICLES }, (_, index) => {
    const particle = document.createElement("span");
    const size = 6 + Math.random() * 8;
    const angle = (index / PARTICLES) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 120 + Math.random() * 180;
    particle.style.cssText = `position:absolute;left:${origin.x}px;top:${origin.y}px;width:${size}px;height:${size * 0.6}px;border-radius:2px;background:${colors[index % colors.length] ?? "#fff"};box-shadow:inset 0 1px 0 rgb(255 255 255 / 60%)`;
    layer.append(particle);

    return particle.animate(
      [
        { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle) * distance}px), calc(-50% + ${Math.sin(angle) * distance + 160}px)) rotate(${Math.random() * 720 - 360}deg)`,
          opacity: 0,
        },
      ],
      { duration: 1100 + Math.random() * 600, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
    ).finished;
  });

  void Promise.allSettled(animations).then(() => layer.remove());
};
