import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectDetailsId } from "@/features/lists/model/selectors";
import { detailsClosed } from "@/features/lists/model/viewSlice";
import { useI18n } from "@/shared/i18n/useI18n";
import Dialog from "@/shared/ui/Dialog/Dialog";

import { selectTaskById } from "../../model/selectors";
import TaskDetails from "../TaskDetails/TaskDetails";

import styles from "./TaskDetailsDialog.module.scss";

// Task details in a dialog on narrow screens
const TaskDetailsDialog = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const id = useAppSelector(selectDetailsId);
  const task = useAppSelector((state) => (id === null ? undefined : selectTaskById(state, id)));
  // Closes the details
  const close = () => dispatch(detailsClosed());

  return (
    <Dialog open={task !== undefined} label={t("details.title")} onClose={close} className={styles.dialog}>
      {task ? <TaskDetails key={task.id} task={task} onClose={close} /> : null}
    </Dialog>
  );
};

export default TaskDetailsDialog;
