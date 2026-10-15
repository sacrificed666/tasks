import { useId, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectOverlayKind } from "@/features/lists/model/selectors";
import { overlayClosed } from "@/features/lists/model/viewSlice";
import { LOCALE_INFO, LOCALES } from "@/shared/i18n/locales";
import { useI18n } from "@/shared/i18n/useI18n";
import Dialog from "@/shared/ui/Dialog/Dialog";
import Flag from "@/shared/ui/Flag/Flag";
import Icon from "@/shared/ui/Icon/Icon";
import type { IconName } from "@/shared/ui/Icon/icons";
import IconButton from "@/shared/ui/IconButton/IconButton";
import SegmentedControl from "@/shared/ui/SegmentedControl/SegmentedControl";
import SwatchPicker from "@/shared/ui/SwatchPicker/SwatchPicker";

import { selectSettings } from "../../model/selectors";
import { EFFECTS, resolveEffects } from "../../model/settings";
import {
  accentChanged,
  appearanceChanged,
  backdropChanged,
  effectsChanged,
  glassChanged,
} from "../../model/settingsSlice";
import { ACCENTS, APPEARANCES, BACKDROPS, GLASS_STYLES } from "../../model/theme";
import { changeLocale } from "../../model/thunks";

import styles from "./SettingsDialog.module.scss";

const ACCENT_SWATCHES = {
  blue: "#0a84ff",
  indigo: "#6e6cf0",
  violet: "#8b6cff",
  pink: "#ff5fa2",
  rose: "#ff4d6d",
  sunset: "#ff6b3d",
  amber: "#ffb020",
  forest: "#22b35e",
  mint: "#2dd4bf",
  graphite: "#8a93a6",
} as const;

interface SectionProps {
  icon: IconName;
  title: string;
  children: ReactNode;
}

// A titled group of settings
const Section = ({ icon, title, children }: SectionProps) => {
  const headingId = useId();
  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <h3 id={headingId} className={styles.sectionTitle}>
        <Icon name={icon} className={styles.sectionIcon} />
        {title}
      </h3>
      {children}
    </section>
  );
};

// Theme with accent, background and glass, then effects and language
const SettingsContent = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const { appearance, accent, backdrop, glass, locale, effects } = useAppSelector(selectSettings);

  return (
    <div className={styles.content}>
      <Section icon="palette" title={t("settings.theme")}>
        <SegmentedControl
          label={t("settings.theme")}
          hideLabel
          name="appearance"
          value={appearance}
          options={APPEARANCES.map((value) => ({ value, label: t(`settings.theme.${value}`) }))}
          onChange={(next) => dispatch(appearanceChanged(next))}
        />

        <div className={styles.row}>
          <p className={styles.label}>{t("settings.accent")}</p>
          <p className={styles.value}>{t(`accent.${accent}`)}</p>
        </div>
        <SwatchPicker
          name="accent"
          label={t("settings.accentLabel")}
          value={accent}
          options={ACCENTS.map((value) => ({ value, label: t(`accent.${value}`), color: ACCENT_SWATCHES[value] }))}
          onChange={(next) => dispatch(accentChanged(next))}
        />

        <fieldset className={styles.group}>
          <legend className={styles.label}>{t("settings.background")}</legend>
          <div className={styles.backdrops}>
            {BACKDROPS.map((option) => (
              <label key={option} className={styles.backdrop}>
                <input
                  type="radio"
                  name="backdrop"
                  className="visually-hidden"
                  value={option}
                  checked={option === backdrop}
                  onChange={() => dispatch(backdropChanged(option))}
                />
                <span className={styles.preview} data-preview={option} aria-hidden="true">
                  <span className={styles.previewSidebar} />
                  <span className={styles.previewCard} />
                </span>
                <span className={styles.backdropName}>{t(`background.${option}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <SegmentedControl
          label={t("settings.glass")}
          name="glass"
          value={glass}
          options={GLASS_STYLES.map((value) => ({ value, label: t(`glass.${value}`) }))}
          onChange={(next) => dispatch(glassChanged(next))}
          description={t("settings.glassHint")}
        />
      </Section>

      <Section icon="bolt" title={t("settings.effects")}>
        <SegmentedControl
          label={t("settings.effects")}
          hideLabel
          name="effects"
          value={effects}
          options={EFFECTS.map((value) => ({ value, label: t(`settings.effects.${value}`) }))}
          onChange={(next) => dispatch(effectsChanged(next))}
          description={
            effects === "auto"
              ? t("settings.effects.device", { mode: t(`settings.effects.${resolveEffects(effects)}`) })
              : undefined
          }
        />
      </Section>

      <Section icon="globe" title={t("settings.language")}>
        <fieldset className={styles.group}>
          <legend className="visually-hidden">{t("settings.language")}</legend>
          <div className={styles.languages}>
            {LOCALES.map((code) => (
              <label key={code} className={styles.language}>
                <input
                  type="radio"
                  name="locale"
                  className="visually-hidden"
                  value={code}
                  checked={code === locale}
                  onChange={() => void dispatch(changeLocale(code))}
                />
                <Flag country={LOCALE_INFO[code].flag} />
                <span className={styles.languageName} lang={code}>
                  {LOCALE_INFO[code].name}
                </span>
                <Icon name="check" className={styles.languageCheck} />
              </label>
            ))}
          </div>
        </fieldset>
      </Section>
    </div>
  );
};

// The settings dialog
const SettingsDialog = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const open = useAppSelector((state) => selectOverlayKind(state) === "settings");
  // Closes the settings
  const close = () => dispatch(overlayClosed("settings"));

  return (
    <Dialog
      open={open}
      label={t("settings.title")}
      onClose={close}
      className={styles.dialog}
      header={
        <div className={styles.head}>
          <h2 className={styles.title}>{t("settings.title")}</h2>
          <IconButton icon="xmark" label={t("settings.close")} variant="ghost" size="small" onClick={close} />
        </div>
      }
    >
      <SettingsContent />
    </Dialog>
  );
};

export default SettingsDialog;
