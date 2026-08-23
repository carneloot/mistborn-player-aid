import * as stylex from '@stylexjs/stylex';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
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

const shuffle = <T,>(values: readonly T[]) =>
	[...values].sort(() => Math.random() - 0.5);

function SetupPage() {
	const { session, setSession, setUndo, change } = useSession();
	const navigate = useNavigate();
	const [count, setCount] = useState(session?.players.length ?? 2);
	const [names, setNames] = useState(
		() =>
			session?.players.map((player) => player.name) ?? ['Player 1', 'Player 2'],
	);
	const draft = session && !session.setupComplete ? session : null;
	const initialize = () => {
		const players = Array.from({ length: count }, (_, index) => ({
			name: names[index]?.trim() || `Player ${index + 1}`,
			color: playerColors[index] as PlayerColor,
			symbol: ['◆', '●', '▲', '■'][index],
		}));
		setSession(createSession(players));
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
	if (!draft)
		return (
			<main {...stylex.props(styles.app, styles.setup)}>
				<header {...stylex.props(styles.setupHeader)}>
					<Link to="/" {...stylex.props(styles.link)}>
						Mistborn Player Aid
					</Link>
					<h1 {...stylex.props(styles.heading, styles.setupHeading)}>
						Start a game
					</h1>
				</header>
				<Card className={stylex.props(styles.appCard).className}>
					<label {...stylex.props(styles.fieldLabel)}>
						Players
						<NativeSelect
							value={count}
							onChange={(event) => {
								const next = Number(event.target.value);
								setCount(next);
								setNames((current) =>
									Array.from(
										{ length: next },
										(_, index) => current[index] ?? `Player ${index + 1}`,
									),
								);
							}}
						>
							<NativeSelectOption value={2}>2</NativeSelectOption>
							<NativeSelectOption value={3}>3</NativeSelectOption>
							<NativeSelectOption value={4}>4</NativeSelectOption>
						</NativeSelect>
					</label>
					{Array.from({ length: count }, (_, index) => (
						<label key={index} {...stylex.props(styles.fieldLabel)}>
							Player {index + 1}
							<Input
								value={names[index] ?? ''}
								maxLength={20}
								onChange={(event) =>
									setNames((current) =>
										current.map((name, nameIndex) =>
											nameIndex === index ? event.target.value : name,
										),
									)
								}
							/>
						</label>
					))}
					<Button onClick={initialize}>Continue to randomizers</Button>
				</Card>
			</main>
		);
	const first = draft.players.find(
		(player) => player.id === draft.firstPlayerId,
	);
	return (
		<main {...stylex.props(styles.app, styles.setup)}>
			<header {...stylex.props(styles.setupHeader)}>
				<Link to="/" {...stylex.props(styles.link)}>
					Mistborn Player Aid
				</Link>
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
					<h2 {...stylex.props(styles.headingTwo)}>1. First player</h2>
					<p {...stylex.props(styles.paragraph)}>
						{first ? (
							<>
								<strong>{first.name}</strong> goes first. Starting health: 36,
								then +2, +4
								{draft.players.length === 4 ? ', +4 and 1 Boxing' : ''}.
							</>
						) : (
							'Choose a random first player.'
						)}
					</p>
					{draft.players.length > 2 && first && (
						<p {...stylex.props(styles.paragraph)}>
							Target begins with {draft.players.at(-1)?.name}, last in turn
							order from first player.
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
					onClick={rollSetup}
				>
					{first ? 'Reroll results' : 'Randomize setup'}
				</Button>
				<Button
					className={stylex.props(styles.setupAction).className}
					variant="secondary"
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
