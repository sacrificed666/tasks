import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectListCounts, type ListCounts } from "@/features/tasks/model/selectors";
import { useDropTarget } from "@/features/tasks/ui/TaskDnd/useDropTarget";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import Icon from "@/shared/ui/Icon/Icon";

import { LIST_ICONS } from "../../model/listIcons";
import { LISTS, type ListId } from "../../model/lists";
import { selectList, selectSearching } from "../../model/selectors";
import { listChanged } from "../../model/viewSlice";

import styles from "./ListNav.module.scss";

interface ListNavItemProps {
  id: ListId;
  counts: ListCounts;
  current: boolean;
  onSelect: () => void;
}

// One smart list with its icon and count, and a drop target for tasks
const ListNavItem = ({ id, counts, current, onSelect }: ListNavItemProps) => {
  const { t } = useI18n();
  const label = t(`lists.${id}`);
  const [dropRef, dropActive] = useDropTarget(id, label);
  const droppable = id !== "all";

  return (
    <li>
      <button
        ref={droppable ? dropRef : undefined}
        type="button"
        className={styles.item}
        data-tone={id}
        data-drop-active={droppable && dropActive ? "" : undefined}
        aria-current={current ? "page" : undefined}
        aria-label={t("lists.counter", { label, count: counts[id] })}
        onClick={onSelect}
      >
        <span className={styles.icon}>
          <Icon name={LIST_ICONS[id]} filled={id === "important"} />
        </span>
        <span className={styles.label}>{label}</span>{" "}
        {counts[id] > 0 ? (
          <span
            className={styles.count}
            aria-hidden="true"
            data-alert={id === "today" && counts.overdue > 0 ? "" : undefined}
          >
            {counts[id]}
          </span>
        ) : null}
      </button>
    </li>
  );
};

interface ListNavProps {
  onNavigate?: () => void;
}

// The smart lists in the sidebar
const ListNav = ({ onNavigate }: ListNavProps) => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t } = useI18n();
  const list = useAppSelector(selectList);
  const searching = useAppSelector(selectSearching);
  const counts = useAppSelector((state) => selectListCounts(state, today));

  return (
    <nav className={styles.nav} aria-label={t("lists.nav")}>
      <ul className={styles.list}>
        {LISTS.map((id) => (
          <ListNavItem
            key={id}
            id={id}
            counts={counts}
            current={id === list && !searching}
            onSelect={() => {
              dispatch(listChanged(id));
              onNavigate?.();
            }}
          />
        ))}
      </ul>
    </nav>
  );
};

export default ListNav;
