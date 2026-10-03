---
title: Notes on Agentic AI Systems
subtitle: Planning, tools, memory — and why evaluation is the bottleneck.
status: draft
category: research-notes
tags:
  - Agentic AI
  - LLMs
areas:
  - ai-systems
cover: /media/blog/notes-on-agentic-ai-systems-cover.png
coverAlt: Generative cover artwork
demo: true
---

:::callout{kind="demo" title="Draft"}
This is an unpublished draft that demonstrates the draft workflow. Set `status: draft` in its front matter to keep a post unpublished.
:::

## Outline

- What makes an AI system "agentic" — planning, tool use, memory, feedback
- Evaluation is the bottleneck
- Notes from building retrieval-augmented assistants

## Notes

Tool calls are just functions with typed inputs. The hard part is deciding *when* to call them.
