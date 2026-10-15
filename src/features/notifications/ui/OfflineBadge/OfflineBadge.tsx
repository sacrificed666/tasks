import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { useI18n } from "@/shared/i18n/useI18n";
import Icon from "@/shared/ui/Icon/Icon";

import styles from "./OfflineBadge.module.scss";

// Shows that changes stay on this device while offline; the region always stays
const OfflineBadge = () => {
  const { t } = useI18n();
  const online = useOnlineStatus();

  return (
    <output className={styles.region}>
      {online ? null : (
        <span className={styles.badge} title={t("header.offlineHint")}>
          <Icon name="cloudOff" />
          <span className="visually-hidden">{t("header.offline")}</span>
        </span>
      )}
    </output>
  );
};

export default OfflineBadge;
