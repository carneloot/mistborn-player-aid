import { useAtomSet, useAtomValue } from "@effect/atom-react"
import { Link, Outlet, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  baselineTraining,
  characters,
  createSession,
  missions,
  paymentFor,
  playerColors,
  type PlayerColor,
  type Session,
} from "./domain/session"
import { sessionAtom, undoAtom, updateSession } from "./state/session"

const checklist = [
  "Advance the physical Training cube one space.",
  "Play cards, Burn or Flare metals, use abilities, buy, and attack in any legal order.",
  "Resolve Target movement after all damage is assigned, if applicable.",
  "Discard non-Allies and unplayed cards, then draw five cards.",
]

const shuffle = <T,>(values: readonly T[]) => [...values].sort(() => Math.random() - 0.5)

function useSession() {
  const session = useAtomValue(sessionAtom)
  const setSession = useAtomSet(sessionAtom)
  const undo = useAtomValue(undoAtom)
  const setUndo = useAtomSet(undoAtom)
  const change = (fn: (current: Session) => Session) => {
    const next = updateSession(session, fn, undo)
    setSession(next.session)
    setUndo(next.undo)
  }
  const undoLast = () => {
    const previous = undo.at(-1)
    if (previous !== undefined) {
      setSession(previous)
      setUndo(undo.slice(0, -1))
    }
  }
  return { session, setSession, setUndo, change, undoLast, canUndo: undo.length > 0 }
}

export function RootLayout() {
  return <Outlet />
}

export function LaunchPage() {
  const { session, setSession, setUndo } = useSession()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const navigate = useNavigate()
  const resume = () => navigate({ to: session?.setupComplete ? "/play" : "/setup" })
  return (
    <main className="launch">
      <p className="eyebrow">LOCAL-FIRST TABLE COMPANION</p>
      <h1>Mistborn<br />Player Aid</h1>
      <p className="lede">A shared iPad aid for competitive play. Physical components always remain authoritative.</p>
      {session ? (
        <section className="card saved-game">
          <strong>Saved game on this iPad</strong>
          <span>{session.players.map((player) => player.name).join(" · ")}</span>
          <Button size="lg" onClick={resume}>Resume game</Button>
          {confirmingReset ? (
            <div className="confirm"><span>Delete this local game?</span><button onClick={() => { setSession(null); setUndo([]) }}>Reset game</button><button onClick={() => setConfirmingReset(false)}>Keep it</button></div>
          ) : <button className="quiet" onClick={() => setConfirmingReset(true)}>Reset saved game</button>}
        </section>
      ) : <Link className="primary link-button" to="/setup">New competitive game</Link>}
      <p className="fine-print">Saved information stays only on this iPad.</p>
    </main>
  )
}

export function SetupPage() {
  const { session, setSession, setUndo, change } = useSession()
  const navigate = useNavigate()
  const [count, setCount] = useState(session?.players.length ?? 2)
  const [names, setNames] = useState(() => session?.players.map((player) => player.name) ?? ["Player 1", "Player 2"])
  const draft = session && !session.setupComplete ? session : null
  const initialize = () => {
    const players = Array.from({ length: count }, (_, index) => ({
      name: names[index]?.trim() || `Player ${index + 1}`,
      color: playerColors[index] as PlayerColor,
      symbol: ["◆", "●", "▲", "■"][index],
    }))
    setSession(createSession(players))
    setUndo([])
  }
  const rollSetup = () => {
    if (!draft) return
    const first = shuffle(draft.players)[0]
    const assigned = shuffle(characters)
    const selectedMissions = shuffle(missions).slice(0, 3)
    change((current) => ({ ...current, firstPlayerId: first.id, activePlayerId: first.id, players: current.players.map((player, index) => ({ ...player, character: assigned[index] })), missions: selectedMissions }))
  }
  const confirm = () => {
    if (!draft?.firstPlayerId || draft.missions.length !== 3 || draft.players.some((player) => !player.character)) return
    change((current) => ({ ...current, setupComplete: true }))
    navigate({ to: "/play" })
  }
  if (!draft) return <main className="setup"><header><Link to="/">Mistborn Player Aid</Link><h1>Start a game</h1></header><section className="card"><label>Players <select value={count} onChange={(event) => { const next = Number(event.target.value); setCount(next); setNames((current) => Array.from({ length: next }, (_, index) => current[index] ?? `Player ${index + 1}`)) }}><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label>{Array.from({ length: count }, (_, index) => <label key={index}>Player {index + 1}<input value={names[index] ?? ""} maxLength={20} onChange={(event) => setNames((current) => current.map((name, nameIndex) => nameIndex === index ? event.target.value : name))} /></label>)}<button className="primary" onClick={initialize}>Continue to randomizers</button></section></main>
  const first = draft.players.find((player) => player.id === draft.firstPlayerId)
  return <main className="setup"><header><Link to="/">Mistborn Player Aid</Link><h1>Set the table</h1><p>Results are displayed before confirmation. Take all listed cards and components physically.</p></header><section className="setup-grid"><article className="card"><h2>1. First player</h2><p>{first ? <><strong>{first.name}</strong> goes first. Starting health: 36, then +2, +4{draft.players.length === 4 ? ", +4 and 1 Boxing" : ""}.</> : "Choose a random first player."}</p>{draft.players.length > 2 && first && <p>Target begins with {draft.players.at(-1)?.name}, last in turn order from first player.</p>}</article><article className="card"><h2>2. Characters</h2>{draft.players.map((player) => <p key={player.id}><strong>{player.name}</strong> — {player.character ?? "Not assigned"}</p>)}</article><article className="card"><h2>3. Missions</h2>{draft.missions.length ? <ol>{draft.missions.map((mission) => <li key={mission}>{mission}</li>)}</ol> : <p>Select three different Missions.</p>}</article></section><div className="setup-actions"><button className="primary" onClick={rollSetup}>{first ? "Reroll results" : "Randomize setup"}</button><button disabled={!first || draft.missions.length !== 3 || draft.players.some((player) => !player.character)} onClick={confirm}>Confirm setup & start play</button></div><section className="card reminders"><h2>Physical setup reminders</h2><p>Give each player their character Training cards, Funding cards, Training track/cube, eight metals, and health dial. Reveal six Market cards, place Mission cubes, and draw five cards.</p></section></main>
}

export function PlayPage() {
  const { session, change, undoLast, canUndo, setSession, setUndo } = useSession()
  const navigate = useNavigate()
  const [purchaseCost, setPurchaseCost] = useState(1)
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  if (!session?.setupComplete) { navigate({ to: session ? "/setup" : "/" }); return null }
  const activeIndex = session.players.findIndex((player) => player.id === session.activePlayerId)
  const active = session.players[activeIndex]
  const nextTurn = (direction: 1 | -1) => change((current) => {
    const index = current.players.findIndex((player) => player.id === current.activePlayerId)
    const nextIndex = (index + direction + current.players.length) % current.players.length
    const completedTurns = direction === 1 ? current.completedTurns + 1 : Math.max(0, current.completedTurns - 1)
    return { ...current, activePlayerId: current.players[nextIndex].id, completedTurns, round: Math.floor(completedTurns / current.players.length) + 1, scratchpad: { ...current.scratchpad, coins: 0, combat: 0, missionPoints: 0, acknowledged: [], lastPayment: null } }
  })
  const adjustScratch = (key: "coins" | "combat" | "missionPoints", amount: number) => change((current) => ({ ...current, scratchpad: { ...current.scratchpad, [key]: Math.max(0, current.scratchpad[key] + amount) } }))
  const spend = (cost: number, addBoxing = false) => change((current) => {
    const player = current.players.find((item) => item.id === current.activePlayerId)
    if (!player) return current
    const receipt = paymentFor(current.scratchpad.coins, player.boxings, cost)
    if (receipt.remainingUnpaid > 0) return current
    const payment = `Paid ${receipt.paidTurnCoins} turn coin${receipt.paidTurnCoins === 1 ? "" : "s"}${receipt.paidBoxings ? ` + ${receipt.paidBoxings} Boxing${receipt.paidBoxings === 1 ? "" : "s"}` : ""}.`
    return { ...current, scratchpad: { ...current.scratchpad, coins: current.scratchpad.coins - receipt.paidTurnCoins, lastPayment: payment }, players: current.players.map((item) => item.id === player.id ? { ...item, boxings: item.boxings - receipt.paidBoxings + (addBoxing ? 1 : 0) } : item) }
  })
  const trainingPosition = baselineTraining(session)
  const trackLength = Math.max(10, trainingPosition)
  const endGame = () => { setSession(null); setUndo([]); navigate({ to: "/" }) }
  return <main className={`play ${session.preferences.dim ? "dim" : ""}`}><header className="turn-strip"><div><p className="eyebrow">ROUND {session.round}</p><h1>{active.name}'s turn</h1></div><div className="player-pills">{session.players.map((player) => <span className={player.id === active.id ? `pill active ${player.color}` : `pill ${player.color}`} key={player.id}>{player.symbol} {player.name}</span>)}</div><div className="turn-controls"><button onClick={() => nextTurn(-1)}>Previous turn</button><button className="primary" onClick={() => nextTurn(1)}>Next turn</button><button className="quiet" onClick={() => setConfirmingEnd(true)}>End game</button></div></header>{confirmingEnd && <div className="end-game-dialog" role="dialog" aria-modal="true" aria-label="End game confirmation"><strong>End this game?</strong><span>This deletes the saved session from this iPad.</span><button className="primary" onClick={endGame}>End and clear game</button><button onClick={() => setConfirmingEnd(false)}>Keep playing</button></div>}<section className="turn-aid card"><div className="section-heading"><h2>Turn aid</h2><button className="quiet" disabled={!canUndo} onClick={undoLast}>Undo</button></div>{checklist.map((item) => <label className="check" key={item}><input type="checkbox" checked={session.scratchpad.acknowledged.includes(item)} onChange={() => change((current) => ({ ...current, scratchpad: { ...current.scratchpad, acknowledged: current.scratchpad.acknowledged.includes(item) ? current.scratchpad.acknowledged.filter((entry) => entry !== item) : [...current.scratchpad.acknowledged, item] } }))} />{item}</label>)}</section><section className="scratchpad card"><h2>Turn scratchpad</h2><Counter label="Generated coins" value={session.scratchpad.coins} change={(amount) => adjustScratch("coins", amount)} /><Counter label="Combat" value={session.scratchpad.combat} change={(amount) => adjustScratch("combat", amount)} /><Counter label="Mission points" value={session.scratchpad.missionPoints} change={(amount) => adjustScratch("missionPoints", amount)} /><div className="spend"><label>Purchase cost<input type="number" min="1" value={purchaseCost} onChange={(event) => setPurchaseCost(Math.max(1, Number(event.target.value) || 1))} /></label><button onClick={() => spend(purchaseCost)}>Pay cost</button><button className="primary" onClick={() => spend(2, true)}>Buy Boxing · 2</button></div>{session.scratchpad.lastPayment && <p className="receipt">{session.scratchpad.lastPayment}</p>}</section><section className="boxing card"><h2>Boxings</h2><p className="muted">Unlimited resource · persists between turns</p>{session.players.map((player) => <div className="boxing-row" key={player.id}><span className={`marker ${player.color}`}>{player.symbol}</span><strong>{player.name}</strong><button onClick={() => change((current) => ({ ...current, players: current.players.map((item) => item.id === player.id ? { ...item, boxings: Math.max(0, item.boxings - 1) } : item) }))}>−</button><output>{player.boxings}</output><button onClick={() => change((current) => ({ ...current, players: current.players.map((item) => item.id === player.id ? { ...item, boxings: item.boxings + 1 } : item) }))}>+</button></div>)}</section><section className="training card"><div className="section-heading"><h2>Training baseline</h2><button className="quiet" onClick={() => change((current) => ({ ...current, preferences: { dim: !current.preferences.dim } }))}>{session.preferences.dim ? "Brighten" : "Dim table"}</button></div><div className="training-track" aria-label={`Training baseline position ${trainingPosition} of ${trackLength}`}>{Array.from({ length: trackLength }, (_, index) => <div className={index + 1 === trainingPosition ? "track-space current" : index + 1 < trainingPosition ? "track-space reached" : "track-space"} key={index}><span>{index + 1}</span>{index + 1 === trainingPosition && <strong>Baseline</strong>}</div>)}</div><p><strong>Baseline — no extra Train effects.</strong> Your physical Training cube is authoritative.</p></section></main>
}

function Counter({ label, value, change }: { label: string; value: number; change: (amount: number) => void }) {
  return <div className="counter"><span>{label}</span><button onClick={() => change(-1)}>−</button><output>{value}</output><button onClick={() => change(1)}>+</button></div>
}
