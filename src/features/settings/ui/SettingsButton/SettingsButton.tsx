import { useAppDispatch } from "@/app/hooks";
import { overlayOpened } from "@/features/lists/model/viewSlice";
import { useI18n } from "@/shared/i18n/useI18n";
import IconButton, { type IconButtonVariant } from "@/shared/ui/IconButton/IconButton";

interface SettingsButtonProps {
  variant?: IconButtonVariant;
}

// Opens the settings
const SettingsButton = ({ variant = "glass" }: SettingsButtonProps) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();

  return (
    <IconButton
      icon="sliders"
      label={t("settings.open")}
      variant={variant}
      aria-haspopup="dialog"
      onClick={() => dispatch(overlayOpened({ kind: "settings" }))}
    />
  );
};

export default SettingsButton;
