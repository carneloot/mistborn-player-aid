import { Stack } from "alchemy"
import * as Cloudflare from "alchemy/Cloudflare"
import * as Effect from "effect/Effect"

export default Stack(
  "mistborn-player-aid",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const site = yield* Cloudflare.Website.Vite("MistbornPlayerAid", {
      domain: "mistborn.carneloot.com",
      workersDev: false,
      assets: {
        notFoundHandling: "single-page-application",
      },
    })

    return { url: site.url }
  }),
)
