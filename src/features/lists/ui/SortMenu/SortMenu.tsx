import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useI18n } from "@/shared/i18n/useI18n";
import Icon from "@/shared/ui/Icon/Icon";
import Popover from "@/shared/ui/Popover/Popover";
import { usePopover } from "@/shared/ui/Popover/usePopover";

import { selectSort } from "../../model/selectors";
import { SORT_MODES, type SortMode } from "../../model/sort";
import { sortChanged } from "../../model/viewSlice";

import styles from "./SortMenu.module.scss";

// Menu that changes the sort order of the list
const SortMenu = () => {
  const dispatch = useAppDispatch();
  const sort = useAppSelector(selectSort);
  const { t } = useI18n();
  const popover = usePopover();

  // Applies a sort order and closes the menu
  const choose = (mode: SortMode) => {
    popover.close();
    dispatch(sortChanged(mode));
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label={t("sort.trigger", { mode: t(`sort.${sort}`) })}
        data-glass-light=""
        {...popover.triggerProps}
      >
        <Icon name="sort" className={styles.icon} />
        <span className={styles.value}>{t(`sort.${sort}`)}</span>
        <Icon name="chevronDown" className={styles.chevron} />
      </button>
      <Popover
        id={popover.id}
        popoverRef={popover.ref}
        anchorName={popover.anchorName}
        label={t("sort.heading")}
        className={styles.panel}
      >
        <p className={styles.heading}>{t("sort.heading")}</p>
        {SORT_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            className={styles.option}
            aria-pressed={mode === sort}
            onClick={() => choose(mode)}
          >
            <span>{t(`sort.${mode}`)}</span>
            <Icon name="check" className={styles.check} />
          </button>
        ))}
      </Popover>
    </>
  );
};

export default SortMenu;
