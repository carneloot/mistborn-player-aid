import * as stylex from '@stylexjs/stylex';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { styles } from '../app.styles';
import {
	baselineTraining,
	boxingsFromTurnCoins,
	paymentFor,
} from '../domain/session';
import { useSession } from '../hooks/use-session';
import { ThemeToggle } from './__root';

function PlayPage() {
	const { session, change, setSession, setUndo } = useSession();
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
	const availableToSpend = session.scratchpad.coins + active.boxings;
	const minimumPurchaseCost = availableToSpend === 0 ? 0 : 1;
	const selectedPurchaseCost = Math.min(purchaseCost, availableToSpend);
	const nextTurn = (direction: 1 | -1) => {
		if (direction === -1 && session.completedTurns === 0) return;
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
					lastPayment: null,
				},
			};
		});
	};
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
	const spend = (cost: number) =>
		change((current) => {
			const player = current.players.find(
				(item) => item.id === current.activePlayerId,
			);
			if (!player) return current;
			const receipt = paymentFor(
				current.scratchpad.coins,
				player.boxings,
				cost,
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
								boxings: item.boxings - receipt.paidBoxings,
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
	return (
		<main {...stylex.props(styles.app, styles.play)}>
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
					<ThemeToggle />
					<Button
						className={stylex.props(styles.turnButton).className}
						variant="outline"
						disabled={session.completedTurns === 0}
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
			<Card className={stylex.props(styles.appCard, styles.coins).className}>
				<h2 {...stylex.props(styles.headingTwo)}>Coins</h2>
				<p {...stylex.props(styles.muted)}>Total available to spend</p>
				<output
					{...stylex.props(styles.coinTotal)}
					aria-label={`Total available to spend: ${availableToSpend}`}
				>
					{availableToSpend}
				</output>
				<Counter
					label="Purchase cost"
					value={selectedPurchaseCost}
					min={minimumPurchaseCost}
					max={availableToSpend}
					change={(amount) =>
						setPurchaseCost(
							Math.max(
								minimumPurchaseCost,
								Math.min(availableToSpend, selectedPurchaseCost + amount),
							),
						)
					}
				/>
				<Button
					disabled={selectedPurchaseCost === 0}
					onClick={() => spend(selectedPurchaseCost)}
				>
					Buy
				</Button>
				{session.scratchpad.lastPayment && (
					<p {...stylex.props(styles.paragraph)}>
						{session.scratchpad.lastPayment}
					</p>
				)}
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
			</Card>
			<Card className={stylex.props(styles.appCard, styles.boxing).className}>
				<h2 {...stylex.props(styles.headingTwo)}>Boxings</h2>
				{session.players.map((player) => (
					<Counter
						accessibleLabel={`${player.name} Boxings`}
						change={(amount) =>
							change((current) => ({
								...current,
								players: current.players.map((item) =>
									item.id === player.id
										? {
												...item,
												boxings: Math.max(0, item.boxings + amount),
											}
										: item,
								),
							}))
						}
						isActive={player.id === active.id}
						key={player.id}
						label={
							<span {...stylex.props(styles.playerCounterLabel)}>
								<span {...stylex.props(styles.marker, styles[player.color])}>
									{player.symbol}
								</span>
								{player.name}
							</span>
						}
						value={player.boxings}
					/>
				))}
			</Card>
			<Card className={stylex.props(styles.appCard, styles.training).className}>
				<h2 {...stylex.props(styles.headingTwo)}>Training baseline</h2>
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
				<p {...stylex.props(styles.trainingDescription)}>
					<strong>Baseline — no extra Train effects.</strong> Your physical
					Training cube is authoritative.
				</p>
			</Card>
		</main>
	);
}

function Counter({
	label,
	accessibleLabel,
	value,
	change,
	isActive = false,
	min = 0,
	max = Number.POSITIVE_INFINITY,
}: {
	label: React.ReactNode;
	accessibleLabel?: string;
	value: number;
	change: (amount: number) => void;
	isActive?: boolean;
	min?: number;
	max?: number;
}) {
	const counterLabel =
		accessibleLabel ?? (typeof label === 'string' ? label : 'value');
	return (
		<div {...stylex.props(styles.counter, isActive && styles.activeCounter)}>
			<span>{label}</span>
			<Button
				variant="outline"
				size="icon-lg"
				aria-label={`Decrease ${counterLabel}`}
				disabled={value <= min}
				onClick={() => change(-1)}
			>
				−
			</Button>
			<output {...stylex.props(styles.counterOutput)}>{value}</output>
			<Button
				variant="outline"
				size="icon-lg"
				aria-label={`Increase ${counterLabel}`}
				disabled={value >= max}
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
