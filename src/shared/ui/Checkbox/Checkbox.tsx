import type { ComponentPropsWithRef } from "react";

import { cx } from "@/shared/lib/cx";

import styles from "./Checkbox.module.scss";

interface CheckboxProps extends Omit<ComponentPropsWithRef<"input">, "type" | "size"> {
  size?: "small" | "medium";
}

// A round native checkbox
const Checkbox = ({ size = "medium", className, ...props }: CheckboxProps) => (
  <input type="checkbox" className={cx(styles.checkbox, size === "small" && styles.small, className)} {...props} />
);

export default Checkbox;
