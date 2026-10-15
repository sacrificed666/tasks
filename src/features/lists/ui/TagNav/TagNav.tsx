import { useId } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectTagCounts } from "@/features/tasks/model/selectors";
import { useI18n } from "@/shared/i18n/useI18n";
import Icon from "@/shared/ui/Icon/Icon";

import { selectQuery } from "../../model/selectors";
import { queryChanged } from "../../model/viewSlice";

import styles from "./TagNav.module.scss";

interface TagNavProps {
  onNavigate?: () => void;
}

// Tags found in task titles; a tag searches for it, a second click clears it
const TagNav = ({ onNavigate }: TagNavProps) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const headingId = useId();
  const tags = useAppSelector(selectTagCounts);
  const query = useAppSelector(selectQuery).trim().toLocaleLowerCase();

  if (tags.length === 0) return null;

  return (
    <nav className={styles.nav} aria-labelledby={headingId}>
      <h2 id={headingId} className={styles.heading}>
        {t("tags.title")}
      </h2>
      <ul className={styles.tags}>
        {tags.map(({ tag, count }) => {
          const active = query === tag.toLocaleLowerCase();
          return (
            <li key={tag}>
              <button
                type="button"
                className={styles.tag}
                aria-pressed={active}
                aria-label={t("lists.counter", { label: t("task.tag", { tag }), count })}
                onClick={() => {
                  dispatch(queryChanged(active ? "" : tag));
                  onNavigate?.();
                }}
              >
                <Icon name="hash" className={styles.icon} />
                <span className={styles.name}>{tag.slice(1)}</span>{" "}
                <span className={styles.count} aria-hidden="true">
                  {count}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default TagNav;
