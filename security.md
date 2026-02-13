# Security Policy

## Supported Versions

Security updates are currently provided for the active development branch only.

| Version | Supported |
| --- | --- |
| `main` (latest) | Yes |
| Older commits/releases | No |

## Reporting a Vulnerability

Please report suspected vulnerabilities privately. Do not open a public issue with exploit details.

Include the following in your report:
- Affected endpoint, component, or file
- Reproduction steps and prerequisites
- Expected impact (data exposure, auth bypass, privilege escalation, etc.)
- Proof-of-concept request/response samples (redact secrets)
- Suggested fix (optional)

Response targets:
- Initial acknowledgement: within 72 hours
- Triage decision: within 7 days
- Fix timeline: based on severity and exploitability

If your report is valid, we will coordinate remediation and public disclosure timing with you.

Preferred initial report channel:
- Private direct contact with the maintainer (do not disclose secrets publicly)
- Include a safe callback method for follow-up

## Scope

This policy covers:
- Frontend app in `src/`
- Backend API in `backend/`
- Authentication, authorization, payment, and admin flows

Out of scope:
- Social engineering, phishing, or physical attacks
- Denial-of-service traffic that does not expose a code flaw
- Issues requiring rooted/jailbroken devices without a product vulnerability

## Current Security Controls (Implemented)

Backend protections currently include:
- JWT-based user and admin auth with separated token domains
- Refresh token rotation and revocation endpoints
- OTP-based verification and account-recovery controls
- Request rate limiting (global + auth-sensitive routes)
- Request/response hardening headers and CSP
- Configurable CORS allowlist via `CORS_ORIGIN`
- JSON content-type enforcement for mutating requests
- Paystack webhook signature validation and replay protection
- Admin action audit logging
- Sensitive value redaction in request logs

## Secret Handling Requirements

- Never commit live secrets to git (`.env`, API keys, SMTP passwords, admin bootstrap keys).
- Use `.env.example` as templates only; keep real values in local/private secret stores.
- Rotate secrets immediately if they are exposed in logs, screenshots, chat, or commits.
- Use distinct keys per environment (development, staging, production).
- Limit access to payment keys and admin bootstrap keys to authorized operators only.

## Deployment Hardening Requirements

Before production deployment:
- Set strong secrets for `JWT_SECRET`, `ADMIN_BOOTSTRAP_KEY`, SMTP, and payment keys
- Configure explicit origins in `CORS_ORIGIN` (avoid permissive defaults)
- Enforce HTTPS at the edge/load balancer
- Rotate secrets periodically and on any suspected leak
- Restrict DB/network access using least privilege
- Monitor auth failures, 429 spikes, and admin activity logs

Recommended next step for stronger session security:
- Move frontend token storage from browser storage to secure HttpOnly cookies with CSRF protection

## Responsible Disclosure

Do not publicly disclose vulnerability details until a fix is available and deployed.
We support good-faith research and coordinated disclosure.
