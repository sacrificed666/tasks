import { useAppSelector } from "@/app/hooks";
import { selectDetailsId } from "@/features/lists/model/selectors";
import Overview from "@/features/stats/ui/Overview/Overview";
import { selectTaskById } from "@/features/tasks/model/selectors";
import TaskDetailsPanel from "@/features/tasks/ui/TaskDetailsPanel/TaskDetailsPanel";

import styles from "./Inspector.module.scss";

// The right column: task details, or the overview
const Inspector = () => {
  const id = useAppSelector(selectDetailsId);
  const task = useAppSelector((state) => (id === null ? undefined : selectTaskById(state, id)));

  return (
    <aside className={styles.inspector}>{task ? <TaskDetailsPanel key={task.id} task={task} /> : <Overview />}</aside>
  );
};

export default Inspector;
