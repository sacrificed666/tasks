import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithStore } from "@/test/render";

import ExternalLink from "./ExternalLink";

describe("ExternalLink", () => {
  it("opens another site in a new tab and says so", () => {
    renderWithStore(<ExternalLink href="https://example.com">Docs</ExternalLink>);
    const link = screen.getByRole("link", { name: /^Docs ?\(opens in a new tab\)$/u });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.querySelector("svg")).toBeInTheDocument();
  });

  it("uses the given label and leaves out the arrow on request", () => {
    renderWithStore(
      <ExternalLink href="https://example.com" label="Source code" icon={false}>
        GitHub
      </ExternalLink>,
    );
    const link = screen.getByRole("link", { name: "Source code (opens in a new tab)" });
    expect(link.querySelector("svg")).not.toBeInTheDocument();
  });
});
