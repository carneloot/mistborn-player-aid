import { Schema } from 'effect';

export const playerColors = ['ember', 'cobalt', 'verdant', 'gold'] as const;
export type PlayerColor = (typeof playerColors)[number];

const PlayerSchema = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	color: Schema.Literals(playerColors),
	symbol: Schema.String,
	character: Schema.NullOr(Schema.String),
	boxings: Schema.Number,
});

const ScratchpadSchema = Schema.Struct({
	coins: Schema.Number,
	combat: Schema.Number,
	missionPoints: Schema.Number,
	lastPayment: Schema.NullOr(Schema.String),
});

export const SessionSchema = Schema.Struct({
	version: Schema.Literal(1),
	setupComplete: Schema.Boolean,
	players: Schema.Array(PlayerSchema),
	firstPlayerId: Schema.NullOr(Schema.String),
	activePlayerId: Schema.NullOr(Schema.String),
	round: Schema.Number,
	completedTurns: Schema.Number,
	missions: Schema.Array(Schema.String),
	scratchpad: ScratchpadSchema,
});

export const PersistedSessionSchema = Schema.NullOr(SessionSchema);
export type Player = Schema.Schema.Type<typeof PlayerSchema>;
export type Session = Schema.Schema.Type<typeof SessionSchema>;

export const characters = ['Vin', 'Kelsier', 'Marsh', 'Shan'] as const;
export const missions = [
	'Confrontation',
	'A Hero Rises',
	'The Final Empire',
	"The Survivor's Legacy",
	'Secrets of the Deepness',
	'A Matter of Trust',
	'The Well of Ascension',
	'The Lord Ruler',
] as const;

export const createSession = (
	players: Array<Pick<Player, 'name' | 'color' | 'symbol'>>,
): Session => ({
	version: 1,
	setupComplete: false,
	players: players.map((player, index) => ({
		...player,
		id: `player-${index + 1}`,
		character: null,
		boxings: 0,
	})),
	firstPlayerId: null,
	activePlayerId: null,
	round: 1,
	completedTurns: 0,
	missions: [],
	scratchpad: {
		coins: 0,
		combat: 0,
		missionPoints: 0,
		lastPayment: null,
	},
});

export const applySetupRandomization = (
	session: Session,
	{
		firstPlayerId,
		assignedCharacters,
		selectedMissions,
	}: {
		firstPlayerId: string;
		assignedCharacters: readonly string[];
		selectedMissions: readonly string[];
	},
): Session => {
	return {
		...session,
		firstPlayerId,
		activePlayerId: firstPlayerId,
		players: session.players.map((player, index) => ({
			...player,
			character: assignedCharacters[index],
		})),
		missions: [...selectedMissions],
	};
};

export const isSetupReady = (session: Session): boolean =>
	session.firstPlayerId !== null &&
	session.missions.length === 3 &&
	session.players.every((player) => player.character !== null);

export const completeSetup = (session: Session): Session =>
	isSetupReady(session) ? { ...session, setupComplete: true } : session;

export const turnOrderFromFirstPlayer = (
	players: readonly Player[],
	firstPlayerId: string | null,
): Player[] => {
	const firstIndex = players.findIndex((player) => player.id === firstPlayerId);
	return firstIndex < 0
		? []
		: [...players.slice(firstIndex), ...players.slice(0, firstIndex)];
};

export const startingBonus = (turnPosition: number): string => {
	if (turnPosition === 0) return '36 health';
	if (turnPosition === 1) return '38 health';
	if (turnPosition === 2) return '40 health';
	return '40 health · 1 Boxing';
};

export const baselineTraining = (session: Session): number =>
	Math.floor(session.completedTurns / session.players.length) + 1;

export const boxingsFromTurnCoins = (coins: number): number =>
	Math.floor(coins / 2);

export const paymentFor = (coins: number, boxings: number, cost: number) => {
	const paidTurnCoins = Math.min(coins, cost);
	const remaining = cost - paidTurnCoins;
	const paidBoxings = Math.min(boxings, remaining);
	return {
		paidTurnCoins,
		paidBoxings,
		remainingUnpaid: remaining - paidBoxings,
	};
};

export const advanceTurn = (session: Session, direction: 1 | -1): Session => {
	if (direction === -1 && session.completedTurns === 0) return session;
	const activeIndex = session.players.findIndex(
		(player) => player.id === session.activePlayerId,
	);
	if (activeIndex < 0) return session;
	const completedTurns =
		direction === 1
			? session.completedTurns + 1
			: Math.max(0, session.completedTurns - 1);
	const earnedBoxings =
		direction === 1 ? boxingsFromTurnCoins(session.scratchpad.coins) : 0;
	const nextIndex =
		(activeIndex + direction + session.players.length) % session.players.length;
	return {
		...session,
		activePlayerId: session.players[nextIndex].id,
		completedTurns,
		round: Math.floor(completedTurns / session.players.length) + 1,
		players: session.players.map((player) =>
			player.id === session.activePlayerId
				? { ...player, boxings: player.boxings + earnedBoxings }
				: player,
		),
		scratchpad: {
			...session.scratchpad,
			coins: 0,
			combat: 0,
			missionPoints: 0,
			lastPayment: null,
		},
	};
};

export const adjustScratchpad = (
	session: Session,
	key: keyof Omit<Session['scratchpad'], 'lastPayment'>,
	amount: number,
): Session => ({
	...session,
	scratchpad: {
		...session.scratchpad,
		[key]: Math.max(0, session.scratchpad[key] + amount),
	},
});

export const adjustBoxings = (
	session: Session,
	playerId: string,
	amount: number,
): Session => ({
	...session,
	players: session.players.map((player) =>
		player.id === playerId
			? { ...player, boxings: Math.max(0, player.boxings + amount) }
			: player,
	),
});

export const spend = (session: Session, cost: number): Session => {
	const player = session.players.find(
		(item) => item.id === session.activePlayerId,
	);
	if (!player) return session;
	const receipt = paymentFor(session.scratchpad.coins, player.boxings, cost);
	if (receipt.remainingUnpaid > 0) return session;
	const payment = `Paid ${receipt.paidTurnCoins} turn coin${receipt.paidTurnCoins === 1 ? '' : 's'}${receipt.paidBoxings ? ` + ${receipt.paidBoxings} Boxing${receipt.paidBoxings === 1 ? '' : 's'}` : ''}.`;
	return {
		...session,
		scratchpad: {
			...session.scratchpad,
			coins: session.scratchpad.coins - receipt.paidTurnCoins,
			lastPayment: payment,
		},
		players: session.players.map((item) =>
			item.id === player.id
				? { ...item, boxings: item.boxings - receipt.paidBoxings }
				: item,
		),
	};
};
