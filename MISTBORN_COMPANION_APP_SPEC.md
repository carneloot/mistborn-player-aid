# Mistborn Companion App — MVP specification

## Purpose

Provide a single-iPad, local-first table companion for the competitive mode of _Mistborn: The Deckbuilding Game_. The app reduces rulebook lookups, helps a group remember turn timing, and tracks unlimited Boxing tokens.

It is deliberately **not** a digital implementation of the game. Physical cards, dials, tokens, tracks, and standees remain the source of truth.

## Product constraints

- One shared device per table: iPad 9 in landscape orientation (1080 × 810 CSS pixels).
- Competitive games only: 2–4 players.
- Local storage only for the MVP.
- Touch-first, readable at table distance, low-glare, and usable without each player holding a phone.
- The app must not require users to enter card plays or physical game-state changes.

## Core screen

The play screen has four compact areas, with no normal-play scrolling:

1. **Turn strip** — player names/colors, turn order, active player, optional round number, and Previous/Next turn controls.
2. **Turn aid** — the current turn’s reminders and the active player’s optional scratchpad.
3. **Boxing tracker** — persistent, per-player Boxing counts and current player spending controls.
4. **Reference area** — Training/character reference and searchable rules reference.

The app never asks players to reproduce their board state. A player can ignore the app during routine card play and consult it only when useful.

## Information available in the app

### Session and setup information

The app can store and display:

- 2–4 player names and display colors.
- Clockwise turn order, first player, current active player, and an optional round counter.
- Chosen character for each player.
- The three selected Mission names.
- Game player count, used to present the correct competitive-mode rules.

The setup assistant provides independent randomizers for:

- **First player**: randomly choose one entered player, then use the displayed clockwise order to derive the physical starting-health bonuses and, in 3–4 player games, the Target's starting holder.
- **Characters**: randomly assign a different character to each player from the four character cards; never assign the same card twice.
- **Missions**: randomly select three different Mission cards from the eight available cards; never select the same card twice.

Each result must be visible before it is confirmed, with a reroll control for that category. Once confirmed, the app stores and displays the result as setup information only; players take the corresponding physical cards and components.

The setup assistant may display reminders for physical setup:

- Give each player their character’s four Training cards, six Funding cards, Training track/cube, eight metals, and a health dial.
- Set physical starting health: 36 for first player; +2 for second; +4 for third; +4 and one Boxing for fourth.
- Reveal six Market cards; select three Missions; place physical Mission cubes; draw five cards.
- In 3–4 player games, give the Target to the player last in turn order from the first player.

The user performs every listed setup action with the physical components.

### Turn-flow reference

The turn aid provides a non-enforced checklist:

1. Advance the physical Training cube one space.
2. In any order: play cards; Burn or Flare metals; use cards as metals; discard to refresh; use Ally/character abilities; advance Missions; buy cards or Boxings; attack Allies; attack players.
3. If applicable, resolve Target movement after damage is fully assigned.
4. Physically discard non-Allies and unplayed cards, then draw five cards.

The app may visually mark reminders as acknowledged for the current turn. It must not lock, validate, or sequence players’ actions, because many game actions are legal in any order.

### Boxing tracker

Boxings are the sole persistent in-game state tracked by the MVP.

For every player, show:

- Current Boxing count, with large adjustment controls for setup and corrections.
- No upper limit; physical Boxing tokens are limited but the game’s Boxing resource is unlimited.

For the active player’s scratchpad, provide:

- Generated coins for the current turn (optional manual `+`/`−` entry).
- Current Boxing count.
- A coin-spend action that accepts a purchase cost and automatically pays generated coins first, then spends as many Boxings as necessary for the remaining cost.
- A payment breakdown that makes the priority visible, for example: “Paid 4 turn coins + 1 Boxing.”
- **Buy Boxing**: pay 2 through the same generated-coins-then-Boxings priority, then add 1 Boxing.
- No separate action to cash a Boxing into a temporary coin total.
- Optional temporary combat and unallocated Mission-point counters.

Temporary scratchpad values clear when advancing the turn. Boxing counts do not clear. The app should offer undo for accidental Boxing or scratchpad actions.

### Current Training reference

Show one shared **baseline expected Training position** for the active turn. It starts at the physical setup position, then advances once per completed turn cycle; the current player’s start-of-turn advance is included. This answers, “if I advanced my cube correctly and received no extra Train effects, where should it be now?”

The reference can use that single baseline position to show:

- Current normal metal-Burn capacity.
- Character abilities unlocked at that position.
- Training rewards reached at that baseline and the next upcoming reward.
- Whether the player has reached Continuous Atium, which grants Atium whenever they advance on a Mission track.

Extra Train effects from cards or Missions are intentionally not entered or tracked. The player’s physical Training track and cube determine the actual position; if they have received extra advances, the physical cube will be ahead of the displayed baseline. The MVP must label this clearly as “baseline — no extra Train effects,” and must not treat it as saved gameplay state or use it to decide rules automatically.

### Competitive rules reference

The app includes a searchable, table-readable reference with short answers and corresponding rulebook page numbers. Topics include:

- Deckbuilding, cleanup, gaining cards, reshuffling, and eliminating cards.
- Burning, using Actions as metals, Flaring, refreshing, and Atium.
- Metals and keywords: Defender, Sense, Seek, Cloud, Riot, Soothe, Pull, and Push.
- Action and Ally anatomy, Savant abilities, and off-turn effects.
- Training-track rewards and character abilities.
- Mission movement, first-arrival rewards, track completion, highest/lowest ties, and Mission victory.
- Combat, Ally defense, Defenders, healing cap, and player elimination.
- Two-player combat rules.
- Three–four-player Target rules, including passing after health damage and removing Target when only two players remain.
- Market purchases, coins expiring at end of turn, and Boxings.
- The three competitive end-game conditions: complete all three Missions, be the last player alive, or play four Atium on _Confrontation_.

Relevant references should adapt to player count. For example, the Target explanation is displayed only for a three- or four-player game.

### Persistence

Persist locally after each change:

- Setup/session information.
- Per-player Boxing totals.
- Active player, optional round counter, and current scratchpad values.
- User preferences such as display theme and rules bookmarks.

On launch, offer Resume Game, New Game, and Reset Game (with confirmation). Display that saved information exists only on this iPad.

The saved document should be versioned so a future authenticated cloud-save feature can sync the same data model without redesigning the app.

## Information specifically excluded

The following remains physical and must not be entered, displayed as authoritative state, or automatically inferred by the MVP.

### Physical player and board state

- Player health and healing; use the health dials.
- Training-track position and cube; the optional Training view is only a reference.
- Mission-track positions, rewards claimed, first-arrival status, completion order, and Mission victory; use the Mission cards and cubes.
- Target holder and Target passing; use the Target standee.
- Metal-token availability, metal Burns, Flared metals, refreshed metals, and spent Atium; use the physical metal tokens.
- Player hands, decks, discard piles, cards in play, eliminated pile, and draw/shuffle status.
- Market row, Market deck, purchases, replacements, and eliminated Market cards.
- Allies in play, Ally defense, damage assigned to Allies, and off-turn effects.
- Combat assignment, player damage, Clouds, Defenders, and player elimination.
- Coins, combat, and Mission points as durable state. The scratchpad can optionally hold turn-only totals, but physical cards and player decisions remain authoritative.

### Out-of-scope game modes and automation

- Solo and co-op mode, Lord Ruler health, Dominance, Edicts, Adversaries, shields, and Lord Ruler deck state.
- Card scanning, card database/deck construction, hand tracking, or automatic card-effect resolution.
- Enforcing legal moves, validating resource availability, calculating card combinations, or determining winners.
- Multiplayer phone participation, user accounts, network sync, cloud backup, sharing, or remote play.
- Statistics, match history, strategy recommendations, and game logging beyond the optional local session metadata.

## Interaction and accessibility requirements

- Landscape layout designed first for the iPad 9; no essential content below the fold.
- Minimum 44 × 44 CSS-pixel targets; larger controls for Boxing and turn advancement.
- Color is always paired with player name and an optional symbol for color-blind accessibility.
- No hover-only information, required drag gestures, or tiny icon-only controls.
- Dark, low-glare “table mode” with high-contrast text; provide an optional brightness/dim control.
- Use quick, non-blocking confirmations for Boxing changes and turn transitions; destructive reset requires explicit confirmation.

## Future cloud-save compatibility

Do not add a backend in the MVP. Keep the local state as a small versioned document containing only session metadata, Boxing totals, turn/scratchpad state, and preferences. A future cloud feature may add sign-in, backup, share links, and conflict handling around that document without adding tracked physical game state.

## MVP acceptance criteria

- A group can set up a 2-, 3-, or 4-player competitive game using the setup reminders.
- The group can independently randomize and confirm a first player, distinct character assignments, and three distinct Mission cards before taking the corresponding physical components.
- During play, the group can advance the active-player indicator and use the turn checklist without recording card play or physical-board state.
- Each player can adjust and buy unlimited Boxings; a coin spend always uses current-turn coins before automatically spending Boxings, and Boxing counts survive an app restart and never clear at end of turn.
- The active player can use and clear an optional coin/combat/Mission-point scratchpad without affecting physical game components.
- The app shows one shared Training-track position expected for the active turn when no extra Train effects were used, while clearly leaving every physical Training cube authoritative.
- Players can quickly find competitive rules and receive the player-count-appropriate Target guidance.
- No health, Mission, Target, Training, metal, card, Market, Ally, or combat state is presented as digitally authoritative.
