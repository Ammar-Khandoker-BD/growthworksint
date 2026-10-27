# Security audit — GrowthWorks International

## Scope

The checks documented here cover the current static site source on the `main` branch: seven HTML pages, `styles.css`, `site.js`, and `effects.js`. They are intended as a baseline and regression guard, not as a certification or a full penetration test.

## Findings and fixes

- **No obvious secrets in current source files:** targeted patterns for common API keys, GitHub tokens, private-key blocks, client secrets, and access tokens did not match the checked files. This is not a scan of the entire Git history, binary assets, or GitHub account secrets.
- **No inline event handlers or third-party script tags found** in the current HTML pages.
- **External tabs:** links using `target="_blank"` were checked for `rel="noopener"` or `rel="noreferrer"`.
- **Mixed content:** no HTTP resource URLs were found in the current HTML attributes.
- **Forms:** the forms currently build a message in the browser; they do not POST submissions to a site backend. The user still has to choose the WhatsApp action to send the message. There is no backend authentication/database/API in this repository to test.
- **Browser policy:** added a page-level Content Security Policy (CSP) and `strict-origin-when-cross-origin` referrer policy to each HTML page. The CSP limits JavaScript to same-origin files, prevents plug-in/object loads, limits framing *inside* the page, restricts resource origins and upgrades insecure requests. Inline styles are allowed because the current design uses HTML `style` attributes; inline scripts and `eval` are not allowed.
- **Regression guard:** `scripts/security_audit.py` is a dependency-free source checker intended to run locally or in GitHub Actions.

## Hosting limitations that remain

This is a GitHub Pages static site. A meta CSP can provide defence in depth, but it **cannot set HTTP response headers** and cannot provide `frame-ancestors` clickjacking protection. Response headers such as `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, and `Permissions-Policy` must be set by the hosting layer or a reverse proxy/CDN. A repository file such as `_headers` is not a way to configure GitHub Pages response headers.

Recommended manual checks in GitHub:

1. Open **Settings → Pages** and confirm **Enforce HTTPS** is enabled.
2. Confirm the custom domain is verified and DNS still points to the intended Pages site.
3. Enable GitHub's secret scanning/push protection and Dependabot alerts where available for the account/repository.
4. Consider a trusted reverse proxy/CDN if you need enforced server-side security headers (particularly HSTS and anti-framing headers).
5. Run a live security-header/TLS test against the deployed domain; these results cannot be inferred from source HTML.

## Limits

No authenticated penetration test, destructive test, brute-force activity, DNS lookup, live TLS scan, or live HTTP-header inspection was performed. The live domain was not accessible to the browsing environment during this audit. The source checks scan the current files only, not all previous commits. A clean source audit does not prove that the deployment, DNS, TLS, hosting settings, or browser runtime are secure.
