# Local Kubernetes development with Docker Compose

*You probably don't need this page either.*

The honest version: if you're doing local development against a Kubernetes stack, [install k3s](https://gist.github.com/baptisterajaut/089d4fad018129c431b675d9ef76e9d1). It's one script, it takes 30 seconds, it uses less RAM than your IDE, and your Helm charts work without conversion. `kubectl port-forward` isn't that scary.

The "minikube is too heavy" argument died when k3s came out. The "Kubernetes is too complex for local dev" argument died when k3s made it a single binary with zero configuration.

So why does this page exist? Because most people don't *want* to learn Kubernetes. They know `docker compose up`, it works, and learning k8s just to start an app on their laptop feels like being asked to get a pilot's license to drive to the grocery store.

That's the same reason kubernetes2simple exists in general — people self-hosting an app on their NAS or VPS want to paste a compose file and move on, the same way they do for Plex or Immich. For local dev, the dynamic is the same: designers, frontend devs, QA — they need to run the stack. They won't learn `kubectl`. Compose gives them a workflow they already understand.

Other reasons you'd end up here:

- **You can't be root.** Corporate laptop, Podman rootless, no sudo, no systemd. k3s needs root. If this is your life — we're sorry. Compose is what you've got.
- **Your platform only speaks Compose.** GitHub Codespaces, some cloud dev environments, certain CI setups — Compose works everywhere Docker runs. k3s doesn't.

## Two commands

```bash
curl -fsSL k2s.dekube.io/get | bash
docker compose up -d
```

No global installs. Everything goes into `.kubernetes2simple/`. The script produces `compose.yml`, `Caddyfile`, and `dekube.yaml`.

## Day-to-day

```bash
docker compose up -d          # start everything
docker compose logs -f myapp  # follow logs
docker compose restart myapp  # restart after a change
docker compose exec myapp sh  # shell into a container
docker compose down           # tear down
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

Docker Compose merges both files automatically. When you re-run the conversion, `compose.override.yml` is untouched.

## Re-generating after changes

When your Helm charts or manifests change, re-run the script:

```bash
./k2s.sh --env dev
docker compose up -d
```

`dekube.yaml` is preserved. Only `compose.yml` and `Caddyfile` are regenerated.

## Want more control?

Curious about what happened to your Deployments, ConfigMaps, and Ingresses? [How the conversion works](https://helmfile2compose.dekube.io/docs/how-conversion-works/) breaks it down resource by resource.

kubernetes2simple detects, downloads, and converts — you don't choose. If you need to pick extensions, exclude workloads, or embed the conversion in CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the power-user distribution.

---

> *"And in the lesser realms they built a mirror of the temple — smaller, simpler, and mercifully free of the admission controller that had plagued the original congregation."*
>
> — *Necronomicon, On the Virtues of Downscaling (probably⁴)*
