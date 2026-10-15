import { useId, useState } from "react";

import { cx } from "@/shared/lib/cx";

import Icon from "../Icon/Icon";
import type { IconName } from "../Icon/icons";

import styles from "./SegmentedControl.module.scss";

export interface SegmentedOption<Value extends string> {
  value: Value;
  label: string;
  icon?: IconName;
  title?: string;
}

interface SegmentedControlProps<Value extends string> {
  label: string;
  value: Value;
  options: readonly SegmentedOption<Value>[];
  onChange: (value: Value) => void;
  name?: string;
  description?: string;
  hideLabel?: boolean;
  className?: string;
}

// A native radio group styled as segments
const SegmentedControl = <Value extends string>({
  label,
  value,
  options,
  onChange,
  name,
  description,
  hideLabel = false,
  className,
}: SegmentedControlProps<Value>) => {
  const generatedName = useId();
  const descriptionId = useId();
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0,
  );

  // Slides the indicator towards the chosen segment
  const select = (index: number, next: Value) => {
    setDirection(index >= selectedIndex ? "forward" : "backward");
    onChange(next);
  };

  return (
    <fieldset className={cx(styles.control, className)} aria-describedby={description ? descriptionId : undefined}>
      <legend className={hideLabel ? "visually-hidden" : styles.legend}>{label}</legend>
      <div
        className={styles.track}
        data-direction={direction}
        style={{ "--count": options.length, "--index": selectedIndex }}
      >
        <span className={styles.indicator} aria-hidden="true" />
        {options.map((option, index) => (
          <label
            key={option.value}
            className={styles.option}
            title={option.title}
            data-selected={option.value === value || undefined}
          >
            <input
              type="radio"
              className={styles.input}
              name={name ?? generatedName}
              value={option.value}
              checked={option.value === value}
              onChange={() => select(index, option.value)}
            />
            {option.icon ? <Icon name={option.icon} className={styles.icon} /> : null}
            <span className={styles.label}>{option.label}</span>
          </label>
        ))}
      </div>
      {description ? (
        <p className={styles.description} id={descriptionId}>
          {description}
        </p>
      ) : null}
    </fieldset>
  );
};

export default SegmentedControl;
