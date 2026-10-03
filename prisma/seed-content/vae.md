:::callout{kind="demo" title="Demonstration article"}
Generated to demonstrate equations, interactive figures, charts, images and video embeds. The mathematics is standard; the training curves below are illustrative, not measured results.
:::

Variational autoencoders are usually introduced with a wall of probability. I find them easier to understand the other way around: start from experiments, notice what breaks, and let the math explain *why* it breaks.

## An autoencoder with a probabilistic bottleneck

A plain autoencoder compresses $x$ into a code $z = f(x)$ and reconstructs $\hat{x} = g(z)$. It is good at reconstruction and bad at *generation*: pick a random $z$ and the decoder produces noise, because nothing forced the codes to fill the space smoothly.

A VAE changes one thing. The encoder outputs a **distribution** $q_\phi(z \mid x) = \mathcal{N}(\mu_\phi(x), \sigma^2_\phi(x))$ instead of a point, and training pulls that distribution towards a simple prior $p(z) = \mathcal{N}(0, I)$.

## The objective

We maximise the evidence lower bound (ELBO):

$$
\mathcal{L}(\theta, \phi; x) = \underbrace{\mathbb{E}_{q_\phi(z \mid x)}\left[\log p_\theta(x \mid z)\right]}_{\text{reconstruction}} - \underbrace{D_{\mathrm{KL}}\left(q_\phi(z \mid x) \,\|\, p(z)\right)}_{\text{regularisation}}
$$

For a diagonal Gaussian posterior and a standard normal prior, the KL term has a closed form per latent dimension:

$$
D_{\mathrm{KL}} = \frac{1}{2} \sum_{j=1}^{d} \left( \sigma_j^2 + \mu_j^2 - 1 - \log \sigma_j^2 \right)
$$

Drag the sliders to see what that term is paying for — it is zero only when the posterior *is* the prior.

::component[KL divergence between a posterior and the prior]{name="gaussian-explorer" mu="1.2" sigma="0.5"}

## The reparameterisation trick

Sampling is not differentiable, so we rewrite it. Instead of $z \sim \mathcal{N}(\mu, \sigma^2)$ we draw $\varepsilon \sim \mathcal{N}(0, I)$ and compute $z = \mu + \sigma \odot \varepsilon$. Gradients now flow through $\mu$ and $\sigma$.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class VAE(nn.Module):
    def __init__(self, d_in=784, d_hidden=400, d_latent=16):
        super().__init__()
        self.enc = nn.Linear(d_in, d_hidden)
        self.mu = nn.Linear(d_hidden, d_latent)
        self.logvar = nn.Linear(d_hidden, d_latent)
        self.dec = nn.Sequential(nn.Linear(d_latent, d_hidden), nn.ReLU(), nn.Linear(d_hidden, d_in))

    def forward(self, x):
        h = F.relu(self.enc(x))
        mu, logvar = self.mu(h), self.logvar(h)
        z = mu + torch.exp(0.5 * logvar) * torch.randn_like(mu)  # reparameterisation
        return self.dec(z), mu, logvar

def loss_fn(x_hat, x, mu, logvar, beta=1.0):
    recon = F.binary_cross_entropy_with_logits(x_hat, x, reduction="sum")
    kl = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())
    return recon + beta * kl
```

## Experiment: the β trade-off

Scaling the KL term by $\beta$ exposes the central tension. Low $\beta$ gives sharp reconstructions and a lumpy latent space; high $\beta$ gives a smooth, well-organised latent space and blurry samples.

::component[Illustrative training curves — not measured]{name="line-chart" series="182,141,120,109,103,99,97,96|188,152,134,125,121,119,118,118" legend="β = 1 · validation loss|β = 4 · validation loss" labels="1,5,10,15,20,25,30,35" y="loss"}

| β | Reconstruction | Latent smoothness | Samples |
| --- | --- | --- | --- |
| 0.1 | Sharp | Fragmented | Often invalid |
| 1.0 | Good | Reasonable | Plausible, soft |
| 4.0 | Blurry | Very smooth | Consistent, blurry |

![A grid of latent space traversals, generated as a placeholder figure](/media/blog/vae-latent-grid.png "Figure 1 — placeholder figure illustrating a 2-D latent traversal.")

## Quality versus smoothness

That table is the whole story in miniature: **reconstruction quality and latent smoothness pull in opposite directions**, and $\beta$ chooses a point on the frontier. Much of the VAE literature since — β-VAE, VQ-VAE, hierarchical VAEs, diffusion decoders — can be read as attempts to escape that trade-off rather than merely pick a point on it.

## Further watching

If neural networks themselves still feel abstract, this is the clearest visual introduction I know:

::youtube[3Blue1Brown — But what is a neural network?]{id="aircAruvnKk"}

## Takeaways

- The KL term is not a nuisance; it is what makes the latent space *usable*.
- The reparameterisation trick is just moving randomness to an input.
- Every VAE design decision is a position on the quality–smoothness frontier.
