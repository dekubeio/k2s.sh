# How to convert Kubernetes manifests to Docker Compose

For the record: you should probably just run Kubernetes. On Linux, k3s is [one script](https://gist.github.com/baptisterajaut/089d4fad018129c431b675d9ef76e9d1). On macOS or Windows, Docker Desktop has an "Enable Kubernetes" checkbox. Your manifests work as-is.

But you're here, so one of these is true:

- **You don't want to learn Kubernetes.** You want to add an app to your NAS or VPS the same way you added Plex or Immich — paste a compose file, done. I'm not saying I agree, but this is the reason this project exists.
- **You can't be root.** Corporate policy says Podman rootless, no sudo, no systemd. k3s needs root. Compose is what you've got.
- **Your platform only speaks Compose.** Your Synology, your TrueNAS, your hosting panel — it has a Compose field and nothing else.

Either way — read on.

## Two commands

kubernetes2simple is a shell script. Point it at a directory containing Kubernetes YAML files, a Helm chart, or a helmfile, and it handles everything — detecting the project type, downloading any missing tools, and converting:

```bash
curl -fsSL k2s.dekube.io/get | bash
docker compose up -d
```

All downloaded tools go into `.kubernetes2simple/`. Your system stays clean. You get a `compose.yml`, a `Caddyfile` for reverse proxying, and a `dekube.yaml` for customization.

## Things to check after conversion

**Hostnames** — Ingress hostnames end up in the Caddy reverse proxy config. Make sure they resolve locally (`*.localhost` works on most systems, or add `/etc/hosts` entries).

**Secrets** — If a Secret wasn't in the rendered output, env vars that reference it are skipped (with a warning). Add missing values in `dekube.yaml` under `overrides:`, not in `compose.yml`.

**Volume paths** — Persistent storage becomes bind mounts under `./data/`. Customize in `dekube.yaml` — the script reads it but never overwrites it.

## Re-running

The script is safe to re-run. `compose.yml` and `Caddyfile` are regenerated. `dekube.yaml` is preserved — your volume paths, excludes, and overrides survive.

## Want more control?

Curious about what happened to your Deployments, ConfigMaps, and Ingresses? [How the conversion works](https://helmfile2compose.dekube.io/docs/how-conversion-works/) breaks it down resource by resource.

kubernetes2simple decides everything for you. If you need to pick which extensions to load, exclude workloads, or embed the conversion in CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the distribution for people who want full control.

---

> *"He who translates the celestial rites into common tongue does not simplify — he merely redistributes the suffering across a wider audience."*
>
> — *Necronomicon, On the Democratization of Forbidden Knowledge (trust me on this one)*
