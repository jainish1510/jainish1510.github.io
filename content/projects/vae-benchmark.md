---
title: VAE Benchmark
summary: A controlled benchmark of variational autoencoder variants exploring the trade-off between reconstruction quality and latent-space smoothness.
category: ml
status: active
featured: true
placeholder: true
cover: /media/projects/vae-benchmark-cover.png
coverAlt: Generative cover artwork
skills:
  - python
  - pytorch
areas:
  - machine-learning
  - generative-models
order: 1
---

# Problem

VAE papers report results under different architectures, datasets and training budgets, which makes the effect of each design choice hard to isolate.

# Why I built it

Understand *why* reconstruction quality and latent smoothness pull against each other, by changing one variable at a time.

# How it works

A shared training harness runs each variant (β-VAE and others) with identical encoders, data splits and seeds, logging reconstruction error, KL and latent-traversal metrics.

# Results

[Placeholder] Add benchmark tables and figures once experiments are complete.

# Lessons

[Placeholder]
