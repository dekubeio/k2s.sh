# Local Kubernetes development with Docker Compose

This guide is for developers who need to run a Kubernetes stack locally but don't maintain it themselves — someone else owns the helmfile, and you just need the thing running on your laptop.

If that's you: **send the [helmfile2compose getting started](https://helmfile2compose.dekube.io/docs/getting-started/) to whoever maintains the helmfile.** They should set up a proper `dekube.yaml` for the project. A maintainer who understands the stack will have a much easier time tuning the conversion than you will fighting it blind. kubernetes2simple can get you started, but edge cases are inevitable on a real stack — and debugging them requires knowing what the Helm charts actually do.

That said, here's how to get going right now.

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

This is where the Compose approach genuinely shines. You can mount local code into a Kubernetes pod too — but it means hostPath volumes, Helm value overrides, conditionals in templates, and a helmfile that now has to care about your laptop. With Compose, it's one override file that doesn't touch anything else.

Create a `compose.override.yml` alongside the generated `compose.yml`:

```yaml
# compose.override.yml — yours, never overwritten
services:
  myapp:
    volumes:
      - ./src:/app/src
    environment:
      DEBUG: "true"
```

Docker Compose merges both files automatically. Your code runs inside the full stack — same databases, same queues, same reverse proxy — with changes reflected immediately. When you re-run the conversion, `compose.override.yml` is yours and never overwritten.

## Re-generating after changes

When your Helm charts or manifests change, re-run the script:

```bash
./kubernetes2simple.sh --env dev
docker compose up -d
```

`dekube.yaml` is preserved. Only `compose.yml` and `Caddyfile` are regenerated.

## Want more control?

Want to understand what the script did with each part of your Kubernetes files? [How the conversion works](https://helmfile2compose.dekube.io/docs/how-conversion-works/) breaks it down step by step.

kubernetes2simple detects, downloads, and converts — you don't choose. If you need to pick extensions, exclude services, or embed the conversion in CI, [helmfile2compose](https://helmfile2compose.dekube.io/docs/getting-started/) is the power-user distribution.

---

> *"And in the lesser realms they built a mirror of the temple — smaller, simpler, and mercifully free of the admission controller that had plagued the original congregation."*
>
> — *Necronomicon, On the Virtues of Downscaling (probably⁴)*
