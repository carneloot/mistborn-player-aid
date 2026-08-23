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
	acknowledged: Schema.Array(Schema.String),
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
	preferences: Schema.Struct({ dim: Schema.Boolean }),
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
		acknowledged: [],
		lastPayment: null,
	},
	preferences: { dim: false },
});

export const baselineTraining = (session: Session): number =>
	Math.floor(session.completedTurns / session.players.length) + 1;

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
