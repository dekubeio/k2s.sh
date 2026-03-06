# How to convert Kubernetes manifests to Docker Compose

*Kubernetes? Too simple.*

You have Kubernetes manifests. You need `docker compose up`. Maybe you find Kubernetes too complicated. Maybe you love Docker Compose and don't see why you'd need anything else. Maybe someone handed you a helmfile and you just want containers that run. Maybe you hate Kubernetes — that's valid too.

Whatever the reason — converting Kubernetes manifests to Docker Compose by hand stops being viable at around three services.

## The problem

A basic Deployment converts easily enough:

```yaml
# Kubernetes
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: myapp
          image: myapp:1.2.0
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              value: "postgres://db:5432/myapp"
```

```yaml
# Docker Compose
services:
  myapp:
    image: myapp:1.2.0
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: "postgres://db:5432/myapp"
```

But real stacks have ConfigMaps injected as env vars, Secrets mounted as files, init containers running migrations, PVCs, Ingress routing, sidecars sharing a network namespace, and CRDs managed by operators. Doing this by hand for 15+ services means maintaining two sources of truth — and they will drift.

## Kubernetes made simple by removing Kubernetes

kubernetes2simple is a shell script that looks at your project and figures out what to do. Drop it in a directory containing a `helmfile.yaml`, a `Chart.yaml`, or raw Kubernetes YAML files, and it handles the rest:

```bash
curl -fsSL k2s.dekube.io/get | bash
docker compose up -d
```

The script:

1. **Detects your project type** — helmfile project? Helm chart? Plain K8s manifests? It reads the directory and decides.
2. **Bootstraps missing tools** — no helm installed? No helmfile? It downloads them into `.kubernetes2simple/bin/`. Your system stays clean.
3. **Sets up a Python environment** — creates a venv if needed, installs pyyaml and cryptography. No pollution.
4. **Renders your manifests** — runs `helmfile template`, `helm template`, or reads raw YAML, depending on what it detected.
5. **Converts everything** — feeds the rendered output through the dekube conversion engine with all official extensions loaded.

Everything it downloads lives in `.kubernetes2simple/`. Delete the directory and it's gone.

## What gets converted

| Kubernetes resource | Compose equivalent |
|---|---|
| Deployment, StatefulSet, DaemonSet | `services:` with image, env, command, volumes |
| Job | `services:` with `restart: on-failure` |
| ConfigMap, Secret | Inline environment variables + generated files |
| Service | Network aliases (K8s FQDNs resolve via compose DNS) |
| Ingress | Caddy reverse proxy with automatic TLS |
| PVC | Host-path bind mounts or named volumes |
| Init containers, sidecars | Separate compose services |
| CRDs (cert-manager, Keycloak, etc.) | Handled automatically |

HPA, RBAC, NetworkPolicy, CronJob — anything without a compose equivalent is skipped with a warning.

## Step-by-step example

Given three Kubernetes files in a directory:

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
```

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
        - name: myapp
          image: myapp:2.1.0
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: myapp-config
```

The script detects raw Kubernetes manifests, skips the helmfile/helm steps, and converts directly. The output:

```yaml
services:
  myapp:
    image: myapp:2.1.0
    environment:
      APP_ENV: "production"
      LOG_LEVEL: "info"
    networks:
      default:
        aliases:
          - myapp.default.svc.cluster.local
          - myapp.default.svc
          - myapp.default
```

ConfigMap values inlined. Kubernetes FQDN aliases preserved. Replicas ignored — Compose runs one instance.

## Want more control?

kubernetes2simple detects, downloads, and converts — you don't choose. If you need to pick which extensions to load, exclude workloads, customize the reverse proxy, or embed the conversion in your project's CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the distribution for maintainers who want full control over the pipeline.

---

> *"He who translates the celestial rites into common tongue does not simplify — he merely redistributes the suffering across a wider audience."*
>
> — *Necronomicon, On the Democratization of Forbidden Knowledge (trust me on this one)*
