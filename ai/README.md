# ai (cossell)

**AI-assisted code scoring.** `cossell` analyzes a team's source repository and
produces qualitative scores and commentary that feed into event scoring.

## What it does

`cossell.py` loads a git repository, splits and summarizes the code, and uses an LLM
to produce:

- a **code summary** and **commentary**, and
- numeric scores (1–10) for **security**, **code smells**, and **complexity**.

It uses **LangChain** with **Anthropic** and/or **OpenAI** chat models, plus
sentence-transformer embeddings and clustering (`scikit-learn`, Chroma) to handle
larger repositories.

The container image is built on the AWS CodeBuild Amazon Linux 2 base and also bundles
companion analysis tools used elsewhere in the scoring pipeline: **Infracost**,
**Snyk**, **SCC** (code counting), and **Unlighthouse**.

## Usage

```bash
# directly
python3 cossell.py <path-to-repo> [branch]      # branch defaults to "main"
```

It expects LLM credentials in the environment:

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic chat model |
| `OPENAI_API_KEY` | OpenAI chat model / embeddings |

## Container

```bash
docker build -t stackref-cossell .
docker run --rm \
  -e ANTHROPIC_API_KEY=... -e OPENAI_API_KEY=... \
  -v "$PWD/some-team-repo":/work \
  stackref-cossell cossell.py /work main
```

In production this image ran inside the isolated `stackref-analysis-codescans`
account (see [`infra/`](../infra/)) and was invoked as part of the
[`kickoff`](../services/kickoff/README.md) scoring flow.

## Notes

- The LangChain/model library versions here are from the original project
  (`requirements.txt`); when adapting, consider updating to current LLM SDKs and the
  latest models.
