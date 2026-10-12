# 🛡️ Security policy

## ✅ Supported versions

Only the latest release receives security fixes, currently **1.x**, deployed to [tasks.sacrificed.me](https://tasks.sacrificed.me). A fix ships as a patch version, for example `1.0.1`, as described in [docs/releases.md](../docs/releases.md).

## 📮 Reporting a vulnerability

Please **do not open a public issue** for security problems.

1. Open the repository's **Security** tab and choose **Report a vulnerability** to send a private advisory.
2. Describe the problem, the affected version or commit and the steps to reproduce it.
3. If you have a proof of concept, attach it to the advisory rather than publishing it.

You can expect an acknowledgement within **3 working days** and a status update at least once a week until the report is resolved. Once a fix is deployed, the advisory is published and you are credited, unless you prefer to stay anonymous.

## 🎯 Scope

Tasks is a static, offline-first web app: there is no backend, no account and no network traffic apart from loading the app itself. Reports are especially welcome about:

- 💉 script injection through task titles, notes, imported files, shared content or URL parameters;
- 🧱 ways to bypass the Content Security Policy or Trusted Types;
- 🗄️ data loss or corruption caused by crafted storage or import data;
- ⚙️ weaknesses in the CI/CD pipeline or the GitHub Actions workflows.

The measures already in place are described in [docs/security.md](../docs/security.md).
