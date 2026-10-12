import Icon from "../Icon/Icon";
import type { IconName } from "../Icon/icons";

import styles from "./EmptyState.module.scss";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  compact?: boolean;
}

// An icon, a title and a hint for an empty list
const EmptyState = ({ icon, title, description, compact = false }: EmptyStateProps) => (
  <div className={styles.empty} data-compact={compact || undefined}>
    <span className={styles.icon}>
      <Icon name={icon} />
    </span>
    <p className={styles.title}>{title}</p>
    <p className={styles.description}>{description}</p>
  </div>
);

export default EmptyState;
