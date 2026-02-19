# SMTP Setup

This project now sends transactional emails over SMTP using a pooled transporter with retry logic.

## Required environment variables

Set these values in `.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true` for port `465`, otherwise `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (single sender for all emails, e.g. `"DevLink <no-reply@yourdomain.com>"`)

## Optional tuning

- `SMTP_REPLY_TO`
- `SMTP_MAX_CONNECTIONS` (default `5`)
- `SMTP_MAX_MESSAGES` (default `100`)
- `SMTP_RETRY_LIMIT` (default `3`)
- `SMTP_RETRY_DELAY_MS` (default `800`)
- `SMTP_CONNECTION_TIMEOUT_MS` (default `10000`)
- `SMTP_GREETING_TIMEOUT_MS` (default `10000`)
- `SMTP_SOCKET_TIMEOUT_MS` (default `20000`)
- `SMTP_TLS_REJECT_UNAUTHORIZED` (default `true`)

## Implemented email events

- Welcome email on first successful signup/login.
- Spark received email when someone sends a new Spark.
- Spark accepted email when a pending Spark is accepted.
- Inquiry received email when a public profile inquiry is submitted.
- Onboarding completion email when setup is completed.

## Notes

- Email dispatch is non-blocking for API flows.
- SMTP failures are logged and retried, but do not break auth/network/inquiry endpoints.
