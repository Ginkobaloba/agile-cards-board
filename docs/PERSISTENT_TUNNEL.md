# Upgrading the dashboard from a quick tunnel to the persistent named tunnel

The dashboard is currently being served through a Cloudflare **quick
tunnel** -- the kind started with `cloudflared tunnel --url
http://localhost:8080`. Quick tunnels hand out a fresh
`*.trycloudflare.com` hostname per run, have no Access policy in front
of them, and die with the process. Fine for a demo, not fine for
"this is the URL teammates point at".

This repo is already wired for a **persistent named tunnel** called
`agile-cards-board-tunnel`. The `.env.example` has the tunnel name,
tunnel ID, and account ID; `docker-compose.yml` has the `cloudflared`
service ready to read `TUNNEL_TOKEN` from `.env`. What's missing is
the one-time setup in the Cloudflare dashboard that produces the
token, the DNS route, and the Access policy.

The steps below need Cloudflare account access, so they're on Drew.

## Pre-flight

- [ ] You're signed in to the Cloudflare account that owns the
      `projectnexuscode.org` zone. (Account ID `298b5a830c602a211a824bd6925fb3c8`
      per `.env.example`.)
- [ ] The host that will run the connector is the 4070. Don't run the
      `cloudflared` service from any other dev box -- you'll get two
      connectors fighting for the same tunnel.
- [ ] The repo is checked out at `C:\dev\agile-cards-board` on the 4070.

## 1. Get the tunnel token

The tunnel `agile-cards-board-tunnel` (ID `f9154c80-2626-40a5-bafd-91d873542779`)
already exists. You just need its connector token.

1. Open Cloudflare dash -> **Zero Trust** -> **Networks** -> **Tunnels**.
2. Find `agile-cards-board-tunnel` in the list and click into it.
3. Hit **Configure** (top right).
4. On the **Overview** tab, pick **Docker** as the environment.
5. Reveal the install command. The token is the long string after
   `--token` in `cloudflared tunnel run --token <TOKEN>`. Copy just
   that token, not the whole command.

If you'd rather pull it via API (account-scoped token with
`Cloudflare Tunnel:Read`):

```
GET https://api.cloudflare.com/client/v4/accounts/298b5a830c602a211a824bd6925fb3c8/cfd_tunnel/f9154c80-2626-40a5-bafd-91d873542779/token
```

Treat the token like a credential. Anyone with it can register a
connector for this tunnel and serve traffic for its hostnames.

## 2. Confirm (or set) the public hostname route

The tunnel routes `app.projectnexuscode.org -> http://frontend:80`
(the nginx container name on the compose network).

1. In the same tunnel screen, switch to the **Public Hostnames** tab.
2. Confirm there's an entry:
   - **Subdomain**: `app`
   - **Domain**: `projectnexuscode.org`
   - **Service**: `HTTP` `http://frontend:80`
3. If it's missing, click **Add a public hostname** and create it
   exactly as above. Cloudflare will also create / update the proxied
   CNAME `app.projectnexuscode.org -> <tunnel_id>.cfargotunnel.com`
   for you.

`docs/cloudflared-tunnel.md` has more context on the topology and the
Access policy that sits in front of this hostname.

## 3. Drop the token into `.env`

On the 4070:

```powershell
cd C:\dev\agile-cards-board
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Replace the placeholder so the line reads:

```
TUNNEL_TOKEN=<the token from step 1>
```

Save and close. `.env` is gitignored -- the token never goes into the
repo.

## 4. Stop the quick tunnel

The quick tunnel and the named tunnel both try to serve traffic.
Leaving the quick one up means you don't know which connector you're
hitting.

```powershell
# find the cloudflared process serving the quick tunnel
Get-Process cloudflared -ErrorAction SilentlyContinue
# stop it (or Ctrl-C in the window where it's running)
Stop-Process -Name cloudflared
```

The vite dev server and the express backend can keep running -- they
don't depend on the tunnel.

## 5. Bring up the persistent tunnel

Two options. Pick one, not both.

### Option A -- via docker compose (recommended)

This uses the `cloudflared` service that's already in
`docker-compose.yml` and runs the whole stack (backend + nginx +
connector) together.

```powershell
cd C:\dev\agile-cards-board
docker compose up -d
docker compose logs -f cloudflared
```

Look for `Registered tunnel connection` lines. Four of them
(one per Cloudflare edge POP) means you're up.

### Option B -- via `cloudflared service install`

Use this if you'd rather run only the connector as a Windows service
and serve the dashboard some other way (e.g., the vite dev server
that's already running on 5173, or a hand-rolled nginx on the host).

```powershell
# one-time install as a Windows service, pinned to the token
cloudflared service install <the token from step 1>
# verify
Get-Service cloudflared
```

Cloudflare runs the connector under the Windows service manager from
that point on. It auto-restarts on boot. To swap the token later,
`cloudflared service uninstall` then re-install with the new one.

Important: Option B does **not** start the backend or the frontend.
Make sure the service the tunnel is routing to (`http://frontend:80`
per step 2) actually exists on this host. If you want the connector
to point at the vite dev server instead, change the public hostname's
service field to `http://host.docker.internal:5173`.

## 6. Verify end-to-end

- [ ] `https://app.projectnexuscode.org` loads.
- [ ] You get the Cloudflare Access one-time PIN prompt (sent to
      `dramattick1@gmail.com`).
- [ ] After the PIN, the dashboard's own bearer-token login appears.
- [ ] After that, the kanban board renders.
- [ ] In the Cloudflare dash, the tunnel shows status **HEALTHY** with
      four active connectors.

## 7. Tear down the quick-tunnel-era leftovers

- [ ] The `*.trycloudflare.com` URL from the quick tunnel is dead --
      remove it from any shared docs / chats so nobody bookmarks it.
- [ ] If you set `allowedHosts: [".trycloudflare.com", ...]` in
      `frontend/vite.config.ts` for the quick-tunnel demo, leave it.
      It's harmless for the persistent setup and useful if you ever
      need to fall back to a quick tunnel for a one-off demo.

## Rollback

If something goes sideways and you need the quick tunnel back fast:

```powershell
# stop the persistent stack
docker compose stop cloudflared
# OR, if you used the Windows service:
Stop-Service cloudflared

# fire a new quick tunnel at whichever frontend is up
cloudflared tunnel --url http://localhost:5173
# or
cloudflared tunnel --url http://localhost:8080
```

That gets you a fresh `*.trycloudflare.com` URL in seconds. The
persistent setup is unaffected and you can bring it back the same way
once you've fixed whatever broke.
