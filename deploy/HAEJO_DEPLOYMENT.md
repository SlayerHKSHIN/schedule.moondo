# Haejo deployment notes

The Haejo VM already runs the Haejo API, web application, and Caddy. Deploy
this application as a separate service on loopback port 4312 and add the
contents of `Caddyfile.scheduler` as a separate host block to the existing
Caddy configuration.

## Build outside the VM

The e2-micro instance has little available memory while Haejo is running.
Build the React client outside that VM:

```bash
npm ci
npm --prefix client ci
npm run build
```

The generated `client/build` directory must be copied with the application
release. On the VM, install only production backend dependencies:

```bash
npm ci --omit=dev
```

## Persistent and secret material

Do not put these files into Git:

- `/etc/scheduler/scheduler.env` (mode 600, owned by `haejo`)
- `/srv/scheduler/service_account_key/service-account-key.json`
- `/srv/scheduler/.refresh_token.json`
- `/srv/scheduler/data/users.json`
- `/srv/scheduler/data/availability.json`

Preserve the original `ENCRYPTION_KEY`. It is required to decrypt user OAuth
tokens already stored in `data/users.json`.

## Google OAuth

Add this exact redirect URI to the existing OAuth client before cutover:

```
https://hyun-schedule.gltr-ous.us/api/auth/google/callback
```

The domain must resolve to the Haejo VM and Caddy must have completed its TLS
certificate issuance before the OAuth flow is tested.
