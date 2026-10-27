# Security audit — GrowthWorks International

## Scope

The checks documented here cover the current static site source on the `main` branch: seven HTML pages, `styles.css`, `site.js`, `effects.js`, and the security workflow configuration. They are intended as a baseline and regression guard, not as a certification or a full penetration test.

## Findings and fixes

- **No obvious secrets in current source files:** targeted patterns for common API keys, GitHub tokens, private-key blocks, client secrets, and access tokens did not match the checked files. This is not a scan of the entire Git history, binary assets, or GitHub account secrets.
- **No inline event handlers or third-party script tags found** in the current HTML pages.
- **External tabs:** links using `target="_blank"` were checked for `rel="noopener"` or `rel="noreferrer"`.
- **Mixed content:** no HTTP resource URLs were found in the current HTML attributes.
- **Forms:** the forms currently build a message in the browser; they do not POST submissions to a site backend. The user still has to choose the WhatsApp action to send the message. There is no backend authentication/database/API in this repository to test.
- **Browser policy:** added a page-level Content Security Policy (CSP) and `strict-origin-when-cross-origin` referrer policy to each HTML page. The CSP limits JavaScript to same-origin files, prevents plug-in/object loads, limits framing *inside* the page, restricts resource origins and upgrades insecure requests. Inline styles are allowed because the current design uses HTML `style` attributes; inline scripts and `eval` are not allowed.
- **Regression guard:** `scripts/security_audit.py` checks page policies, unsafe source patterns, external script usage, new-tab link safety, credential patterns, workflow permissions, immutable action pins, `.gitignore`, and JSON-LD syntax. The GitHub Actions workflow runs on pushes, pull requests, manual dispatch, and weekly; it uses read-only repository permissions, does not persist the checkout token, and validates the Python file before running it.
- **CodeQL:** added a separate weekly JavaScript/TypeScript CodeQL workflow using the `security-extended` query suite. The workflow is configured and committed, but its first successful run and any reported findings still need to be checked on the repository's Actions/Security pages.
- **Dependency update hygiene:** `.github/dependabot.yml` checks GitHub Actions dependencies weekly. `.gitignore` excludes common local environment files, key files, and secret directories. Ignore rules do not remove files already tracked or clean past commit history.

## Hosting limitations that remain

This is a GitHub Pages static site. A meta CSP can provide defence in depth, but it **cannot set HTTP response headers** and cannot provide `frame-ancestors` clickjacking protection. Response headers such as `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, and `Permissions-Policy` must be set by the hosting layer or a reverse proxy/CDN. A repository file such as `_headers` is not a way to configure GitHub Pages response headers. Because this audit could not retrieve the live response headers, it does not conclude that any specific server header is currently missing; check the live response first, then configure missing headers at a hosting layer or reverse proxy/CDN.

Recommended manual checks in GitHub:

1. Open **Settings → Pages** and confirm **Enforce HTTPS** is enabled.
2. Confirm the custom domain is verified and DNS still points to the intended Pages site.
3. Review the repository's **Security** tab for secret-scanning and CodeQL alerts. GitHub documents automatic secret scanning for public repositories; push-protection controls and alert visibility can vary. Dependabot weekly checks for GitHub Actions are configured in this repository, but verify the status of Dependabot alerts in repository settings.
4. Consider a trusted reverse proxy/CDN if you need enforced server-side security headers (particularly HSTS and anti-framing headers).
5. Run a live security-header/TLS test against the deployed domain; these results cannot be inferred from source HTML.
6. Consider a branch ruleset for `main`: block force pushes/deletion, require pull-request review, and require the Static security audit / CodeQL checks only after both checks have completed successfully at least once. Branch protection is a GitHub repository setting; it has not been enabled by this source-code audit.

## Limits

No authenticated penetration test, destructive test, brute-force activity, DNS lookup, live TLS scan, or live HTTP-header inspection was performed. The live domain was not accessible to the browsing environment during this audit. The source checks scan the current files only, not all previous commits. A clean source audit does not prove that the deployment, DNS, TLS, hosting settings, or browser runtime are secure.
