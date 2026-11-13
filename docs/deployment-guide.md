# Deployment Guide – Smart CRM, flow L2 (track SE), tag v1.0

## 1. Requirements

- Docker Engine 24+ and Docker Compose v2 (check: `docker compose version`).
- Git 2.30+, about 2 GB of free disk space, TCP port 3000 free (it can be changed, see section 3).
- No Node.js and no PostgreSQL are needed on the host: both run inside containers.
- Tested environment: Linux containers (GitHub Codespaces). Docker Desktop on Windows or macOS is also supported.

## 2. Setup steps

1. `git clone --branch v1.0 https://github.com/KietNguyen112005-png/cdtn1-NguyenDoTuanKiet-L2.git`
2. `cd cdtn1-NguyenDoTuanKiet-L2`
3. `cp .env.example .env` (Windows PowerShell: `Copy-Item .env.example .env`)
4. `docker compose up -d --build` (the first build takes about 2 minutes)

After cloning, steps 3 and 4 are the only commands needed. When the app starts it creates the tables and loads the sample data by itself.

## 3. Environment variables

| Name | Meaning | Sample value | Required |
|---|---|---|---|
| `APP_PORT` | Host port where the app is published | `3000` | no (default 3000) |
| `DB_NAME` | PostgreSQL database name | `smart_crm` | yes |
| `DB_USER` | PostgreSQL user | `crm` | yes |
| `DB_PASSWORD` | PostgreSQL password | `crm_dev_password` | yes |
| `DB_HOST`, `DB_PORT` | Database address. Docker Compose sets them to `db` and `5432`; they matter only when running Node directly (defaults `localhost`, `5432`) | – | no |
| `AUTH_USERNAME` | Login name of the single staff account | `nhanvien` | yes |
| `AUTH_PASSWORD` | Password of that account | `1234` | yes |
| `AUTH_SECRET` | Key that signs session tokens; use at least 32 characters | see `.env.example` | yes |
| `SLA_TZ_OFFSET_MINUTES` | Time-zone offset in minutes used for SLA due dates (UTC+7 is 420) | `420` | no (default 420) |

The sample values are for testing only. Change all of them before a real deployment. The real `.env` is never committed. If a required variable is missing, the app stops at start-up and prints the missing variable names (never their values).

## 4. Sample data

The data is loaded automatically every time the app starts (the loading is idempotent, so restarting does not duplicate rows) from `migrations/001_init.sql` and `seeds/*.sql`. After the first start you should find:

| Table | Rows |
|---|---|
| `sla_config` | 3 |
| `issue_category` | 6 |
| `customer` | 2 |
| `device` | 3 |
| `ticket` | 6 (one per status, except cancelled) |
| `ticket_status_log` | 19 |

Check the counts (expected result: `3 | 6 | 2 | 3 | 6 | 19`, as long as you have not created extra data):

```
docker compose exec db psql -U crm -d smart_crm -c "SELECT (SELECT count(*) FROM sla_config) AS sla, (SELECT count(*) FROM issue_category) AS categories, (SELECT count(*) FROM customer) AS customers, (SELECT count(*) FROM device) AS devices, (SELECT count(*) FROM ticket) AS tickets, (SELECT count(*) FROM ticket_status_log) AS logs;"
```

Demo login: `nhanvien` / `1234`. Sample customer phone numbers: `0937482915` and `0865139704`. (If you changed `DB_USER` or `DB_NAME` in `.env`, use your values in the command above.)

## 5. Verify it works

1. `docker compose ps` → the `db` and `app` services show `healthy` (allow up to about 30 seconds after start).
2. `curl http://localhost:3000/health` → `{"status":"ok"}`
3. Open `http://localhost:3000` and log in with `nhanvien` / `1234` → the **Danh sách phiếu** (ticket list) screen shows 6 tickets.
4. `docker compose exec app npm test` → the output ends with `# fail 0`.

Optional API check (Linux, macOS or Git Bash): `curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"username":"nhanvien","password":"1234"}'` → JSON that contains a `token` field. On Windows PowerShell use the web page instead, because of quoting rules.

## 6. Restart and clean up

- Start again or apply a changed `.env`: `docker compose up -d` (safe to repeat).
- Stop: `docker compose down`.
- Remove all data and start from a clean state: `docker compose down -v`, then run step 4 of section 2 again.
- Show the latest logs: `docker compose logs app --tail 50`.

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `Bind for 0.0.0.0:3000 failed: port is already allocated` | Another program uses the port. Stop it, or set `APP_PORT=3001` in `.env` and run `docker compose up -d` again |
| The app exits with "Thiếu biến môi trường: …" | `.env` lacks lines that exist in `.env.example`. Add the variables named in the message |
| `password authentication failed` after changing `DB_PASSWORD` | The old volume keeps the old password. Run `docker compose down -v`, then start again |
| Ticket list is empty | Run `docker compose logs app --tail 50` and look for an error in the sample-data step |

## 8. Enabling HTTPS in a real deployment

The app serves plain HTTP and does not terminate TLS itself. For a real deployment:

- Put it behind a reverse proxy (for example Nginx or Caddy, or the load balancer of the hosting platform) that holds the TLS certificate and forwards requests to port 3000. Publish only the proxy's port 443 and redirect HTTP to HTTPS there.
- Keep every secret in the platform's environment settings, never in the repository, and replace the sample `DB_PASSWORD`, `AUTH_PASSWORD` and `AUTH_SECRET` with strong values.
- The app authenticates with a Bearer token sent in the `Authorization` header, never in the URL, and does not use cookies at the moment. If cookies are added later, set `HttpOnly` and `SameSite`, set `Secure` when `NODE_ENV=production`, and call `app.set('trust proxy', 1)` so that Express reads `X-Forwarded-Proto` correctly behind the proxy.
