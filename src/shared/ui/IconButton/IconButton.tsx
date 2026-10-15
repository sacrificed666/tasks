import type { ComponentPropsWithRef } from "react";

import { cx } from "@/shared/lib/cx";

import Icon from "../Icon/Icon";
import type { IconName } from "../Icon/icons";

import styles from "./IconButton.module.scss";

export type IconButtonVariant = "glass" | "ghost" | "accent" | "danger";
export type IconButtonSize = "small" | "medium";

interface IconButtonProps extends Omit<ComponentPropsWithRef<"button">, "children" | "type"> {
  icon: IconName;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  type?: "button" | "submit";
  iconFilled?: boolean;
}

// A round icon button named by its label
const IconButton = ({
  icon,
  label,
  variant = "glass",
  size = "medium",
  type = "button",
  iconFilled = false,
  className,
  ...props
}: IconButtonProps) => (
  <button
    type={type === "submit" ? "submit" : "button"}
    aria-label={label}
    className={cx(styles.button, styles[variant], styles[size], className)}
    data-glass-light=""
    {...props}
  >
    <Icon name={icon} filled={iconFilled} className={styles.icon} />
  </button>
);

export default IconButton;
