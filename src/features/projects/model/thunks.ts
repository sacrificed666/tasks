import type { AppThunk } from "@/app/store";
import { projectView } from "@/features/lists/model/lists";
import { detailsClosed, listChanged } from "@/features/lists/model/viewSlice";
import { toastShown } from "@/features/notifications/model/toastSlice";
import { selectTasks } from "@/features/tasks/model/selectors";

import { normalizeProjectName, type ProjectDraft } from "./project";
import { projectAdded, projectRemoved } from "./projectsSlice";

// Adds a project and opens it unless told otherwise
export const createProject =
  (draft: ProjectDraft, open = true): AppThunk<string | null> =>
  (dispatch) => {
    const name = normalizeProjectName(draft.name);
    if (!name) return null;
    const { payload } = dispatch(projectAdded({ ...draft, name }));
    if (open) dispatch(listChanged(projectView(payload.id)));
    return payload.id;
  };

// Removes a project with its tasks and offers to undo
export const deleteProject =
  (id: string): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    const project = state.projects.entities[id];
    if (!project) return;

    const taskIds = selectTasks(state)
      .filter((task) => task.projectId === id)
      .map((task) => task.id);
    const { detailsId } = state.view;

    dispatch(projectRemoved(id));
    if (detailsId !== null && taskIds.includes(detailsId)) dispatch(detailsClosed());

    dispatch(
      toastShown({
        message:
          taskIds.length > 0
            ? { key: "toast.projectDeleted", params: { name: project.name, count: taskIds.length } }
            : { key: "toast.projectDeletedEmpty", params: { name: project.name } },
        action: { type: "undo" },
      }),
    );
  };
