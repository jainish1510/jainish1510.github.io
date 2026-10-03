---
title: Why Decision-Making Under Uncertainty Is Hard
subtitle: Not knowing is cheap. Finding out is what costs.
date: 2026-07-12
status: published
category: essays
tags:
  - Decision Making
  - Probability
  - Reinforcement Learning
areas:
  - uncertainty
  - ai-systems
cover: /media/blog/why-decision-making-under-uncertainty-is-hard-cover.png
coverAlt: Generative cover artwork
demo: true
---

:::callout{kind="demo" title="Demonstration article"}
An essay generated to demonstrate long-form writing with an embedded simulation. Replace or edit it freely by changing its Markdown file.
:::

Most decisions we call "hard" are not hard because the options are complicated. They are hard because **we do not know enough, and finding out costs something.**

## Two kinds of not knowing

It helps to separate uncertainty into two kinds:

| Type | Also called | Example | Can more data reduce it? |
| --- | --- | --- | --- |
| Aleatoric | Irreducible noise | The outcome of a fair coin | No |
| Epistemic | Model uncertainty | Whether the coin is fair | Yes |

A good decision-maker treats these differently. Aleatoric uncertainty is something to *plan around*. Epistemic uncertainty is something to *spend effort reducing* — but only when reducing it changes what you would do.

## The expected-utility picture

The textbook answer is to choose the action with the highest expected utility:

$$
a^* = \arg\max_{a} \; \mathbb{E}_{s \sim p(s)}\big[\,U(a, s)\,\big]
$$

This is correct and nearly useless on its own, because it hides the hardest part inside $p(s)$. Where does the belief come from? How confident should we be in it? And what is it worth to improve it before acting?

## Exploration has a price

The cleanest setting where those questions become concrete is the **multi-armed bandit**. You face several options with unknown payoff rates. Every time you try the option that *looks* worse, you pay for information. Every time you don't, you risk being confidently wrong forever.

A greedy agent always picks the current best estimate. An $\varepsilon$-greedy agent explores at random a small fraction of the time. Try it — shrink the gap between the arms and watch greedy behaviour fall apart:

::component[Greedy vs. ε-greedy on a two-armed bandit]{name="uncertainty-sim"}

The result is counter-intuitive the first time you see it: **deliberately making "worse" choices produces better outcomes**, and the smaller the true difference between options, the more exploration matters.

## Why this is hard for people too

> We overweight the information we already have, because we have it.

Greedy behaviour is the default for humans as much as for algorithms. We revisit the restaurant we know, use the tool we already learned, and keep the research direction that worked last year. None of these are wrong — until the environment shifts, and the information that would have told us so was never collected.

## Practical heuristics

- **Name the uncertainty.** Is it noise, or ignorance? Only one of them yields to more research.
- **Price the information.** Ask what you would do differently with the answer. If nothing, don't pay for it.
- **Keep a small exploration budget.** A fixed fraction of time on options you currently think are worse is cheap insurance.
- **Prefer reversible actions under epistemic uncertainty.** They turn decisions into experiments.
