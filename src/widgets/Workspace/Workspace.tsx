import { useAppSelector } from "@/app/hooks";
import { selectList, selectSearching } from "@/features/lists/model/selectors";
import ListHeader from "@/features/lists/ui/ListHeader/ListHeader";
import TaskComposer from "@/features/tasks/ui/TaskComposer/TaskComposer";
import TaskList from "@/features/tasks/ui/TaskList/TaskList";

import styles from "./Workspace.module.scss";

export const WORKSPACE_ID = "tasks";

// The main column: header, quick add and the tasks
const Workspace = () => {
  const list = useAppSelector(selectList);
  const searching = useAppSelector(selectSearching);

  return (
    <main id={WORKSPACE_ID} className={styles.main} tabIndex={-1}>
      <ListHeader />
      {searching || list === "completed" ? null : <TaskComposer key={list} view={list} />}
      <TaskList />
    </main>
  );
};

export default Workspace;
