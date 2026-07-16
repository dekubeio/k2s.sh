---
description: "Run a Helm chart without a Kubernetes cluster. Convert any Helm chart to a Docker Compose file — a worked rustfs example for self-hosted and homelab setups."
---

# How to run a Helm chart without a cluster (convert it to Docker Compose)

kubernetes2simple converts a Helm chart for you: the chart stays the source of truth, the Compose file is a generated artifact. There's no cluster in the loop — dekube renders the chart with `helm template` and converts the output, so a Helm chart runs under plain Docker Compose.

New here? [Getting started](index.md) covers install, the post-conversion checklist, and re-running. This guide walks a full chart end to end. (For raw Kubernetes YAML rather than a chart — the direct [reverse of Kompose](kubernetes-to-docker-compose.md) — see the manifests guide.)

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

k2s renders the chart with `helm template release .` — the release name (`release`) prefixes every resource it creates — then converts the result. So the chart's `rustfs` deployment comes out as a `release-rustfs` service in `compose.yml`, next to a `release-rustfs-init-init-step` init job (the doubled name is the chart's own, copied verbatim) and a `release-rustfs-test-connection` probe carried over from the chart's Helm test hook, plus the `fix-permissions` and `caddy` helper services k2s adds on its own. Data and logs land in bind mounts at `./data/release-rustfs-data` and `./data/release-rustfs-logs`.

The Ingress *is* converted: k2s writes a `Caddyfile` with a `rustfs.localhost` block reverse-proxying to the console port inside the compose network:

```
rustfs.localhost {
	reverse_proxy release-rustfs-svc.default.svc.cluster.local:9001
}
```

Caddy publishes `80` and `443` on the host, so once `rustfs.localhost` resolves (most systems resolve `*.localhost` to `127.0.0.1` automatically; otherwise add a `/etc/hosts` entry), open `http://rustfs.localhost` and log in with the keys from `values.yaml` above.

## Want more control?

kubernetes2simple decides everything for you. If you need to choose which extensions to load, exclude specific services, or embed the conversion in CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the distribution for maintainers. For how providers, rewriters, and extensions fit together, see the [full dekube documentation](https://docs.dekube.io/).

## FAQ

### Can I run a Helm chart without a cluster?

Yes. kubernetes2simple renders the chart with helm template and converts the manifests to a Docker Compose file. No cluster or control plane is needed.

### Why won't my Helm chart render on its own?

Charts are not self-contained: many require values such as credentials or a hostname, and some default to multi-node modes. Supply a minimal values.yaml, as shown with rustfs above.

### Is this the opposite of Kompose?

Yes, in the opposite direction. This page covers Helm charts; for raw Kubernetes manifests, the manifests guide handles the same conversion. Either way the output is a Docker Compose file, not a cluster.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Can I run a Helm chart without a cluster?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. kubernetes2simple renders the chart with helm template and converts the manifests to a Docker Compose file. No cluster or control plane is needed." } },
    { "@type": "Question", "name": "Why won't my Helm chart render on its own?",
      "acceptedAnswer": { "@type": "Answer", "text": "Charts are not self-contained: many require values such as credentials or a hostname, and some default to multi-node modes. Supply a minimal values.yaml, as shown with rustfs above." } },
    { "@type": "Question", "name": "Is this the opposite of Kompose?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes, in the opposite direction. This page covers Helm charts; for raw Kubernetes manifests, the manifests guide handles the same conversion. Either way the output is a Docker Compose file, not a cluster." } }
  ]
}
</script>

---

> *"The scribe who copied the great hymns into the lesser tongue believed himself a translator. He was, in truth, the first heretic — for to render the sacred in the mundane is to declare that the mundane was always sufficient."*
>
> — *Necronomicon, On the Heresy of Helm Template (unconfirmed)*
