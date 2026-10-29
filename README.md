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

Package-level overview; see `AGENTS.md` for the file-by-file map.

- `src/lib/blackjack/` — Game rules as pure functions (deck, scoring, round transitions) with co-located unit tests
- `src/lib/profile/` — Persistent player profile: payout and rebuy math, `localStorage` storage, and React Query hooks
- `src/components/` — Shared UI pieces (card hand display, bet controls)
- `src/routes/` — File-based routes; `src/routes/index.tsx` holds the ephemeral round state and wires the table UI to the libraries above

## Rules

- Cards are dealt from the shoe — currently a single standard 52-card deck, freshly shuffled every round
- Aces count as 11 or 1, whichever avoids busting
- The dealer draws until reaching at least 17 and stands on all 17s, soft hands included
- A natural 21 in the first two cards ends the round immediately, for player or dealer
- A natural blackjack pays 3:2 with the fraction floored so chips stay whole numbers; any other win pays 1:1; a push returns the bet
- You start with 1,000 chips and bet from 10 up to your whole stack; once your bankroll drops below the 10-chip minimum you can rebuy for a fresh 1,000 chips and keep your stats
