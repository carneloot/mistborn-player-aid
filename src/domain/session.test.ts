import { describe, expect, it } from "vitest"
import { baselineTraining, createSession, paymentFor } from "./session"

const session = () => createSession([
  { name: "Ari", color: "ember", symbol: "◆" },
  { name: "Bea", color: "cobalt", symbol: "●" },
])

describe("paymentFor", () => {
  it("uses turn coins before Boxings", () => {
    expect(paymentFor(4, 3, 5)).toEqual({ paidTurnCoins: 4, paidBoxings: 1, remainingUnpaid: 0 })
  })

  it("reports an unaffordable remainder", () => {
    expect(paymentFor(1, 1, 4)).toEqual({ paidTurnCoins: 1, paidBoxings: 1, remainingUnpaid: 2 })
  })
})

describe("baselineTraining", () => {
  it("includes the current player's start-of-turn advance", () => {
    expect(baselineTraining(session())).toBe(1)
    expect(baselineTraining({ ...session(), completedTurns: 2 })).toBe(2)
  })
})
