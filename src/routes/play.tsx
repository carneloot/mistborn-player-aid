import * as stylex from '@stylexjs/stylex';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

import { styles } from '../app.styles';
import {
	baselineTraining,
	boxingCost,
	boxingsFromTurnCoins,
	paymentFor,
} from '../domain/session';
import { useSession } from '../hooks/use-session';

const checklist = [
	'Advance the physical Training cube one space.',
	'Play cards, Burn or Flare metals, use abilities, buy, and attack in any legal order.',
	'Resolve Target movement after all damage is assigned, if applicable.',
	'Discard non-Allies and unplayed cards, then draw five cards.',
];

function PlayPage() {
	const { session, change, undoLast, canUndo, setSession, setUndo } =
		useSession();
	const navigate = useNavigate();
	const [purchaseCost, setPurchaseCost] = useState(1);
	const [confirmingEnd, setConfirmingEnd] = useState(false);
	if (!session?.setupComplete) {
		navigate({ to: session ? '/setup' : '/' });
		return null;
	}
	const activeIndex = session.players.findIndex(
		(player) => player.id === session.activePlayerId,
	);
	const active = session.players[activeIndex];
	const nextTurn = (direction: 1 | -1) =>
		change((current) => {
			const index = current.players.findIndex(
				(player) => player.id === current.activePlayerId,
			);
			const nextIndex =
				(index + direction + current.players.length) % current.players.length;
			const completedTurns =
				direction === 1
					? current.completedTurns + 1
					: Math.max(0, current.completedTurns - 1);
			const earnedBoxings =
				direction === 1 ? boxingsFromTurnCoins(current.scratchpad.coins) : 0;
			return {
				...current,
				activePlayerId: current.players[nextIndex].id,
				completedTurns,
				round: Math.floor(completedTurns / current.players.length) + 1,
				players: current.players.map((player) =>
					player.id === current.activePlayerId
						? { ...player, boxings: player.boxings + earnedBoxings }
						: player,
				),
				scratchpad: {
					...current.scratchpad,
					coins: 0,
					combat: 0,
					missionPoints: 0,
					acknowledged: [],
					lastPayment: null,
				},
			};
		});
	const adjustScratch = (
		key: 'coins' | 'combat' | 'missionPoints',
		amount: number,
	) =>
		change((current) => ({
			...current,
			scratchpad: {
				...current.scratchpad,
				[key]: Math.max(0, current.scratchpad[key] + amount),
			},
		}));
	const spend = (cost: number, addBoxing = false) =>
		change((current) => {
			const player = current.players.find(
				(item) => item.id === current.activePlayerId,
			);
			if (!player) return current;
			const receipt = paymentFor(
				current.scratchpad.coins,
				player.boxings,
				cost,
				!addBoxing,
			);
			if (receipt.remainingUnpaid > 0) return current;
			const payment = `Paid ${receipt.paidTurnCoins} turn coin${receipt.paidTurnCoins === 1 ? '' : 's'}${receipt.paidBoxings ? ` + ${receipt.paidBoxings} Boxing${receipt.paidBoxings === 1 ? '' : 's'}` : ''}.`;
			return {
				...current,
				scratchpad: {
					...current.scratchpad,
					coins: current.scratchpad.coins - receipt.paidTurnCoins,
					lastPayment: payment,
				},
				players: current.players.map((item) =>
					item.id === player.id
						? {
								...item,
								boxings:
									item.boxings - receipt.paidBoxings + (addBoxing ? 1 : 0),
							}
						: item,
				),
			};
		});
	const trainingPosition = baselineTraining(session);
	const trackLength = Math.max(10, trainingPosition);
	const endGame = () => {
		setSession(null);
		setUndo([]);
		navigate({ to: '/' });
	};
	const toggleAcknowledged = (item: string) =>
		change((current) => ({
			...current,
			scratchpad: {
				...current.scratchpad,
				acknowledged: current.scratchpad.acknowledged.includes(item)
					? current.scratchpad.acknowledged.filter((entry) => entry !== item)
					: [...current.scratchpad.acknowledged, item],
			},
		}));
	return (
		<main
			{...stylex.props(
				styles.app,
				styles.play,
				session.preferences.dim && styles.dim,
			)}
		>
			<header {...stylex.props(styles.turnStrip)}>
				<div>
					<p {...stylex.props(styles.eyebrow)}>ROUND {session.round}</p>
					<h1 {...stylex.props(styles.turnHeading)}>
						{active.name}&apos;s turn
					</h1>
				</div>
				<div {...stylex.props(styles.playerPills)}>
					{session.players.map((player) => (
						<span
							{...stylex.props(
								styles.pill,
								player.id === active.id && styles.activePill,
								styles[player.color],
							)}
							key={player.id}
						>
							{player.symbol} {player.name}
						</span>
					))}
				</div>
				<div {...stylex.props(styles.turnControls)}>
					<Button
						className={stylex.props(styles.turnButton).className}
						variant="outline"
						onClick={() => nextTurn(-1)}
					>
						Previous turn
					</Button>
					<Button
						className={stylex.props(styles.turnButton).className}
						onClick={() => nextTurn(1)}
					>
						Next turn
					</Button>
					<Button
						className={stylex.props(styles.turnButton).className}
						variant="ghost"
						onClick={() => setConfirmingEnd(true)}
					>
						End game
					</Button>
				</div>
			</header>
			{confirmingEnd && (
				<div
					{...stylex.props(styles.endGameDialog)}
					role="dialog"
					aria-modal="true"
					aria-label="End game confirmation"
				>
					<strong {...stylex.props(styles.dialogItem)}>End this game?</strong>
					<span {...stylex.props(styles.dialogItem)}>
						This deletes the saved session from this iPad.
					</span>
					<Button
						className={stylex.props(styles.dialogItem).className}
						variant="destructive"
						onClick={endGame}
					>
						End and clear game
					</Button>
					<Button
						className={stylex.props(styles.dialogItem).className}
						variant="outline"
						onClick={() => setConfirmingEnd(false)}
					>
						Keep playing
					</Button>
				</div>
			)}
			<Card className={stylex.props(styles.appCard, styles.turnAid).className}>
				<div {...stylex.props(styles.sectionHeading)}>
					<h2 {...stylex.props(styles.headingTwo)}>Turn aid</h2>
					<Button variant="ghost" disabled={!canUndo} onClick={undoLast}>
						Undo
					</Button>
				</div>
				{checklist.map((item, index) => (
					<div {...stylex.props(styles.check)} key={item}>
						<Checkbox
							id={`turn-check-${index}`}
							checked={session.scratchpad.acknowledged.includes(item)}
							onCheckedChange={() => toggleAcknowledged(item)}
						/>
						<label htmlFor={`turn-check-${index}`}>{item}</label>
					</div>
				))}
			</Card>
			<Card
				className={stylex.props(styles.appCard, styles.scratchpad).className}
			>
				<h2 {...stylex.props(styles.headingTwo)}>Turn scratchpad</h2>
				<Counter
					label="Generated coins"
					value={session.scratchpad.coins}
					change={(amount) => adjustScratch('coins', amount)}
				/>
				<Counter
					label="Combat"
					value={session.scratchpad.combat}
					change={(amount) => adjustScratch('combat', amount)}
				/>
				<Counter
					label="Mission points"
					value={session.scratchpad.missionPoints}
					change={(amount) => adjustScratch('missionPoints', amount)}
				/>
				<div {...stylex.props(styles.spend)}>
					<label {...stylex.props(styles.spendLabel)}>
						Purchase cost
						<Input
							className={stylex.props(styles.purchaseInput).className}
							type="number"
							min="1"
							value={purchaseCost}
							onChange={(event) =>
								setPurchaseCost(Math.max(1, Number(event.target.value) || 1))
							}
						/>
					</label>
					<Button variant="secondary" onClick={() => spend(purchaseCost)}>
						Pay cost
					</Button>
					<Button onClick={() => spend(boxingCost, true)}>
						Buy Boxing · {boxingCost}
					</Button>
				</div>
				{session.scratchpad.lastPayment && (
					<p {...stylex.props(styles.paragraph)}>
						{session.scratchpad.lastPayment}
					</p>
				)}
			</Card>
			<Card className={stylex.props(styles.appCard, styles.boxing).className}>
				<h2 {...stylex.props(styles.boxingTitle)}>Boxings</h2>
				<p {...stylex.props(styles.muted)}>
					Unlimited resource · persists between turns
				</p>
				{session.players.map((player) => (
					<div {...stylex.props(styles.boxingRow)} key={player.id}>
						<span {...stylex.props(styles.marker, styles[player.color])}>
							{player.symbol}
						</span>
						<strong>{player.name}</strong>
						<Button
							variant="outline"
							size="icon-lg"
							aria-label={`Remove one Boxing from ${player.name}`}
							onClick={() =>
								change((current) => ({
									...current,
									players: current.players.map((item) =>
										item.id === player.id
											? { ...item, boxings: Math.max(0, item.boxings - 1) }
											: item,
									),
								}))
							}
						>
							−
						</Button>
						<output {...stylex.props(styles.counterOutput)}>
							{player.boxings}
						</output>
						<Button
							variant="outline"
							size="icon-lg"
							aria-label={`Add one Boxing to ${player.name}`}
							onClick={() =>
								change((current) => ({
									...current,
									players: current.players.map((item) =>
										item.id === player.id
											? { ...item, boxings: item.boxings + 1 }
											: item,
									),
								}))
							}
						>
							+
						</Button>
					</div>
				))}
			</Card>
			<Card className={stylex.props(styles.appCard, styles.training).className}>
				<div {...stylex.props(styles.sectionHeading)}>
					<h2 {...stylex.props(styles.headingTwo)}>Training baseline</h2>
					<Button
						variant="ghost"
						onClick={() =>
							change((current) => ({
								...current,
								preferences: { dim: !current.preferences.dim },
							}))
						}
					>
						{session.preferences.dim ? 'Brighten' : 'Dim table'}
					</Button>
				</div>
				<div
					{...stylex.props(styles.trainingTrack)}
					aria-label={`Training baseline position ${trainingPosition} of ${trackLength}`}
				>
					{Array.from({ length: trackLength }, (_, index) => (
						<div
							{...stylex.props(
								styles.trackSpace,
								index + 1 === trainingPosition
									? styles.currentTrackSpace
									: index + 1 < trainingPosition && styles.reachedTrackSpace,
							)}
							key={index}
						>
							<span>{index + 1}</span>
							{index + 1 === trainingPosition && (
								<strong {...stylex.props(styles.currentTrackLabel)}>
									Baseline
								</strong>
							)}
						</div>
					))}
				</div>
				<p {...stylex.props(styles.paragraph)}>
					<strong>Baseline — no extra Train effects.</strong> Your physical
					Training cube is authoritative.
				</p>
			</Card>
		</main>
	);
}

function Counter({
	label,
	value,
	change,
}: {
	label: string;
	value: number;
	change: (amount: number) => void;
}) {
	return (
		<div {...stylex.props(styles.counter)}>
			<span>{label}</span>
			<Button
				variant="outline"
				size="icon-lg"
				aria-label={`Decrease ${label}`}
				onClick={() => change(-1)}
			>
				−
			</Button>
			<output {...stylex.props(styles.counterOutput)}>{value}</output>
			<Button
				variant="outline"
				size="icon-lg"
				aria-label={`Increase ${label}`}
				onClick={() => change(1)}
			>
				+
			</Button>
		</div>
	);
}

export const Route = createFileRoute('/play')({
	component: PlayPage,
});
