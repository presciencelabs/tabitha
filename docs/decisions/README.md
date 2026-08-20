# Architecture Decision Records

This folder captures notable architecture and process decisions made in the TaBiThA monorepo — the trade-offs considered and why we landed where we did, so the reasoning survives past the conversation (or PR) that produced it.

## When to add one

An entry generally makes sense when the "why" isn't obvious from the code alone: choosing between two viable approaches, deferring a capability on purpose, or a convention that a future contributor might otherwise second-guess or accidentally reverse.

## Format

Each entry is `NNNN-short-title.md`, numbered sequentially in the order it was written (not necessarily chronological — older decisions can be backfilled). Entries should generally include:

- **Status** — proposed, accepted, superseded (link to the superseding entry), or deprecated
- **Context** — what prompted the decision
- **Decision** — what was chosen
- **Alternatives considered** — what else was on the table and why it lost
- **Consequences** — what this costs us, and what would make us revisit it
