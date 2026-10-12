import { useEffect } from "react";

// Shows the number of tasks due today on the installed app icon
export const useAppBadge = (count: number) => {
  // Updates the badge where the browser supports it
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    const update = count > 0 ? navigator.setAppBadge(count) : navigator.clearAppBadge();
    update.catch(() => {});
  }, [count]);
};
