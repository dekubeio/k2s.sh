# How to convert a Helm chart to Docker Compose

*Kubernetes made simple by removing Kubernetes.*

You have Helm charts (or a helmfile managing several). You don't want to deal with Kubernetes — maybe you find it overkill for your setup, maybe you just prefer Docker Compose, or maybe someone else maintains the charts and you just need the thing to run. The usual options: maintain a separate `compose.yml` by hand (it will drift), run a local cluster with minikube/kind/k3d (heavyweight), or convert automatically.

kubernetes2simple takes the third approach — the Helm chart stays the source of truth, the Compose file is a generated artifact.

## One script, automatic detection

kubernetes2simple is a shell script. Drop it in your project directory and run it:

```bash
curl -fsSL k2s.dekube.io/get | bash
docker compose up -d
```

The script reads your directory and detects the project type:

- **`helmfile.yaml` found?** → helmfile project. Downloads helm + helmfile if missing, runs `helmfile template`, converts.
- **`Chart.yaml` found?** → Helm chart. Downloads helm if missing, builds dependencies, runs `helm template`, converts.
- **Raw `*.yaml` with `kind:` fields?** → Kubernetes manifests. Converts directly.

All downloaded tools go into `.kubernetes2simple/`. Your system stays clean.

### Helmfile environments

If your helmfile project uses environments, pass one:

```bash
./k2s.sh --env dev
```

If you don't pass `--env`, the script warns you and asks to confirm — helmfile projects usually need one.

## What the conversion handles

**Subcharts** — Bitnami PostgreSQL, Redis, Keycloak as dependencies? Everything renders into separate manifests. All converted. Bitnami-specific quirks (sentinel mode, replication flags, admin credentials) are handled by a bundled transform.

**CRDs** — cert-manager Certificates, Keycloak realms, ServiceMonitors are all handled by bundled extensions. No configuration needed — kubernetes2simple includes everything.

**Conditional `null` values** — Helm's `{{ if }}` blocks can render disabled fields as `null` instead of omitting them. Handled correctly.

**Init containers** — become separate compose services with `restart: on-failure`. They run concurrently in Compose (not sequentially like in K8s). Everything converges, but expect noisy logs on first boot.

## Common gotchas

**Hostnames** — Ingress hostnames end up in the Caddy reverse proxy config. Make sure they resolve locally (`*.localhost` works on most systems, or add `/etc/hosts` entries).

**Secrets** — If a Secret wasn't in the rendered output, a `changeme` placeholder is inserted. Check `compose.yml` and fill in real values.

**Volume paths** — PVCs become bind mounts under `./data/`. Customize in `dekube.yaml` — the script reads it but never overwrites it.

## Re-running

The script is safe to re-run. `compose.yml` and `Caddyfile` are regenerated. `dekube.yaml` is preserved — your volume paths, excludes, and overrides survive.

```bash
# After chart changes, just re-run
./k2s.sh --env dev
docker compose up -d
```

## Want more control?

kubernetes2simple decides everything for you — extensions, pipeline, configuration. If you need to choose which extensions to load, exclude specific workloads, customize the pipeline, or embed the conversion in your CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the distribution for maintainers.

---

> *"The scribe who copied the great hymns into the lesser tongue believed himself a translator. He was, in truth, the first heretic — for to render the sacred in the mundane is to declare that the mundane was always sufficient."*
>
> — *Necronomicon, On the Heresy of Helm Template (unverified)*
