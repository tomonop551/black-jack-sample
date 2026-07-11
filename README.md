# Blackjack

A single-page Blackjack game built with [TanStack Start](https://tanstack.com/start).

## Why not a backend?

The entire game runs in the browser. There is no user authentication, no shared state, and no secrets, so a server would add latency and deployment complexity without adding value.

## Getting Started

This project uses [mise](https://mise.jdx.dev/) to manage tools and [Bun](https://bun.sh/) as the runtime and package manager.

```sh
mise install
mise run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Available tasks

| Task | Command | Description |
| --- | --- | --- |
| Dev server | `mise run dev` | Start the Vite development server |
| Build | `mise run build` | Build the app and run type checks |
| Test | `mise run test` | Run the Blackjack logic test suite |
| Preview | `mise run preview` | Preview the production build |

## Project structure

- `src/lib/blackjack.ts` — Pure game logic (deck, hands, scoring, actions)
- `src/lib/blackjack.test.ts` — Unit tests for the game rules
- `src/routes/index.tsx` — Blackjack UI page

## Rules

- Standard 52-card deck
- Aces count as 11 or 1 to avoid busting
- Dealer draws until reaching at least 17
- Blackjack on the initial deal ends the round immediately
