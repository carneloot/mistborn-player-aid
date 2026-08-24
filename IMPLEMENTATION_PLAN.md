# Mistborn Companion App MVP — Implementation Plan

## Architecture decisions

- Build a Vite, React, and TypeScript single-page application. Do not use TanStack Start or add a server/backend.
- Use TanStack Router with its Vite plugin for file-based, typed client-side routes.
- Use mutually compatible, pinned Effect v4 release-candidate packages. Use the v4-compatible Effect Atom React package (`@effect/atom-react`); do not combine it with the older `@effect-atom/atom-react` package line.
- Use `@effect/platform-browser` and browser `localStorage` for persistence.
- Add Vitest and Testing Library for automated verification.
- Configure the production host with SPA-history fallback so direct route loads resolve to the client app.

## 1. Scaffold the SPA

Create the Vite application and install the routing, Effect, Effect Atom, browser persistence, and testing dependencies.

**Done when:** the SPA builds and serves, typed routes work, and direct navigation works with SPA fallback.

## 2. Define the durable session document

Create `src/domain/session.ts` with Effect `Schema` definitions for a small, versioned local document:

- `version`
- session metadata: player count, players, turn order, first player, active player, optional round
- confirmed setup selections: character assignments and three Missions
- persistent per-player Boxing totals
- current-turn scratchpad: coins, combat, unallocated Mission points, and checklist acknowledgements
- preferences: theme/dim level and rules bookmarks

Use branded IDs and constrained schemas:

- two to four unique players
- unique player colors and symbols
- distinct character assignments
- exactly three distinct Missions
- non-negative Boxing and scratchpad values

Explicitly exclude health, actual Training/Mission positions, Target holder, cards, metals, Market, combat assignments, and all other physical-game state.

**Done when:** valid documents decode successfully and malformed or obsolete local data safely becomes a recoverable no-saved-game state.

## 3. Implement state and persistence

Create a local-storage-backed session atom using Effect Atom and `BrowserKeyValueStore.layerLocalStorage`.

Implement named domain actions rather than component-local state:

- create, resume, and reset session
- reroll and confirm each setup category
- move to the previous or next turn
- set, add, and subtract Boxing
- change scratchpad values
- spend coins, with generated coins used before Boxings
- buy a Boxing for cost 2 through the same payment path
- acknowledge and clear turn checklist items
- change theme and rules bookmarks

Payment returns a typed receipt, for example `{ cost, paidTurnCoins, paidBoxings, remainingUnpaid }`.

Advancing a turn clears only scratchpad values and checklist acknowledgements, preserves all Boxing totals, advances the active player, and increments the round after a complete rotation.

Keep a bounded undo stack for Boxing and scratchpad changes, including turn transitions. Undo restores the applicable prior state and is clearly scoped to this local session.

**Done when:** every mutation persists immediately, reload restores the session, and advancing turns never clears Boxing totals.

## 4. Establish routes

Create TanStack Router file routes:

- `/` — launch, resume, and reset screen
- `/setup` — setup assistant
- `/play` — landscape table companion
- `/reference` — dedicated searchable rules reference

Use route guards/redirects:

- no active session redirects to `/`
- incomplete setup redirects to `/setup`
- confirmed setup can enter `/play`

Keep route state only for navigation/UI concerns such as reference query and selected tab; keep session data in the versioned Effect Atom document.

**Done when:** refreshing valid routes works without server rendering.

## 5. Build the setup assistant

Implement a sequential but non-blocking setup flow:

1. Enter two to four players, names, display colors, symbols, and clockwise order.
2. Randomize and preview first player, then show derived physical setup reminders: starting health order and, in three- or four-player games, the Target’s starting holder.
3. Randomize distinct character assignments.
4. Randomize three distinct Missions from the eight available cards.
5. Confirm each category independently, allowing rerolls before confirmation.
6. Display the physical-component setup checklist and begin play.

Use pure, tested randomizer functions with injected randomness to make tests deterministic.

**Done when:** no randomizer can return duplicates, and players can review each result before confirming it as setup information.

## 6. Implement the play screen

Create a CSS-grid, landscape-first layout for 1080 × 810 CSS pixels with no normal-play scrolling:

- **Turn strip:** player identity, color, symbol, active player, optional round, and large Previous/Next controls.
- **Turn aid:** permissive checklist and active player’s scratchpad.
- **Boxing tracker:** durable totals for every player and large active-player adjustment/spending controls.
- **Reference area:** Training baseline and compact searchable rules reference.

Follow the interaction requirements:

- at least 44 × 44 CSS-pixel targets, with larger turn and Boxing controls
- pair every color with a player name and optional symbol
- use text-labelled controls rather than icon-only controls
- provide dark, low-glare table mode and a dim/brightness control
- provide inline, non-blocking mutation feedback and undo

**Done when:** all core play functions are usable at the target iPad landscape size without vertical page scrolling.

## 7. Implement the Training baseline reference

Derive, rather than persist, the shared baseline expected Training position from completed turn cycles plus the active player’s start-of-turn advance.

Display:

- the explicit label “Baseline — no extra Train effects”
- expected Training position
- normal metal-Burn capacity
- unlocked character abilities
- reached and next Training rewards
- Continuous Atium status

Do not represent this value as a player’s actual Training position or use it to automate game rules.

**Done when:** tests cover progression across player counts and the UI clearly distinguishes this reference from the authoritative physical cube.

## 8. Add searchable rules content

Create structured static entries in `src/content/rules.ts` containing:

- title
- concise answer
- tags
- applicable player counts
- rulebook page numbers

Cover every MVP-required topic category. Filter Target entries out of two-player sessions, and persist rule bookmarks in preferences.

Before adding page-specific content, obtain an authorized rulebook/page-reference source. Do not invent page numbers or reproduce the rulebook wholesale.

**Done when:** search is instant, bookmarks persist, and two-player games do not display Target guidance.

## 9. Test and verify

Add tests for:

- Effect Schema decode, migration, and invalid-data fallback
- randomizer uniqueness and determinism
- payment priority, insufficient funds, Buy Boxing, and unlimited Boxing
- turn transitions, scratchpad clearing, and round cycling
- local persistence round-trips
- Training baseline derivation
- player-count rules filtering
- accessible controls and core component flows

Run type checking, unit/component tests, and a production build. Verify in a browser at 1080 × 810 CSS pixels using setup, active-turn, payment/undo, and rules-search states.

## Delivery order

1. Scaffold, schemas, persistence, and tests.
2. Launch screen and setup assistant.
3. Play shell, turn flow, Boxing, scratchpad, and undo.
4. Training and rules reference.
5. Accessibility/layout polish and acceptance verification.

## Content dependency

An approved rules source is required before publishing accurate page numbers and concise rule entries.
