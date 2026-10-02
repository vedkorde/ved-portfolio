# Ved Korde — Portfolio

A React (Vite) portfolio: scroll-reactive digital-rain background, boot intro, glitch name animation,
pinned horizontal project scroll, CTF leaderboard visual, light/dark theme.

## What is in this folder

| Path | What it is |
|------|------------|
| `src/data.js` | **All your content** (name, bio, skills, projects, timeline, CTF stats, links). Edit this first. |
| `src/App.jsx` | All React components and animations |
| `src/styles.css` | All styling and the colour palette (see the `:root` variables at the top) |
| `public/Ved_Korde_Resume.pdf` | Resume used by the "Download resume" buttons |
| `dist/` | Ready-to-deploy build (upload this folder to Netlify, Vercel, GitHub Pages, etc.) |
| `standalone/index.html` | Single-file version. Double-click to open, no install needed (needs internet for React + fonts) |

## Run it locally

```bash
npm install
npm run dev        # opens http://localhost:5173
```

## Build for production

```bash
npm run build      # creates / refreshes the dist/ folder
npm run preview    # test the production build locally
```

## Deploy

- **Vercel / Netlify:** import the repo (build command `npm run build`, output folder `dist`), or drag the `dist/` folder into Netlify Drop.
- **GitHub Pages:** push the contents of `dist/` to a `gh-pages` branch (the build uses relative paths, so it works from any sub-folder).

## Things to update

- Project buttons currently point to `https://github.com/vedkorde`. Replace the `link` of each project in `src/data.js` with the repo or live URL.
- Phone number is intentionally not shown on the page.
- To change colours, edit the `--a1`, `--a2`, `--a3` and `--bg` variables in `src/styles.css`.
