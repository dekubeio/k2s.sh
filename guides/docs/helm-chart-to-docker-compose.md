---
description: "Run a Helm chart without a Kubernetes cluster. Convert any Helm chart to a Docker Compose file — a worked rustfs example for self-hosted and homelab setups."
---

# How to run a Helm chart without a cluster (convert it to Docker Compose)

For the record: you should probably just run Kubernetes. On Linux, k3s is [one script](https://gist.github.com/baptisterajaut/089d4fad018129c431b675d9ef76e9d1). On macOS or Windows, Docker Desktop has an "Enable Kubernetes" checkbox. `helm install` and you're done.

But you're here, so one of these is true:

- **You don't want to learn Kubernetes.** You want to add an app to your NAS or VPS the same way you added Plex or Immich — paste a compose file, click deploy, move on. I'm not saying I agree, but this is the reason this project exists.
- **You can't be root.** Corporate policy says Podman rootless, no sudo, no systemd. k3s needs root. Compose is what you've got.
- **Your platform only speaks Compose.** Your Synology, Unraid, or hosting panel has a "paste your compose.yml here" box and nothing else.

kubernetes2simple converts the chart for you. The Helm chart stays the source of truth, the Compose file is a generated artifact.

There's no cluster in the loop here: dekube renders the chart with `helm template` and converts the output, so a Helm chart runs under plain Docker Compose. (For raw Kubernetes YAML rather than a chart — the direct [reverse of Kompose](https://k2s.dekube.io/guides/kubernetes-to-docker-compose/) — see the manifests guide.)

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

## A worked example: rustfs on your homelab

[rustfs](https://rustfs.com) is an S3-compatible object store — think a lighter MinIO. It ships only a Helm chart, and it's in the TrueNAS app catalogue, so it's a realistic homelab target.

A Helm chart is **not self-contained**: rustfs refuses to render without credentials, and defaults to a 4-node distributed cluster. For a homelab you want one node and your own keys. Grab the chart and give it a minimal `values.yaml`:

```bash
helm repo add rustfs https://charts.rustfs.com
helm pull rustfs/rustfs --version 0.8.0 --untar
cd rustfs
```

Edit `values.yaml` in place (k2s renders the chart with the chart's own `values.yaml`, not a custom `-f`), setting single-node mode, your keys, and the Ingress host. Note that rustfs's Ingress takes a `hosts:` list, not a single `host:` string:

```yaml
mode:
  standalone: { enabled: true }
  distributed: { enabled: false }
replicaCount: 1
secret:
  rustfs:
    access_key: homelab
    secret_key: change-me-please
ingress:
  enabled: true
  className: nginx
  hosts:
    - host: rustfs.localhost
      paths:
        - path: /
          pathType: Prefix
```

Convert and run:

```bash
curl -fsSL k2s.dekube.io/get | bash
docker compose up -d
```

k2s renders the chart with `helm template release .` — the release name (`release`) prefixes every resource it creates — then converts the result. So the chart's `rustfs` deployment comes out as a `release-rustfs` service in `compose.yml`, next to a `release-rustfs-init-init-step` init job and a `release-rustfs-test-connection` probe carried over from the chart's Helm test hook, plus the `fix-permissions` and `caddy` helper services k2s adds on its own. Data and logs land in bind mounts at `./data/release-rustfs-data` and `./data/release-rustfs-logs`.

The Ingress *is* converted: k2s writes a `Caddyfile` with a `rustfs.localhost` block reverse-proxying to the console port inside the compose network:

```
rustfs.localhost {
	reverse_proxy release-rustfs-svc.default.svc.cluster.local:9001
}
```

Caddy publishes `80` and `443` on the host, so once `rustfs.localhost` resolves (most systems resolve `*.localhost` to `127.0.0.1` automatically; otherwise add a `/etc/hosts` entry), open `http://rustfs.localhost` and log in with the keys from `values.yaml` above.

## Things to check after conversion

**Hostnames** — Your app's domain names end up in the Caddy reverse proxy config. Make sure they resolve locally (`*.localhost` works on most systems, or add `/etc/hosts` entries) — for the rustfs example above, that's the `rustfs.localhost` block in `Caddyfile`.

**Secrets** — If a secret value wasn't found during conversion, env vars that reference it are skipped (with a warning). Add missing values in `dekube.yaml` under `overrides:`, not in `compose.yml`.

**Volume paths** — Persistent storage becomes bind mounts under `./data/`. Customize in `dekube.yaml` — the script reads it but never overwrites it.

## Re-running

The script is safe to re-run. `compose.yml` and `Caddyfile` are regenerated. `dekube.yaml` is preserved — your volume paths, excludes, and overrides survive.

```bash
# After chart changes, just re-run
./k2s.sh --env dev
docker compose up -d
```

## Want more control?

Want to understand what the script did with each part of your chart? [How the conversion works](https://helmfile2compose.dekube.io/docs/how-conversion-works/) breaks it down step by step.

kubernetes2simple decides everything for you. If you need to choose which extensions to load, exclude specific services, or embed the conversion in CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the distribution for maintainers. For how providers, rewriters, and extensions fit together, see the [full dekube documentation](https://docs.dekube.io/).

## FAQ

### Can I run a Helm chart without Kubernetes?

Yes. kubernetes2simple renders the chart with helm template and converts the manifests to a Docker Compose file. No cluster or control plane is needed.

### Why won't my Helm chart render on its own?

Charts are not self-contained: many require values such as credentials or a hostname, and some default to multi-node modes. Supply a minimal values.yaml, as shown with rustfs above.

### Is this the opposite of Kompose?

Yes. Kompose, Compose Bridge, and Move2Kube convert Docker Compose to Kubernetes. dekube converts the other way — Helm charts and Kubernetes manifests to Docker Compose.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Can I run a Helm chart without Kubernetes?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. kubernetes2simple renders the chart with helm template and converts the manifests to a Docker Compose file. No cluster or control plane is needed." } },
    { "@type": "Question", "name": "Why won't my Helm chart render on its own?",
      "acceptedAnswer": { "@type": "Answer", "text": "Charts are not self-contained: many require values such as credentials or a hostname, and some default to multi-node modes. Supply a minimal values.yaml, as shown with rustfs above." } },
    { "@type": "Question", "name": "Is this the opposite of Kompose?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Kompose, Compose Bridge, and Move2Kube convert Docker Compose to Kubernetes. dekube converts the other way — Helm charts and Kubernetes manifests to Docker Compose." } }
  ]
}
</script>

---

> *"The scribe who copied the great hymns into the lesser tongue believed himself a translator. He was, in truth, the first heretic — for to render the sacred in the mundane is to declare that the mundane was always sufficient."*
>
> — *Necronomicon, On the Heresy of Helm Template (unconfirmed)*
