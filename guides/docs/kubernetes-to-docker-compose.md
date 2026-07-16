---
description: "Convert Kubernetes manifests to a Docker Compose file — the reverse of Kompose. One command, no cluster, ideal for self-hosted and NAS setups."
---

# How to convert Kubernetes manifests to Docker Compose

You have a folder of Kubernetes YAML — Deployments, Services, a ConfigMap — and no cluster to apply it to. kubernetes2simple converts it to a working Docker Compose setup in one command.

This is the direct reverse of [Kompose](https://kompose.io/), Compose Bridge, and Move2Kube: they turn Docker Compose into Kubernetes manifests; this turns Kubernetes manifests into Docker Compose. If your source is a Helm chart rather than raw YAML, see [how to run a Helm chart without a cluster](helm-chart-to-docker-compose.md).

## Convert it

```bash
curl -fsSL k2s.dekube.io/get | bash
docker compose up -d
```

The script detects that the directory holds raw Kubernetes manifests and converts them directly — no `helm template` step, no cluster. You get a `compose.yml`, a `Caddyfile`, and a `dekube.yaml`.

New here? [Getting started](index.md) covers install, the post-conversion checklist (hostnames, secrets, volume paths), and re-running — all of which apply here.

## What raw manifests map to

Each Kubernetes kind becomes its Compose equivalent: a Deployment or StatefulSet becomes a service, a Service becomes network aliases on the compose network, a PersistentVolumeClaim becomes a bind mount under `./data/`, an Ingress becomes a reverse-proxy block in the `Caddyfile`, and ConfigMaps and Secrets become mounted files or env vars. A `dekube.yaml` is written alongside so you can override any of it without editing the generated files.

## Want more control?

kubernetes2simple decides everything for you. If you need to pick which extensions to load, exclude services, or embed the conversion in CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the distribution for people who want full control. To see how each Kubernetes kind is handled, read [how the conversion works](https://helmfile2compose.dekube.io/docs/how-conversion-works/).

---

> *"He who translates the celestial rites into common tongue does not simplify — he merely redistributes the suffering across a wider audience."*
>
> — *Necronomicon, On the Democratization of Forbidden Knowledge (word of mouth)*
