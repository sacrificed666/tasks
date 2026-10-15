import { cx } from "@/shared/lib/cx";

import Logo from "../Logo/Logo";

import styles from "./Brand.module.scss";

interface BrandProps {
  label: string;
  name?: string;
  className?: string;
}

// Logo and app name
const Brand = ({ label, name, className }: BrandProps) => (
  <a className={cx(styles.brand, className)} href={import.meta.env.BASE_URL} aria-label={label}>
    <Logo className={styles.logo} size={30} />
    {name ? <span className={styles.name}>{name}</span> : null}
  </a>
);

export default Brand;
