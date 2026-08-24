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
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
	NativeSelect,
	NativeSelectOption,
} from '@/components/ui/native-select';

import { styles } from '../app.styles';
import {
	characters,
	createSession,
	missions,
	playerColors,
	type PlayerColor,
} from '../domain/session';
import { useSession } from '../hooks/use-session';
import { ThemeToggle } from './__root';

const shuffle = <T,>(values: readonly T[]) =>
	[...values].sort(() => Math.random() - 0.5);

type PlayerDraft = { id: string; name: string };

const startingBonus = (turnPosition: number) => {
	if (turnPosition === 0) return '36 health';
	if (turnPosition === 1) return '+2 health';
	if (turnPosition === 2) return '+4 health';
	return '+4 health · 1 Boxing';
};

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
				variant="outline"
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
	const { session, setSession, setUndo, change } = useSession();
	const navigate = useNavigate();
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
		const first = shuffle(draft.players)[0];
		const assigned = shuffle(characters);
		const selectedMissions = shuffle(missions).slice(0, 3);
		change((current) => ({
			...current,
			firstPlayerId: first.id,
			activePlayerId: first.id,
			players: current.players.map((player, index) => ({
				...player,
				character: assigned[index],
			})),
			missions: selectedMissions,
		}));
	};
	const confirm = () => {
		if (
			!draft?.firstPlayerId ||
			draft.missions.length !== 3 ||
			draft.players.some((player) => !player.character)
		)
			return;
		change((current) => ({ ...current, setupComplete: true }));
		navigate({ to: '/play' });
	};
	const returnToPlayerSetup = () => {
		setSession(null);
		setUndo([]);
	};
	if (!draft)
		return (
			<main {...stylex.props(styles.app, styles.setup)}>
				<header {...stylex.props(styles.setupHeader)}>
					<div {...stylex.props(styles.setupUtility)}>
						<Link to="/" {...stylex.props(styles.link)}>
							Mistborn Player Aid
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
						<label {...stylex.props(styles.fieldLabel)}>
							Players
							<NativeSelect
								value={count}
								onChange={(event) => {
									const next = Number(event.target.value);
									setCount(next);
									setPlayers((current) =>
										Array.from(
											{ length: next },
											(_, index) =>
												current[index] ?? {
													id: `player-draft-${index + 1}`,
													name: '',
												},
										),
									);
								}}
							>
								<NativeSelectOption value={2}>2</NativeSelectOption>
								<NativeSelectOption value={3}>3</NativeSelectOption>
								<NativeSelectOption value={4}>4</NativeSelectOption>
							</NativeSelect>
						</label>
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
	const first = draft.players.find(
		(player) => player.id === draft.firstPlayerId,
	);
	const turnOrder = first
		? [
				...draft.players.slice(
					draft.players.findIndex((player) => player.id === first.id),
				),
				...draft.players.slice(
					0,
					draft.players.findIndex((player) => player.id === first.id),
				),
			]
		: [];
	return (
		<main {...stylex.props(styles.app, styles.setup)}>
			<header {...stylex.props(styles.setupHeader)}>
				<div {...stylex.props(styles.setupUtility)}>
					<Link to="/" {...stylex.props(styles.link)}>
						Mistborn Player Aid
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
					disabled={
						!first ||
						draft.missions.length !== 3 ||
						draft.players.some((player) => !player.character)
					}
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
