import { useAtomSet, useAtomValue } from "@effect/atom-react"
import * as stylex from "@stylexjs/stylex"
import { Link, Outlet, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { styles } from "./app.styles"
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
  return <div {...stylex.props(styles.root)}><Outlet /></div>
}

export function LaunchPage() {
  const { session, setSession, setUndo } = useSession()
  const [confirmingReset, setConfirmingReset] = useState(false)
  const navigate = useNavigate()
  const resume = () => navigate({ to: session?.setupComplete ? "/play" : "/setup" })
  return (
    <main {...stylex.props(styles.app, styles.launch)}>
      <p {...stylex.props(styles.eyebrow)}>LOCAL-FIRST TABLE COMPANION</p>
      <h1 {...stylex.props(styles.heading)}>Mistborn<br />Player Aid</h1>
      <p {...stylex.props(styles.lede)}>A shared iPad aid for competitive play. Physical components always remain authoritative.</p>
      {session ? (
        <Card className={stylex.props(styles.appCard, styles.savedGame).className}>
          <strong>Saved game on this iPad</strong>
          <span>{session.players.map((player) => player.name).join(" · ")}</span>
          <Button size="lg" onClick={resume}>Resume game</Button>
          {confirmingReset ? (
            <div {...stylex.props(styles.confirm)}><span>Delete this local game?</span><Button variant="destructive" onClick={() => { setSession(null); setUndo([]) }}>Reset game</Button><Button variant="outline" onClick={() => setConfirmingReset(false)}>Keep it</Button></div>
          ) : <Button variant="ghost" onClick={() => setConfirmingReset(true)}>Reset saved game</Button>}
        </Card>
      ) : <Button className={stylex.props(styles.launchAction).className} size="lg" render={<Link to="/setup" />}>New competitive game</Button>}
      <p {...stylex.props(styles.finePrint)}>Saved information stays only on this iPad.</p>
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
  if (!draft) return (
    <main {...stylex.props(styles.app, styles.setup)}>
      <header {...stylex.props(styles.setupHeader)}><Link to="/" {...stylex.props(styles.link)}>Mistborn Player Aid</Link><h1 {...stylex.props(styles.heading, styles.setupHeading)}>Start a game</h1></header>
      <Card className={stylex.props(styles.appCard).className}>
        <label {...stylex.props(styles.fieldLabel)}>
          Players
          <NativeSelect value={count} onChange={(event) => { const next = Number(event.target.value); setCount(next); setNames((current) => Array.from({ length: next }, (_, index) => current[index] ?? `Player ${index + 1}`)) }}>
            <NativeSelectOption value={2}>2</NativeSelectOption>
            <NativeSelectOption value={3}>3</NativeSelectOption>
            <NativeSelectOption value={4}>4</NativeSelectOption>
          </NativeSelect>
        </label>
        {Array.from({ length: count }, (_, index) => (
          <label key={index} {...stylex.props(styles.fieldLabel)}>
            Player {index + 1}
            <Input value={names[index] ?? ""} maxLength={20} onChange={(event) => setNames((current) => current.map((name, nameIndex) => nameIndex === index ? event.target.value : name))} />
          </label>
        ))}
        <Button onClick={initialize}>Continue to randomizers</Button>
      </Card>
    </main>
  )
  const first = draft.players.find((player) => player.id === draft.firstPlayerId)
  return (
    <main {...stylex.props(styles.app, styles.setup)}>
      <header {...stylex.props(styles.setupHeader)}><Link to="/" {...stylex.props(styles.link)}>Mistborn Player Aid</Link><h1 {...stylex.props(styles.heading, styles.setupHeading)}>Set the table</h1><p {...stylex.props(styles.paragraph)}>Results are displayed before confirmation. Take all listed cards and components physically.</p></header>
      <section {...stylex.props(styles.setupGrid)}>
        <Card className={stylex.props(styles.appCard).className}><h2 {...stylex.props(styles.headingTwo)}>1. First player</h2><p {...stylex.props(styles.paragraph)}>{first ? <><strong>{first.name}</strong> goes first. Starting health: 36, then +2, +4{draft.players.length === 4 ? ", +4 and 1 Boxing" : ""}.</> : "Choose a random first player."}</p>{draft.players.length > 2 && first && <p {...stylex.props(styles.paragraph)}>Target begins with {draft.players.at(-1)?.name}, last in turn order from first player.</p>}</Card>
        <Card className={stylex.props(styles.appCard).className}><h2 {...stylex.props(styles.headingTwo)}>2. Characters</h2>{draft.players.map((player) => <p key={player.id} {...stylex.props(styles.paragraph)}><strong>{player.name}</strong> — {player.character ?? "Not assigned"}</p>)}</Card>
        <Card className={stylex.props(styles.appCard).className}><h2 {...stylex.props(styles.headingTwo)}>3. Missions</h2>{draft.missions.length ? <ol {...stylex.props(styles.list)}>{draft.missions.map((mission) => <li key={mission}>{mission}</li>)}</ol> : <p {...stylex.props(styles.paragraph)}>Select three different Missions.</p>}</Card>
      </section>
      <div {...stylex.props(styles.setupActions)}>
        <Button className={stylex.props(styles.setupAction).className} onClick={rollSetup}>{first ? "Reroll results" : "Randomize setup"}</Button>
        <Button className={stylex.props(styles.setupAction).className} variant="secondary" disabled={!first || draft.missions.length !== 3 || draft.players.some((player) => !player.character)} onClick={confirm}>Confirm setup & start play</Button>
      </div>
      <Card className={stylex.props(styles.appCard, styles.reminders).className}><h2 {...stylex.props(styles.headingTwo)}>Physical setup reminders</h2><p {...stylex.props(styles.paragraph)}>Give each player their character Training cards, Funding cards, Training track/cube, eight metals, and health dial. Reveal six Market cards, place Mission cubes, and draw five cards.</p></Card>
    </main>
  )
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
  const toggleAcknowledged = (item: string) => change((current) => ({
    ...current,
    scratchpad: {
      ...current.scratchpad,
      acknowledged: current.scratchpad.acknowledged.includes(item)
        ? current.scratchpad.acknowledged.filter((entry) => entry !== item)
        : [...current.scratchpad.acknowledged, item],
    },
  }))
  return (
    <main {...stylex.props(styles.app, styles.play, session.preferences.dim && styles.dim)}>
      <header {...stylex.props(styles.turnStrip)}>
        <div><p {...stylex.props(styles.eyebrow)}>ROUND {session.round}</p><h1 {...stylex.props(styles.turnHeading)}>{active.name}'s turn</h1></div>
        <div {...stylex.props(styles.playerPills)}>{session.players.map((player) => <span {...stylex.props(styles.pill, player.id === active.id && styles.activePill, styles[player.color])} key={player.id}>{player.symbol} {player.name}</span>)}</div>
        <div {...stylex.props(styles.turnControls)}>
          <Button className={stylex.props(styles.turnButton).className} variant="outline" onClick={() => nextTurn(-1)}>Previous turn</Button>
          <Button className={stylex.props(styles.turnButton).className} onClick={() => nextTurn(1)}>Next turn</Button>
          <Button className={stylex.props(styles.turnButton).className} variant="ghost" onClick={() => setConfirmingEnd(true)}>End game</Button>
        </div>
      </header>
      {confirmingEnd && (
        <div {...stylex.props(styles.endGameDialog)} role="dialog" aria-modal="true" aria-label="End game confirmation">
          <strong {...stylex.props(styles.dialogItem)}>End this game?</strong>
          <span {...stylex.props(styles.dialogItem)}>This deletes the saved session from this iPad.</span>
          <Button className={stylex.props(styles.dialogItem).className} variant="destructive" onClick={endGame}>End and clear game</Button>
          <Button className={stylex.props(styles.dialogItem).className} variant="outline" onClick={() => setConfirmingEnd(false)}>Keep playing</Button>
        </div>
      )}
      <Card className={stylex.props(styles.appCard, styles.turnAid).className}>
        <div {...stylex.props(styles.sectionHeading)}><h2 {...stylex.props(styles.headingTwo)}>Turn aid</h2><Button variant="ghost" disabled={!canUndo} onClick={undoLast}>Undo</Button></div>
        {checklist.map((item, index) => (
          <div {...stylex.props(styles.check)} key={item}>
            <Checkbox id={`turn-check-${index}`} checked={session.scratchpad.acknowledged.includes(item)} onCheckedChange={() => toggleAcknowledged(item)} />
            <label htmlFor={`turn-check-${index}`}>{item}</label>
          </div>
        ))}
      </Card>
      <Card className={stylex.props(styles.appCard, styles.scratchpad).className}>
        <h2 {...stylex.props(styles.headingTwo)}>Turn scratchpad</h2>
        <Counter label="Generated coins" value={session.scratchpad.coins} change={(amount) => adjustScratch("coins", amount)} />
        <Counter label="Combat" value={session.scratchpad.combat} change={(amount) => adjustScratch("combat", amount)} />
        <Counter label="Mission points" value={session.scratchpad.missionPoints} change={(amount) => adjustScratch("missionPoints", amount)} />
        <div {...stylex.props(styles.spend)}>
          <label {...stylex.props(styles.spendLabel)}>Purchase cost<Input className={stylex.props(styles.purchaseInput).className} type="number" min="1" value={purchaseCost} onChange={(event) => setPurchaseCost(Math.max(1, Number(event.target.value) || 1))} /></label>
          <Button variant="secondary" onClick={() => spend(purchaseCost)}>Pay cost</Button>
          <Button onClick={() => spend(2, true)}>Buy Boxing · 2</Button>
        </div>
        {session.scratchpad.lastPayment && <p {...stylex.props(styles.paragraph)}>{session.scratchpad.lastPayment}</p>}
      </Card>
      <Card className={stylex.props(styles.appCard, styles.boxing).className}>
        <h2 {...stylex.props(styles.boxingTitle)}>Boxings</h2>
        <p {...stylex.props(styles.muted)}>Unlimited resource · persists between turns</p>
        {session.players.map((player) => (
          <div {...stylex.props(styles.boxingRow)} key={player.id}>
            <span {...stylex.props(styles.marker, styles[player.color])}>{player.symbol}</span>
            <strong>{player.name}</strong>
            <Button variant="outline" size="icon-lg" aria-label={`Remove one Boxing from ${player.name}`} onClick={() => change((current) => ({ ...current, players: current.players.map((item) => item.id === player.id ? { ...item, boxings: Math.max(0, item.boxings - 1) } : item) }))}>−</Button>
            <output {...stylex.props(styles.counterOutput)}>{player.boxings}</output>
            <Button variant="outline" size="icon-lg" aria-label={`Add one Boxing to ${player.name}`} onClick={() => change((current) => ({ ...current, players: current.players.map((item) => item.id === player.id ? { ...item, boxings: item.boxings + 1 } : item) }))}>+</Button>
          </div>
        ))}
      </Card>
      <Card className={stylex.props(styles.appCard, styles.training).className}>
        <div {...stylex.props(styles.sectionHeading)}><h2 {...stylex.props(styles.headingTwo)}>Training baseline</h2><Button variant="ghost" onClick={() => change((current) => ({ ...current, preferences: { dim: !current.preferences.dim } }))}>{session.preferences.dim ? "Brighten" : "Dim table"}</Button></div>
        <div {...stylex.props(styles.trainingTrack)} aria-label={`Training baseline position ${trainingPosition} of ${trackLength}`}>{Array.from({ length: trackLength }, (_, index) => <div {...stylex.props(styles.trackSpace, index + 1 === trainingPosition ? styles.currentTrackSpace : index + 1 < trainingPosition && styles.reachedTrackSpace)} key={index}><span>{index + 1}</span>{index + 1 === trainingPosition && <strong {...stylex.props(styles.currentTrackLabel)}>Baseline</strong>}</div>)}</div>
        <p {...stylex.props(styles.paragraph)}><strong>Baseline — no extra Train effects.</strong> Your physical Training cube is authoritative.</p>
      </Card>
    </main>
  )
}

function Counter({ label, value, change }: { label: string; value: number; change: (amount: number) => void }) {
  return <div {...stylex.props(styles.counter)}><span>{label}</span><Button variant="outline" size="icon-lg" aria-label={`Decrease ${label}`} onClick={() => change(-1)}>−</Button><output {...stylex.props(styles.counterOutput)}>{value}</output><Button variant="outline" size="icon-lg" aria-label={`Increase ${label}`} onClick={() => change(1)}>+</Button></div>
}
