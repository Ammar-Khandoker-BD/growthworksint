#!/usr/bin/env python3
"""Lightweight static security checks for the GrowthWorks International site.

This is a regression guard, not a full penetration test or git-history scanner.
Run with: python3 scripts/security_audit.py
"""
from __future__ import annotations

import re
import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    "index.html",
    "services.html",
    "portfolio.html",
    "about.html",
    "careers.html",
    "contact.html",
    "humanity-first.html",
]
SCRIPTS = ["site.js", "effects.js"]
SECURITY_SUPPORT_FILES = [".github/workflows/security-audit.yml", ".github/dependabot.yml", ".gitignore"]
failures: list[str] = []
checks = 0


def check(condition: bool, message: str) -> None:
    global checks
    checks += 1
    if not condition:
        failures.append(message)


def read(path: str) -> str:
    file_path = ROOT / path
    if not file_path.is_file():
        failures.append(f"Missing required file: {path}")
        return ""
    return file_path.read_text(encoding="utf-8")


# Patterns for high-confidence credential formats. This only scans current site
# source files, not prior commits, binary assets, or GitHub Actions secrets.
secret_patterns = [
    re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{30,}\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b"),
    re.compile(r"-----BEGIN (?:RSA|EC|OPENSSH|DSA) PRIVATE KEY-----"),
    re.compile(r"""(?i)\b(?:client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][^"']{16,}["']"""),
]

all_sources: dict[str, str] = {}
for path in PAGES + SCRIPTS + ["styles.css"] + SECURITY_SUPPORT_FILES:
    all_sources[path] = read(path)

for path in PAGES:
    html = all_sources[path]
    check(bool(re.search(r"<html\b[^>]*\blang=['\"]en['\"]", html, re.I)),
          f"{path}: missing HTML language attribute")
    check('http-equiv="Content-Security-Policy"' in html,
          f"{path}: missing CSP meta policy")
    check('name="referrer" content="strict-origin-when-cross-origin"' in html,
          f"{path}: missing strict-origin-when-cross-origin referrer policy")

    csp_match = re.search(
        r'<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"',
        html,
        re.I,
    )
    csp = csp_match.group(1) if csp_match else ""
    for directive in [
        "default-src 'self'",
        "script-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-src 'none'",
        "upgrade-insecure-requests",
    ]:
        check(directive in csp, f"{path}: CSP missing {directive}")
    script_src = re.search(r"(?:^|;)\s*script-src\s+([^;]+)", csp)
    if script_src:
        check("'unsafe-inline'" not in script_src.group(1),
              f"{path}: CSP allows unsafe inline scripts")
        check("'unsafe-eval'" not in script_src.group(1),
              f"{path}: CSP allows unsafe eval")

    # Site scripts should remain same-origin; third-party JavaScript is not needed.
    for tag in re.findall(r"<script\b[^>]*>", html, re.I):
        src_match = re.search(r'\bsrc=["\']([^"\']+)["\']', tag, re.I)
        if src_match:
            src = src_match.group(1)
            check(not re.match(r"https?://", src, re.I),
                  f"{path}: external JavaScript source {src}")
        else:
            script_type = re.search(r'\btype=["\']([^"\']+)["\']', tag, re.I)
            check(bool(script_type and script_type.group(1).lower() == "application/ld+json"),
                  f"{path}: unexpected inline script block")

    check(not re.search(r"\son[a-z]+\s*=", html, re.I),
          f"{path}: inline event-handler attribute found")
    check(not re.search(r"(?:src|href)\s*=\s*['\"]http://", html, re.I),
          f"{path}: mixed-content HTTP resource")
    check(not re.search(r"href\s*=\s*['\"]\s*javascript:", html, re.I),
          f"{path}: javascript: URL found")

    for anchor in re.findall(r"<a\b[^>]*>", html, re.I):
        if re.search(r'\btarget\s*=\s*["\']_blank["\']', anchor, re.I):
            rel = re.search(r'\brel\s*=\s*["\']([^"\']+)["\']', anchor, re.I)
            rel_tokens = set(rel.group(1).lower().split()) if rel else set()
            check(bool({"noopener", "noreferrer"} & rel_tokens),
                  f"{path}: target=_blank link lacks noopener/noreferrer")

    check(html.count('src="site.js?') == 1,
          f"{path}: expected exactly one cache-busted site.js")
    check(html.count('src="effects.js?') == 1,
          f"{path}: expected exactly one cache-busted effects.js")

    for jsonld in re.findall(
        r'<script\s+type="application/ld\+json">([\s\S]*?)</script>',
        html,
        re.I,
    ):
        try:
            json.loads(jsonld)
            check(True, f"{path}: JSON-LD parses")
        except json.JSONDecodeError as error:
            check(False, f"{path}: invalid JSON-LD ({error})")


# Keep the CI security guard itself least-privilege and pinned to immutable actions.
workflow = all_sources[".github/workflows/security-audit.yml"]
dependabot = all_sources[".github/dependabot.yml"]
gitignore = all_sources[".gitignore"]

check(bool(re.search(r"(?m)^permissions:\\s*\\n\\s+contents:\\s*read\\s*$", workflow)),
      "security workflow must use read-only contents permission")
check("persist-credentials: false" in workflow,
      "security workflow checkout must not persist the GitHub token")
check("pull_request_target" not in workflow and "workflow_run" not in workflow,
      "security workflow must not use privileged pull_request_target/workflow_run triggers")
check("schedule:" in workflow and "workflow_dispatch:" in workflow,
      "security workflow must support scheduled and manual runs")
for action_ref in re.findall(r"(?m)^\\s+uses:\\s+[^\\s@]+@([^\\s]+)\\s*$", workflow):
    check(bool(re.fullmatch(r"[0-9a-f]{40}", action_ref)),
          f"workflow action must be pinned to a full commit SHA, not {action_ref}")

check("package-ecosystem: github-actions" in dependabot and "interval: weekly" in dependabot,
      "Dependabot must check GitHub Actions dependencies weekly")
for expected_ignore in [".env", ".env.*", "*.pem", "*.key", "secrets/"]:
    check(expected_ignore in gitignore,
          f".gitignore should exclude {expected_ignore}")

for path in SCRIPTS:
    script = all_sources[path]
    for pattern, label in [
        (r"\beval\s*\(", "eval()"),
        (r"\bnew\s+Function\s*\(", "new Function()"),
        (r"\bdocument\.write\s*\(", "document.write()"),
    ]:
        check(not re.search(pattern, script),
              f"{path}: unsafe JavaScript construct {label}")

for path, source in all_sources.items():
    for pattern in secret_patterns:
        check(not pattern.search(source),
              f"{path}: possible credential pattern found ({pattern.pattern})")

# The forms must remain client-side message builders: don't silently add a
# server POST endpoint without a separate privacy/security review.
for path in ["services.html", "contact.html", "careers.html"]:
    html = all_sources[path]
    for form in re.findall(r"<form\b[^>]*>", html, re.I):
        action = re.search(r'\baction=["\']([^"\']+)["\']', form, re.I)
        check(not action or not re.match(r"https?://", action.group(1), re.I),
              f"{path}: form posts directly to an external endpoint")

if failures:
    print(f"SECURITY AUDIT FAILED: {len(failures)} finding(s), {checks} checks run")
    for failure in failures:
        print(f" - {failure}")
    sys.exit(1)

print(f"SECURITY AUDIT PASSED: {checks} static checks across {len(PAGES)} pages, "
      f"{len(SCRIPTS)} scripts, and styles.css.")
print("Scope: current tracked source only; no live HTTP header, DNS, TLS, or "
      "git-history scan was performed.")
