# How to convert Kubernetes manifests to Docker Compose

*You probably shouldn't need this page.*

Technically, if you can install k3s — and on any Linux machine, [that's one script](https://gist.github.com/baptisterajaut/089d4fad018129c431b675d9ef76e9d1) — you should just run Kubernetes. k3s is lighter than most people think, it runs on a Raspberry Pi, and your manifests work as-is. No conversion, no translation, no drift.

But let's be honest about why you're here. Most people self-hosting an app don't want to learn Kubernetes. They want to add something to their TrueNAS, their Synology, their VPS — the same way they added Plex or Immich. Compose is what they know, it's what their platform supports, and k8s is not a hill they're willing to die on just to run a chat server in a closet.

That's the real reason this tool exists. There are other valid ones:

- **You can't be root.** Corporate policy says Podman rootless, no sudo, no systemd services. k3s isn't happening. If this is you — genuine sympathy. Compose is what you've got.
- **Your platform only speaks Compose.** Some NAS interfaces, some cloud providers, some hosting panels — they give you a Compose field and nothing else.

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

**Secrets** — If a secret wasn't in the rendered output, a `changeme` placeholder is inserted. Check `compose.yml` and fill in real values.

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
