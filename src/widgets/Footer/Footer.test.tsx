import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SITE } from "@/shared/lib/site";
import { renderWithStore } from "@/test/render";

import Footer from "./Footer";

describe("Footer", () => {
  it("credits the author, the version and the source code", () => {
    renderWithStore(<Footer />);
    expect(screen.getByRole("contentinfo")).toHaveTextContent(`© ${new Date().getFullYear()} Illia Movchko`);
    expect(screen.getByRole("link", { name: /^v1\.0\.0/ })).toHaveAttribute("href", SITE.changelog);
    expect(screen.getByRole("link", { name: /^Source code/ })).toHaveAttribute("href", SITE.repository);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("tells screen readers that the links open a new tab", () => {
    renderWithStore(<Footer />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveTextContent("(opens in a new tab)");
    }
  });
});
