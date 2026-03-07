# How to convert a Helm chart to Docker Compose

*Kubernetes made simple by removing Kubernetes.*

Let's get this out of the way: you should just run Kubernetes. On Linux, k3s is [one script](https://gist.github.com/baptisterajaut/089d4fad018129c431b675d9ef76e9d1) and runs on a Raspberry Pi. On macOS or Windows, Docker Desktop has a "Enable Kubernetes" checkbox. Either way — `helm install` and you're done. No conversion needed.

But most people self-hosting don't want to learn Kubernetes. They want to add an app to their NAS or their VPS the same way they added Plex or Immich — paste a compose file, click deploy, move on with their life. Setting up a k8s cluster, even k3s, is beyond what they're willing to do to run a chat server in a closet. And that's the real reason this tool exists.

There are other valid reasons too:

- **No root access** — corporate policy says Podman rootless, no sudo, no systemd services. k3s needs root. You're stuck with what you have, and you have our sympathy.
- **Your platform only speaks Compose** — your Synology, Unraid, or hosting panel has a "paste your compose.yml here" box and nothing else. Kubernetes isn't on the menu.

If that's your situation, kubernetes2simple converts the chart for you. The Helm chart stays the source of truth, the Compose file is a generated artifact.

## Two commands

```bash
curl -fsSL k2s.dekube.io/get | bash
docker compose up -d
```

The script detects what's in your directory — a helmfile, a Helm chart, or raw Kubernetes manifests — and does the right thing. It downloads helm and helmfile if you don't have them. Everything goes into `.kubernetes2simple/`. Your system stays clean.

If your helmfile uses environments, pass one:

```bash
./k2s.sh --env dev
```

## Things to check after conversion

**Hostnames** — Ingress hostnames end up in the Caddy reverse proxy config. Make sure they resolve locally (`*.localhost` works on most systems, or add `/etc/hosts` entries).

**Secrets** — If a secret wasn't in the rendered output, a `changeme` placeholder is inserted. Check `compose.yml` and fill in real values.

**Volume paths** — Persistent storage becomes bind mounts under `./data/`. Customize in `dekube.yaml` — the script reads it but never overwrites it.

## Re-running

The script is safe to re-run. `compose.yml` and `Caddyfile` are regenerated. `dekube.yaml` is preserved — your volume paths, excludes, and overrides survive.

```bash
# After chart changes, just re-run
./k2s.sh --env dev
docker compose up -d
```

## Want more control?

Curious about what happened to your Deployments, ConfigMaps, and Ingresses? [How the conversion works](https://helmfile2compose.dekube.io/docs/how-conversion-works/) breaks it down resource by resource.

kubernetes2simple decides everything for you. If you need to choose which extensions to load, exclude specific workloads, or embed the conversion in CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the distribution for maintainers.

---

> *"The scribe who copied the great hymns into the lesser tongue believed himself a translator. He was, in truth, the first heretic — for to render the sacred in the mundane is to declare that the mundane was always sufficient."*
>
> — *Necronomicon, On the Heresy of Helm Template (unverified)*
