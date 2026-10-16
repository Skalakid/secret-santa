# Merry Little Draw

A mobile-first Secret Santa site in English and Polish. Supports 2–50 people.

Add names individually or paste a comma-separated list, then start the draw.
Pass the phone to the named person, wait five seconds, and let that person reveal
their recipient. After they remember the name, Next clears the reveal and starts
the next handoff. The last person finishes the draw without a pairing summary.

Every recipient appears exactly once, and nobody draws themselves. Draws use
cryptographic browser randomness and uniformly sample valid derangements.

Pending pairings stay in this tab's session storage. A pairing is removed before
it is shown. Refreshing or leaving a revealed screen skips forward: that reveal
cannot be recovered. The app creates no browser history entries for draw steps.
Closing the tab ends the session. Keep one tab open and pass the same device.
This is privacy for a shared-phone party flow, not protection against someone
inspecting browser developer tools or taking screenshots.

## Local preview

Use Node.js 24.15+ (24.x), or another supported version listed in `package.json`.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The site uses React with Vite; no backend is required.
Google Fonts enhance the typography; system fonts are used if unavailable.

## Build and test

```sh
npm test
npm run build
npm run preview
```

`npm run build` produces a static site in `dist/`. Deploy that folder to a static
host. `npm run preview` serves the production build on the same local port, so
stop the development server before starting it.

The tests cover draw uniqueness, name validation, countdowns, translations,
session restoration, reveal privacy, confetti lifecycle, and reduced motion.
React components and hooks live in `src/`; the styles and drawing algorithm are
preserved from the original implementation.

## Layout and motion

The card and primary action keep the same dimensions throughout the draw.
The participant list scrolls inside its reserved area, and validation messages
have their own space. Changes use short ease-out transitions; reduced-motion
preferences disable them. Moving on removes the previous reveal immediately,
without keeping an outgoing copy for animation.
