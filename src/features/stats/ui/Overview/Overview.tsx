import { useId } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { projectView } from "@/features/lists/model/lists";
import { listChanged } from "@/features/lists/model/viewSlice";
import { splitProjectName } from "@/features/projects/model/project";
import ProjectIcon from "@/features/projects/ui/ProjectIcon/ProjectIcon";
import { selectListCounts } from "@/features/tasks/model/selectors";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { formatWeekdayShort } from "@/shared/lib/date";
import Icon from "@/shared/ui/Icon/Icon";
import type { IconName } from "@/shared/ui/Icon/icons";
import ProgressBar from "@/shared/ui/ProgressBar/ProgressBar";

import { selectActivity, selectProjectProgress } from "../../model/selectors";

import styles from "./Overview.module.scss";

interface Stat {
  label: string;
  value: number;
  icon: IconName;
  tone: string;
}

// Overdue, today and important counts with the overall progress
const Overview = () => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t, intlLocale } = useI18n();
  const counts = useAppSelector((state) => selectListCounts(state, today));
  const { days, streak } = useAppSelector((state) => selectActivity(state, today));
  const projects = useAppSelector(selectProjectProgress);
  const percent = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
  const busiest = Math.max(1, ...days.map((day) => day.count));
  const titleId = useId();

  if (counts.total === 0) {
    return (
      <section className={styles.card} aria-labelledby={titleId}>
        <h2 id={titleId} className={styles.title}>
          {t("overview.title")}
        </h2>
        <p className={styles.empty}>
          <Icon name="sparkles" className={styles.emptyIcon} />
          {t("overview.empty")}
        </p>
      </section>
    );
  }

  const stats: readonly Stat[] = [
    { label: t("overview.overdue"), value: counts.overdue, icon: "calendar", tone: "overdue" },
    { label: t("overview.dueToday"), value: counts.today - counts.overdue, icon: "sun", tone: "today" },
    { label: t("overview.important"), value: counts.important, icon: "star", tone: "important" },
  ];

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <div className={styles.head}>
        <h2 id={titleId} className={styles.title}>
          {t("overview.title")}
        </h2>
        <span className={styles.percent}>{percent}%</span>
      </div>
      <ProgressBar value={counts.completed} max={counts.total} label={t("overview.progress")} />
      <p className={styles.caption}>{t("overview.completed", { done: counts.completed, total: counts.total })}</p>
      <ul className={styles.stats}>
        {stats.map((stat) => (
          <li key={stat.tone} className={styles.stat} data-tone={stat.tone}>
            <Icon name={stat.icon} filled={stat.icon === "star"} className={styles.statIcon} />
            <span className={styles.value}>{stat.value}</span>
            <span className={styles.label}>{stat.label}</span>
          </li>
        ))}
      </ul>
      <div className={styles.activityHead}>
        <h3 className={styles.subtitle}>{t("overview.activity")}</h3>
        {streak > 0 ? (
          <span className={styles.streak}>
            <Icon name="flame" filled className={styles.flame} />
            {t("overview.streak", { count: streak })}
          </span>
        ) : null}
      </div>
      <ol className={styles.chart}>
        {days.map(({ day, count }) => {
          const weekday = formatWeekdayShort(day, intlLocale);
          return (
            <li key={day} className={styles.day} data-today={day === today ? "" : undefined}>
              <span className={styles.bar} style={{ "--value": count / busiest }} aria-hidden="true">
                {count > 0 ? <span className={styles.count}>{count}</span> : null}
              </span>
              <span className={styles.weekday} aria-hidden="true">
                {weekday}
              </span>
              <span className="visually-hidden">{t("overview.activityDay", { day: weekday, count })}</span>
            </li>
          );
        })}
      </ol>
      {projects.length > 0 ? (
        <>
          <h3 className={styles.projectsTitle}>{t("projects.title")}</h3>
          <ul className={styles.projects}>
            {projects.map(({ project, done, total }) => {
              const { label } = splitProjectName(project.name);
              const progress = t("listHeader.progress", { done, total });
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    className={styles.project}
                    data-project-color={project.color}
                    aria-describedby={`${titleId}-${project.id}`}
                    onClick={() => dispatch(listChanged(projectView(project.id)))}
                  >
                    <ProjectIcon name={project.name} color={project.color} size="small" />
                    <span className={styles.projectName}>{label}</span>{" "}
                    <span className={styles.projectCount}>{`${done}/${total}`}</span>
                    <span className={styles.projectBar} style={{ "--value": done / total }} aria-hidden="true" />
                    <span id={`${titleId}-${project.id}`} hidden>
                      {progress}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
};

export default Overview;
