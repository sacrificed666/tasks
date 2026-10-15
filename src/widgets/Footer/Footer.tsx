import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { SITE } from "@/shared/lib/site";
import ExternalLink from "@/shared/ui/ExternalLink/ExternalLink";

import styles from "./Footer.module.scss";

// Author, version and source code
const Footer = () => {
  const { t } = useI18n();
  const today = useToday();

  return (
    <footer className={styles.footer}>
      <div className={styles.bar}>
        <p className={styles.owner}>
          © {today.slice(0, 4)} {SITE.author.name}
          <span aria-hidden="true">·</span>
          <ExternalLink href={SITE.changelog} icon={false}>
            v{SITE.version}
          </ExternalLink>
        </p>
        <p className={styles.links}>
          <ExternalLink href={SITE.repository} icon={false}>
            {t("footer.source")}
          </ExternalLink>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
