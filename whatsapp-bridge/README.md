# Maibook WhatsApp bridge

This bridge keeps the WhatsApp Web session and browser process outside Laravel.
It listens on loopback only and requires `X-Bridge-Token` on every request.

## Install and run

```bash
cd /path/to/maibook/whatsapp-bridge
npm ci
export PORT=3010
export BRIDGE_TOKEN='replace-with-a-random-secret'
export SESSION_PATH=/var/lib/maibook-whatsapp
node server.js
```

Call `POST /login`, then poll `GET /status` until `state` is `qr` and scan the
returned PNG data URL. The session is persisted by `LocalAuth` under
`SESSION_PATH`.

Example status request:

```bash
curl -H "X-Bridge-Token: $BRIDGE_TOKEN" http://127.0.0.1:3010/status
```

## systemd

Create `/etc/systemd/system/maibook-whatsapp.service`:

```ini
[Unit]
Description=Maibook WhatsApp bridge
After=network.target

[Service]
Type=simple
User=administrator
WorkingDirectory=/var/www/maibook/whatsapp-bridge
EnvironmentFile=/etc/maibook/whatsapp-bridge.env
ExecStart=/usr/bin/node /var/www/maibook/whatsapp-bridge/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

The environment file should contain `PORT`, `BRIDGE_TOKEN`, and
`SESSION_PATH`, with permissions restricted to the service user. Enable it
with:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now maibook-whatsapp.service
```

Do not expose the bridge port publicly. Laravel should call its loopback URL.
