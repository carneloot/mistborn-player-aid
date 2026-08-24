import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	type DragEndEvent,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as stylex from '@stylexjs/stylex';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { GripVerticalIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { styles } from '../app.styles';
import {
	completeSetup,
	createSession,
	isSetupReady,
	playerColors,
	startingBonus,
	turnOrderFromFirstPlayer,
	type PlayerColor,
} from '../domain/session';
import { useSession } from '../hooks/use-session';
import { ThemeToggle } from './__root';

type PlayerDraft = { id: string; name: string };

function SortablePlayer({
	index,
	player,
	onNameChange,
}: {
	index: number;
	player: PlayerDraft;
	onNameChange: (id: string, name: string) => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition } =
		useSortable({ id: player.id });
	return (
		<div
			ref={setNodeRef}
			{...stylex.props(styles.playerEntry)}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			<Button
				aria-label={`Drag ${player.name || `Player ${index + 1}`} to reorder`}
				className={stylex.props(styles.playerDragHandle).className}
				{...attributes}
				{...listeners}
				size="icon"
				variant="ghost"
			>
				<GripVerticalIcon aria-hidden="true" />
			</Button>
			<label {...stylex.props(styles.fieldLabel, styles.playerName)}>
				Player {index + 1}
				<Input
					value={player.name}
					maxLength={20}
					onChange={(event) => onNameChange(player.id, event.target.value)}
				/>
			</label>
		</div>
	);
}

function SetupPage() {
	const { session, setSession, setUndo, randomizeSetup, change } = useSession();
	const navigate = useNavigate();
	useEffect(() => {
		if (session?.setupComplete) void navigate({ to: '/play' });
	}, [navigate, session?.setupComplete]);
	const [count, setCount] = useState(session?.players.length ?? 2);
	const [players, setPlayers] = useState<PlayerDraft[]>(
		() =>
			session?.players.map((player, index) => ({
				id: `player-draft-${index + 1}`,
				name: player.name,
			})) ?? [
				{ id: 'player-draft-1', name: '' },
				{ id: 'player-draft-2', name: '' },
			],
	);
	const draft = session && !session.setupComplete ? session : null;
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);
	const updatePlayerName = (id: string, name: string) =>
		setPlayers((current) =>
			current.map((player) =>
				player.id === id ? { ...player, name } : player,
			),
		);
	const reorderPlayers = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;
		setPlayers((current) =>
			arrayMove(
				current,
				current.findIndex((player) => player.id === active.id),
				current.findIndex((player) => player.id === over.id),
			),
		);
	};
	const initialize = () => {
		const sessionPlayers = players.map((player, index) => ({
			name: player.name.trim() || `Player ${index + 1}`,
			color: playerColors[index] as PlayerColor,
			symbol: ['◆', '●', '▲', '■'][index],
		}));
		setSession(createSession(sessionPlayers));
		setUndo([]);
	};
	const rollSetup = () => {
		if (!draft) return;
		randomizeSetup();
	};
	const confirm = () => {
		if (!draft || !isSetupReady(draft)) return;
		change(completeSetup);
	};
	const returnToPlayerSetup = () => {
		setSession(null);
		setUndo([]);
	};
	if (session?.setupComplete) return null;
	if (!draft)
		return (
			<main {...stylex.props(styles.app, styles.setup)}>
				<header {...stylex.props(styles.setupHeader)}>
					<div {...stylex.props(styles.setupUtility)}>
						<Link to="/" {...stylex.props(styles.link)}>
							Mistborn Companion App
						</Link>
						<ThemeToggle />
					</div>
					<h1 {...stylex.props(styles.heading, styles.setupHeading)}>
						Start a game
					</h1>
				</header>
				<Card className={stylex.props(styles.appCard).className}>
					<form
						{...stylex.props(styles.setupForm)}
						onSubmit={(event) => {
							event.preventDefault();
							initialize();
						}}
					>
						<fieldset {...stylex.props(styles.playerCountField)}>
							<legend {...stylex.props(styles.fieldLegend)}>Game size</legend>
							<div {...stylex.props(styles.playerCountOptions)}>
								{[2, 3, 4].map((playerCount) => (
									<label
										key={playerCount}
										{...stylex.props(
											styles.playerCountOption,
											count === playerCount && styles.playerCountOptionSelected,
										)}
									>
										<input
											{...stylex.props(styles.playerCountRadio)}
											checked={count === playerCount}
											name="player-count"
											onChange={() => {
												setCount(playerCount);
												setPlayers((current) =>
													Array.from(
														{ length: playerCount },
														(_, index) =>
															current[index] ?? {
																id: `player-draft-${index + 1}`,
																name: '',
															},
													),
												);
											}}
											type="radio"
											value={playerCount}
										/>
										{playerCount} players
									</label>
								))}
							</div>
						</fieldset>
						<p {...stylex.props(styles.playerOrderHint)}>
							Drag players into turn order.
						</p>
						<DndContext
							collisionDetection={closestCenter}
							onDragEnd={reorderPlayers}
							sensors={sensors}
						>
							<SortableContext
								items={players.map((player) => player.id)}
								strategy={verticalListSortingStrategy}
							>
								{players.map((player, index) => (
									<SortablePlayer
										key={player.id}
										index={index}
										onNameChange={updatePlayerName}
										player={player}
									/>
								))}
							</SortableContext>
						</DndContext>
						<Button
							className={stylex.props(styles.setupSubmit).className}
							type="submit"
						>
							Continue to randomizers
						</Button>
					</form>
				</Card>
			</main>
		);
	const turnOrder = turnOrderFromFirstPlayer(
		draft.players,
		draft.firstPlayerId,
	);
	const first = turnOrder[0];
	return (
		<main {...stylex.props(styles.app, styles.setup)}>
			<header {...stylex.props(styles.setupHeader)}>
				<div {...stylex.props(styles.setupUtility)}>
					<Link to="/" {...stylex.props(styles.link)}>
						Mistborn Companion App
					</Link>
					<ThemeToggle />
				</div>
				<h1 {...stylex.props(styles.heading, styles.setupHeading)}>
					Set the table
				</h1>
				<p {...stylex.props(styles.paragraph)}>
					Results are displayed before confirmation. Take all listed cards and
					components physically.
				</p>
			</header>
			<section {...stylex.props(styles.setupGrid)}>
				<Card className={stylex.props(styles.appCard).className}>
					<h2 {...stylex.props(styles.headingTwo)}>1. Turn order</h2>
					{first ? (
						<div {...stylex.props(styles.startingBonuses)}>
							{turnOrder.map((player, index) => (
								<div key={player.id} {...stylex.props(styles.startingBonus)}>
									<strong>{player.name}</strong>
									<span>{startingBonus(index)}</span>
								</div>
							))}
						</div>
					) : (
						<p {...stylex.props(styles.paragraph)}>
							Choose a random first player.
						</p>
					)}
					{draft.players.length > 2 && first && (
						<p {...stylex.props(styles.paragraph)}>
							Target begins with {turnOrder.at(-1)?.name}, last in turn order
							from first player.
						</p>
					)}
				</Card>
				<Card className={stylex.props(styles.appCard).className}>
					<h2 {...stylex.props(styles.headingTwo)}>2. Characters</h2>
					{draft.players.map((player) => (
						<p key={player.id} {...stylex.props(styles.paragraph)}>
							<strong>{player.name}</strong> —{' '}
							{player.character ?? 'Not assigned'}
						</p>
					))}
				</Card>
				<Card className={stylex.props(styles.appCard).className}>
					<h2 {...stylex.props(styles.headingTwo)}>3. Missions</h2>
					{draft.missions.length ? (
						<ol {...stylex.props(styles.list)}>
							{draft.missions.map((mission) => (
								<li key={mission}>{mission}</li>
							))}
						</ol>
					) : (
						<p {...stylex.props(styles.paragraph)}>
							Select three different Missions.
						</p>
					)}
				</Card>
			</section>
			<div {...stylex.props(styles.setupActions)}>
				<Button
					className={stylex.props(styles.setupAction).className}
					onClick={returnToPlayerSetup}
					variant="secondary"
				>
					Back to player setup
				</Button>
				<Button
					className={stylex.props(styles.setupAction).className}
					onClick={rollSetup}
					variant={first ? 'secondary' : 'default'}
				>
					{first ? 'Reroll results' : 'Randomize setup'}
				</Button>
				<Button
					className={stylex.props(styles.setupAction).className}
					variant={first ? 'default' : 'secondary'}
					disabled={!isSetupReady(draft)}
					onClick={confirm}
				>
					Confirm setup & start play
				</Button>
			</div>
			<Card
				className={stylex.props(styles.appCard, styles.reminders).className}
			>
				<h2 {...stylex.props(styles.headingTwo)}>Physical setup reminders</h2>
				<p {...stylex.props(styles.paragraph)}>
					Give each player their character Training cards, Funding cards,
					Training track/cube, eight metals, and health dial. Reveal six Market
					cards, place Mission cubes, and draw five cards.
				</p>
			</Card>
		</main>
	);
}

export const Route = createFileRoute('/setup')({
	component: SetupPage,
});
