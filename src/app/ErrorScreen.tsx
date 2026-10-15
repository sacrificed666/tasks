import { exportFileName } from "@/features/data/model/transfer";
import { detectLocale, isLocale } from "@/shared/i18n/locales";
import { createTranslator } from "@/shared/i18n/translate";
import { downloadJson } from "@/shared/lib/download";
import { reloadPage } from "@/shared/lib/navigation";
import { getStorage, readJson, removeKey } from "@/shared/lib/storage";
import Icon from "@/shared/ui/Icon/Icon";

import { STORAGE_KEYS } from "./persistence";

import styles from "./ErrorScreen.module.scss";

interface ErrorScreenProps {
  error: Error;
}

// The page language, or the browser's when the app never started
const resolveLocale = () => {
  const lang = document.documentElement.lang;
  return isLocale(lang) ? lang : detectLocale(globalThis.navigator.languages);
};

// Recovery screen: download a backup, reset the view or reload
const ErrorScreen = ({ error }: ErrorScreenProps) => {
  const t = createTranslator(resolveLocale());
  const storage = getStorage();

  // Saves the stored data as it is, even when it cannot be read
  const downloadBackup = () => {
    if (!storage) return;
    downloadJson(exportFileName(new Date()), readJson(storage, STORAGE_KEYS.data) ?? null);
  };

  // Forgets the view preferences and starts again
  const resetView = () => {
    if (storage) removeKey(storage, STORAGE_KEYS.preferences);
    reloadPage();
  };

  return (
    <div className={styles.screen} role="alert">
      <div className={styles.card}>
        <span className={styles.icon}>
          <Icon name="alert" />
        </span>
        <h1 className={styles.title}>{t("error.title")}</h1>
        <p className={styles.description}>{t("error.description")}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => reloadPage()}>
            <Icon name="rotate" />
            {t("error.reload")}
          </button>
          {storage ? (
            <button type="button" className={styles.secondary} onClick={downloadBackup}>
              <Icon name="download" />
              {t("error.backup")}
            </button>
          ) : null}
          <button type="button" className={styles.secondary} onClick={resetView}>
            <Icon name="eraser" />
            {t("error.reset")}
          </button>
        </div>
        <details className={styles.details}>
          <summary>{t("error.details")}</summary>
          <pre>{error.message}</pre>
        </details>
      </div>
    </div>
  );
};

export default ErrorScreen;
