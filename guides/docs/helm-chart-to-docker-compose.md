# How to convert a Helm chart to Docker Compose

For the record: you should probably just run Kubernetes. On Linux, k3s is [one script](https://gist.github.com/baptisterajaut/089d4fad018129c431b675d9ef76e9d1). On macOS or Windows, Docker Desktop has an "Enable Kubernetes" checkbox. `helm install` and you're done.

But you're here, so one of these is true:

- **You don't want to learn Kubernetes.** You want to add an app to your NAS or VPS the same way you added Plex or Immich — paste a compose file, click deploy, move on. I'm not saying I agree, but this is the reason this project exists.
- **You can't be root.** Corporate policy says Podman rootless, no sudo, no systemd. k3s needs root. Compose is what you've got.
- **Your platform only speaks Compose.** Your Synology, Unraid, or hosting panel has a "paste your compose.yml here" box and nothing else.

kubernetes2simple converts the chart for you. The Helm chart stays the source of truth, the Compose file is a generated artifact.

## Two commands

```bash
curl -fsSL k2s.dekube.io/get | bash
docker compose up -d
```

The script detects what's in your directory — a helmfile, a Helm chart, or raw Kubernetes manifests — and does the right thing. It downloads helm and helmfile if you don't have them. Everything goes into `.kubernetes2simple/`. Your system stays clean.

If your helmfile uses environments, pass one:

```bash
./kubernetes2simple.sh --env dev
```

## Things to check after conversion

**Hostnames** — Your app's domain names end up in the Caddy reverse proxy config. Make sure they resolve locally (`*.localhost` works on most systems, or add `/etc/hosts` entries).

**Secrets** — If a secret value wasn't found during conversion, env vars that reference it are skipped (with a warning). Add missing values in `dekube.yaml` under `overrides:`, not in `compose.yml`.

**Volume paths** — Persistent storage becomes bind mounts under `./data/`. Customize in `dekube.yaml` — the script reads it but never overwrites it.

## Re-running

The script is safe to re-run. `compose.yml` and `Caddyfile` are regenerated. `dekube.yaml` is preserved — your volume paths, excludes, and overrides survive.

```bash
# After chart changes, just re-run
./kubernetes2simple.sh --env dev
docker compose up -d
```

## Want more control?

Want to understand what the script did with each part of your chart? [How the conversion works](https://helmfile2compose.dekube.io/docs/how-conversion-works/) breaks it down step by step.

kubernetes2simple decides everything for you. If you need to choose which extensions to load, exclude specific services, or embed the conversion in CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the distribution for maintainers.

---

> *"The scribe who copied the great hymns into the lesser tongue believed himself a translator. He was, in truth, the first heretic — for to render the sacred in the mundane is to declare that the mundane was always sufficient."*
>
> — *Necronomicon, On the Heresy of Helm Template (unverified)*
