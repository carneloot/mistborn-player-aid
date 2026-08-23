# Mistborn Player Aid

A local-first, single-iPad table companion for the competitive mode of _Mistborn: The Deckbuilding Game_.

It supports physical play rather than replacing it: the app provides setup randomizers, turn and rules references, a baseline Training-track reference, and unlimited per-player Boxing tracking. Physical cards, dials, tracks, tokens, and the Target standee remain the source of truth.

See [the MVP specification](MISTBORN_PLAYER_AID_SPEC.md) for the complete product scope, exclusions, and acceptance criteria.

## Deployment

The app deploys as a Cloudflare Worker with static assets at
`https://mistborn.carneloot.com` through [Alchemy v2](alchemy.run.ts).
After authenticating Alchemy with the Cloudflare account that owns the
`carneloot.com` zone, deploy with:

```sh
bun run deploy
```

Use `bun run dev:cloudflare` for Alchemy's Cloudflare-backed development mode.

## License

[MIT](LICENSE)
