import { cx } from "@/shared/lib/cx";

import Icon from "../Icon/Icon";

import styles from "./SwatchPicker.module.scss";

export interface SwatchOption<Value extends string> {
  value: Value;
  label: string;
  color: string;
}

interface SwatchPickerProps<Value extends string> {
  name: string;
  label: string;
  value: Value;
  options: readonly SwatchOption<Value>[];
  onChange: (value: Value) => void;
  className?: string;
}

// A radio group of colour swatches
const SwatchPicker = <Value extends string>({
  name,
  label,
  value,
  options,
  onChange,
  className,
}: SwatchPickerProps<Value>) => (
  <fieldset className={cx(styles.swatches, className)}>
    <legend className="visually-hidden">{label}</legend>
    {options.map((option) => (
      <label key={option.value} className={styles.swatch} title={option.label} style={{ "--swatch": option.color }}>
        <input
          type="radio"
          name={name}
          className="visually-hidden"
          value={option.value}
          checked={option.value === value}
          aria-label={option.label}
          onChange={() => onChange(option.value)}
        />
        <span className={styles.dot}>
          <Icon name="check" className={styles.check} />
        </span>
      </label>
    ))}
  </fieldset>
);

export default SwatchPicker;
