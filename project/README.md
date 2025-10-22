# Portfolio Website

A minimalistic portfolio website built with Astro, designed for GitHub Pages deployment.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Git

### Installation

1. Clone the repository:
```sh
git clone https://github.com/yourusername/jainish1510.github.io.git
cd jainish1510.github.io
```

2. Install dependencies:
```sh
npm install
```

### Development

Start the local development server:
```sh
npm run dev
```

Your site will be available at `http://localhost:4321`

### Building for Production

Build the static site:
```sh
npm run build
```

The built files will be in the `dist/` directory.

Preview the production build locally:
```sh
npm run preview
```

## Deploying to GitHub Pages

### Initial Setup

1. **Create a GitHub repository** named `jainish1510.github.io` (replace with your GitHub username)

2. **Push your code to GitHub:**
```sh
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/jainish1510/jainish1510.github.io.git
git push -u origin main
```

3. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click on **Settings**
   - In the left sidebar, click **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

4. **Automatic Deployment:**
   - The GitHub Actions workflow is already configured in `.github/workflows/deploy.yml`
   - Every time you push to the `main` branch, your site will automatically build and deploy
   - Your site will be live at `https://jainish1510.github.io`

### Making Updates

After the initial setup, updating your site is simple:

1. Make your changes
2. Commit and push:
```sh
git add .
git commit -m "Update content"
git push
```

The site will automatically rebuild and deploy within a few minutes.

## Customization

Edit the following files to personalize your portfolio:

- `src/pages/index.astro` - Main content (name, bio, projects, contact links)
- `src/layouts/Layout.astro` - Site title and global styles
- `public/favicon.svg` - Site favicon

## Project Structure

```
/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   └── favicon.svg             # Site favicon
├── src/
│   ├── layouts/
│   │   └── Layout.astro        # Base HTML layout
│   └── pages/
│       └── index.astro         # Homepage
├── astro.config.mjs            # Astro configuration
└── package.json                # Project dependencies
```

## Commands

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |

## Technologies

- [Astro](https://astro.build) - Static site generator
- [GitHub Pages](https://pages.github.com) - Hosting
- [GitHub Actions](https://github.com/features/actions) - Automated deployment

## License

This project is open source and available under the MIT License.
