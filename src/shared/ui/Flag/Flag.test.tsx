import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Flag from "./Flag";

describe("Flag", () => {
  it("loads decorative flags from the app itself", () => {
    render(<Flag country="UA" />);
    const flag = document.querySelector(`img[src='${import.meta.env.BASE_URL}flags/UA.svg']`);
    expect(flag).toHaveAttribute("width", "21");
    expect(flag).toHaveAttribute("alt", "");
  });

  it("names the country when no text does", () => {
    const { getByRole } = render(<Flag country="PL" height={20} label="Poland" />);
    expect(getByRole("img", { name: "Poland" })).toHaveAttribute("width", "30");
  });
});
