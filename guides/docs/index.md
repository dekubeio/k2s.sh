---
description: "Getting started with kubernetes2simple — convert Kubernetes manifests, Helm charts, or helmfiles to a working Docker Compose setup in one command."
---

# Getting started with kubernetes2simple

kubernetes2simple (k2s) turns a directory of Kubernetes YAML, a Helm chart, or a helmfile into a working `compose.yml` — plus a `Caddyfile` for reverse proxying and a `dekube.yaml` for customization. One command, no cluster.

For the record: if you *can* run Kubernetes, it's probably simpler to. On Linux, k3s is [one script](https://gist.github.com/baptisterajaut/089d4fad018129c431b675d9ef76e9d1). On macOS or Windows, Docker Desktop has an "Enable Kubernetes" checkbox. Your manifests work as-is.

But you're here, so one of these is true:

- **You don't want to learn Kubernetes.** You want to add an app to your NAS or VPS the same way you added Plex or Immich — paste a compose file, done. I'm not saying I agree, but this is the reason this project exists.
- **You can't be root.** Corporate policy says Podman rootless, no sudo, no systemd. k3s needs root. Compose is what you've got.
- **Your platform only speaks Compose.** Your Synology, your TrueNAS, your hosting panel — it has a Compose field and nothing else.

Either way — read on.

## Two commands

kubernetes2simple is a shell script. Point it at a directory containing Kubernetes YAML files, a Helm chart, or a helmfile, and it handles everything — detecting the project type, downloading any missing tools (`helm`, `helmfile`), and converting:

```bash
curl -fsSL k2s.dekube.io/get | bash
docker compose up -d
```

All downloaded tools go into `.kubernetes2simple/`. Your system stays clean. You get a `compose.yml`, a `Caddyfile`, and a `dekube.yaml`.

If your helmfile uses environments, pass one. On the first run, forward it through the installer — arguments after `--` are passed straight to the script:

```bash
curl -fsSL k2s.dekube.io/get | bash -s -- --env dev
```

Once `./k2s.sh` is on disk, re-run it directly:

```bash
./k2s.sh --env dev
```

## Things to check after conversion

**Hostnames** — Your app's domain names end up in the Caddy reverse proxy config. Make sure they resolve locally (`*.localhost` works on most systems, or add `/etc/hosts` entries).

**Secrets** — If a secret value wasn't found during conversion, env vars that reference it are skipped (with a warning). Add missing values in `dekube.yaml` under `overrides:`, not in `compose.yml`.

**Volume paths** — Persistent storage becomes bind mounts under `./data/`. Customize in `dekube.yaml` — the script reads it but never overwrites it.

## Re-running

The script is safe to re-run. `compose.yml` and `Caddyfile` are regenerated. `dekube.yaml` is preserved — your volume paths, excludes, and overrides survive.

```bash
# After chart or manifest changes, just re-run
./k2s.sh --env dev
docker compose up -d
```

## Pick your guide

- [Convert Kubernetes manifests to Docker Compose](kubernetes-to-docker-compose.md) — you have raw Kubernetes YAML (the reverse of Kompose).
- [Run a Helm chart without a cluster](helm-chart-to-docker-compose.md) — a worked rustfs example, start to finish.
- [Local Kubernetes development with Docker Compose](local-kubernetes-development-docker-compose.md) — hot reload with a `compose.override.yml`.

## Want more control?

Want to understand what the script did with each part of your input? [How the conversion works](https://helmfile2compose.dekube.io/docs/how-conversion-works/) breaks it down step by step.

kubernetes2simple decides everything for you. If you need to pick which extensions to load, exclude services, or embed the conversion in CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the distribution for people who want full control. For how providers, rewriters, and extensions fit together, see the [full dekube documentation](https://docs.dekube.io/).
