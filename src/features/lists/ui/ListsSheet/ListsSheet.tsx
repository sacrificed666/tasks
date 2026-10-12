import { useAppDispatch, useAppSelector } from "@/app/hooks";
import ProjectNav from "@/features/projects/ui/ProjectNav/ProjectNav";
import { useI18n } from "@/shared/i18n/useI18n";
import Dialog from "@/shared/ui/Dialog/Dialog";
import IconButton from "@/shared/ui/IconButton/IconButton";

import { selectOverlayKind } from "../../model/selectors";
import { overlayClosed } from "../../model/viewSlice";
import ListNav from "../ListNav/ListNav";
import TagNav from "../TagNav/TagNav";

import styles from "./ListsSheet.module.scss";

// Bottom sheet with lists, projects and tags on phones
const ListsSheet = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const open = useAppSelector((state) => selectOverlayKind(state) === "lists");
  // Closes the sheet
  const close = () => dispatch(overlayClosed("lists"));

  return (
    <Dialog open={open} label={t("lists.browse")} onClose={close} className={styles.sheet}>
      <div className={styles.content}>
        <div className={styles.head}>
          <h2 className={styles.title}>{t("lists.browse")}</h2>
          <IconButton icon="xmark" label={t("details.close")} variant="ghost" size="small" onClick={close} />
        </div>
        <ListNav onNavigate={close} />
        <ProjectNav onNavigate={close} />
        <TagNav onNavigate={close} />
      </div>
    </Dialog>
  );
};

export default ListsSheet;
