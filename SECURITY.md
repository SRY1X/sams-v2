# Security policy

SAMS handles academic identity and attendance records. Please report suspected vulnerabilities privately; do not publish exploit details, student data, credentials, or QR tokens in a public issue.

Use GitHub’s **Report a vulnerability** option in the repository’s **Security** tab when private vulnerability reporting is enabled. If the option is missing or unavailable, use [GitHub Support](https://support.github.com/contact) to report the security concern privately; do not put sensitive details in a public issue. GitHub Support is not a private message to SAMS maintainers, so include a safe way for GitHub to follow up and use synthetic reproduction details.

The maintainers will enable private vulnerability reporting on the public repository. Reports should include the affected version/commit, impact, reproduction steps using synthetic data, and suggested mitigation if known. Reporters should allow maintainers reasonable time to investigate and prepare a fix before public disclosure. We aim to acknowledge reports within five business days and provide status updates while investigating.

Maintainers should minimize access to report contents, avoid putting sensitive details in public trackers, coordinate a fix and release, and credit reporters only with their consent. Rotate any credential that may have been exposed. Do not send real student or faculty data as proof of concept.

Security scope includes auth/session handling, RLS, privileged functions, role assignments, cross-institution access, QR token signing/validation, attendance integrity, dependency/supply-chain issues, and personal data exposure.
