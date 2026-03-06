# Local Kubernetes development with Docker Compose

*Kubernetes? Too simple.*

Someone on your team runs Kubernetes in production. You need a local dev environment but you don't want to learn Kubernetes just to start the app on your laptop. Or maybe you know Kubernetes fine and just don't think a local cluster should be necessary to run 15 containers. Either way — the question is whether you need a local *cluster* or whether Docker Compose is enough.

## The comparison

| | minikube / kind / k3d | Docker Compose |
|---|---|---|
| **Startup** | 10-90 seconds | Seconds |
| **RAM overhead** | 512 MB - 2+ GB | Minimal |
| **K8s API** | Full | None |
| **CRDs, operators** | Work | Handled by extensions |
| **RBAC, network policies** | Work | Don't exist |
| **Tooling** | kubectl, helm, port-forward | docker compose up/logs/exec |
| **Who can use it** | People who know K8s | Anyone who knows Docker |

## When Docker Compose is enough

Your application is a web app, an API, background workers, databases — things that listen on ports, read env vars, and talk to each other over DNS. You need fast iteration, your team includes people who don't know Kubernetes, and CI doesn't need a full cluster for integration tests.

This covers most applications.

## When it isn't

Your app talks to the Kubernetes API (controllers, operators, leader election). You need to test network policies, PDBs, rolling updates, scheduling. You're validating Helm chart changes or admission webhooks. These need a real cluster.

## Getting started

kubernetes2simple is a shell script. It detects your project type (helmfile, Helm chart, or raw manifests), downloads missing tools, and converts everything to Docker Compose:

```bash
curl -fsSL k2s.dekube.io/get | bash
docker compose up -d
```

No global installs. Everything goes into `.kubernetes2simple/`. The script produces `compose.yml`, `Caddyfile`, and `dekube.yaml`.

## Day-to-day workflow

```bash
# Start everything
docker compose up -d

# Follow logs
docker compose logs -f myapp

# Restart after a change
docker compose restart myapp

# Shell into a container
docker compose exec myapp sh

# Tear down
docker compose down
```

## Hot reload

Mount your source code via a `compose.override.yml` alongside the generated `compose.yml`:

```yaml
# compose.override.yml — yours, never overwritten
services:
  myapp:
    volumes:
      - ./src:/app/src
    environment:
      DEBUG: "true"
```

Docker Compose merges both files automatically. When you re-run the conversion, `compose.override.yml` is untouched. For frameworks with hot reload (Next.js, Flask, Spring Boot DevTools), this gives you live code reloading with no image rebuilds.

## Accessing services

**Ports** — container ports are mapped to your host automatically. Run `docker compose ps` to see what's where.

**Domain routing** — Ingress resources become Caddy reverse proxy rules. Use `.localhost` domains (most systems resolve them to `127.0.0.1`) or add entries to `/etc/hosts`. Caddy handles TLS with an internal CA.

## Re-generating after changes

When your Helm charts or manifests change, re-run the script:

```bash
./k2s.sh --env dev
docker compose up -d
```

`dekube.yaml` customizations (volume paths, excludes, overrides) are preserved. Only `compose.yml` and `Caddyfile` are regenerated.

## Want more control?

kubernetes2simple detects, downloads, and converts — you don't choose. If you need to pick extensions, exclude workloads, customize the reverse proxy, or embed the conversion in your project's CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the power-user distribution.

---

> *"And in the lesser realms they built a mirror of the temple — smaller, simpler, and mercifully free of the admission controller that had plagued the original congregation."*
>
> — *Necronomicon, On the Virtues of Downscaling (probably⁴)*
