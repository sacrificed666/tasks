import { useEffect, useState } from "react";

// Whether an element has scrolled out above the given offset
export const useScrolledPast = (targetId: string, offset = 0) => {
  const [past, setPast] = useState(false);

  // Watches the element with an intersection observer
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || !("IntersectionObserver" in globalThis)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPast(entry !== undefined && !entry.isIntersecting && entry.boundingClientRect.top < offset),
      { rootMargin: `-${offset}px 0px 0px 0px` },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId, offset]);

  return past;
};
