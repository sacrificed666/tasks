import { act, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithStore } from "@/test/render";

import OfflineBadge from "./OfflineBadge";

describe("OfflineBadge", () => {
  it("keeps the live region and shows the badge only while offline", () => {
    const online = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    renderWithStore(<OfflineBadge />);
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Offline");
    expect(region.firstElementChild).toHaveAttribute("title", "You are offline. Changes are saved on this device.");
    online.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.getByRole("status")).toBe(region);
    expect(region).toBeEmptyDOMElement();
  });
});
