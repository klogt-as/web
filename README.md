# Klogt AS - Website

A modern, interactive landing page for Klogt AS featuring advanced 3D animations, smooth scrolling, and dynamic content sections.

**Klogt AS** - _Ideas flow. We make them concrete._

## ✨ Features

- 🎨 **3D WebGL Animations** - Interactive liquid mercury blob using Three.js
- 🔄 **Smooth Scrolling** - Lenis-powered smooth scroll experience
- 📜 **Scroll-Driven Animations** - Dynamic content reveals based on scroll position
- 🎭 **Sticky Scroll Scenes** - Immersive scroll-based storytelling
- 📱 **Fully Responsive** - Optimized for mobile and desktop experiences
- ⚡ **Performance Optimized** - Built with Astro for optimal loading times
- 🎬 **Loading Animation** - Polished loading overlay with smooth transitions
- 🌊 **Interactive Hero Sections** - Multiple animated hero sections with scroll transitions

## 🛠️ Technology Stack

- **[Astro](https://astro.build)** (v5.16.4) - Static site generator and framework
- **[React](https://react.dev)** (v19.2.1) - UI components
- **[Three.js](https://threejs.org)** - 3D graphics
  - `@react-three/fiber` - React renderer for Three.js
  - `@react-three/drei` - Useful helpers for R3F
- **[@14islands/r3f-scroll-rig](https://github.com/14islands/r3f-scroll-rig)** - Scroll-based 3D animations
- **[Lenis](https://github.com/studio-freight/lenis)** - Smooth scrolling library
- **[Motion](https://motion.dev)** - Animation library
- **TypeScript** - Type safety

## 📁 Project Structure

```text
├── public/
│   ├── favicon.svg
│   └── fonts/
│       ├── atkinson-bold.woff
│       └── atkinson-regular.woff
├── src/
│   ├── assets/
│   │   ├── logo_klogt.png
│   │   └── logo_klogt.svg
│   ├── components/
│   │   ├── AnimatedHeroSection.tsx    # Scroll-animated hero wrapper
│   │   ├── BaseHead.astro             # SEO and meta tags
│   │   ├── LandingPage.tsx            # Main landing page component
│   │   ├── LiquidButton.tsx           # Interactive button component
│   │   ├── LiquidMercuryBlob.tsx      # 3D WebGL liquid animation
│   │   ├── LoadingOverlay.tsx         # Initial loading screen
│   │   ├── Logo.tsx                   # Company logo component
│   │   └── ScrollIndicator.tsx        # Scroll down indicator
│   ├── hooks/
│   │   ├── useIsMobile.ts             # Mobile detection hook
│   │   └── useScrollProgress.ts       # Scroll progress tracking
│   ├── pages/
│   │   └── index.astro                # Entry point
│   ├── styles/
│   │   └── global.css                 # Global styles
│   └── consts.ts                      # Site constants
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

This project uses **pnpm** as the package manager. If you don't have it installed:

```sh
npm install -g pnpm
```

### Installation

1. Clone the repository:

```sh
git clone git@github.com:klogt-as/web.git
cd web
```

2. Install dependencies:

```sh
pnpm install
```

3. Start the development server:

```sh
pnpm dev
```

The site will be available at `http://localhost:4321`

## 🧞 Commands

All commands are run from the root of the project:

| Command          | Action                                           |
| :--------------- | :----------------------------------------------- |
| `pnpm install`   | Installs dependencies                            |
| `pnpm dev`       | Starts local dev server at `localhost:4321`      |
| `pnpm build`     | Build your production site to `./dist/`          |
| `pnpm preview`   | Preview your build locally, before deploying     |
| `pnpm astro ...` | Run CLI commands like `astro add`, `astro check` |

## 🎯 Key Components

### LandingPage.tsx

The main component orchestrating all sections:

- **StickySection**: Hero section with 3D blob and animated text
- **ExperienceSection**: Showcases client experience with diagonal scrolling text
- **ContactSection**: Contact information and footer

### LiquidMercuryBlob.tsx

3D WebGL component creating an interactive liquid metal effect that responds to scroll position. Uses custom shaders and Three.js for realistic material rendering.

### AnimatedHeroSection.tsx

Wrapper component that handles scroll-based visibility and fade transitions for hero content sections.

### LoadingOverlay.tsx

Initial loading screen with animated slide-up transition, ensuring smooth entry to the site.

## 🎨 Customization

Site constants can be modified in `src/consts.ts`:

```typescript
export const SITE_TITLE = "Klogt AS - Ideer flyter. Vi gjør dem konkrete.";
export const SITE_DESCRIPTION = "Med riktig teknologi og erfaring...";
```

## 📦 Building for Production

```sh
pnpm build
```

The built files will be in the `./dist/` directory, ready to be deployed to any static hosting service.

## 🌐 Deployment

This Astro site can be deployed to:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- Any static hosting service

Refer to [Astro's deployment documentation](https://docs.astro.build/en/guides/deploy/) for detailed instructions.

## 📄 License

Copyright © 2025 Klogt AS

---

Built with [Astro](https://astro.build) 🚀
