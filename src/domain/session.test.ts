import { describe, expect, it } from 'vitest';

import {
	applySetupRandomization,
	adjustBoxings,
	adjustScratchpad,
	advanceTurn,
	baselineTraining,
	boxingsFromTurnCoins,
	completeSetup,
	createSession,
	isSetupReady,
	paymentFor,
	spend,
	turnOrderFromFirstPlayer,
} from './session';

const session = () =>
	createSession([
		{ name: 'Ari', color: 'ember', symbol: '◆' },
		{ name: 'Bea', color: 'cobalt', symbol: '●' },
	]);

describe('paymentFor', () => {
	it('uses turn coins before Boxings', () => {
		expect(paymentFor(4, 3, 5)).toEqual({
			paidTurnCoins: 4,
			paidBoxings: 1,
			remainingUnpaid: 0,
		});
	});

	it('reports an unaffordable remainder', () => {
		expect(paymentFor(1, 1, 4)).toEqual({
			paidTurnCoins: 1,
			paidBoxings: 1,
			remainingUnpaid: 2,
		});
	});
});

describe('baselineTraining', () => {
	it("includes the current player's start-of-turn advance", () => {
		expect(baselineTraining(session())).toBe(1);
		expect(baselineTraining({ ...session(), completedTurns: 2 })).toBe(2);
	});
});

describe('boxingsFromTurnCoins', () => {
	it('converts each pair of turn coins into a Boxing', () => {
		expect(boxingsFromTurnCoins(5)).toBe(2);
	});
});

describe('turnOrderFromFirstPlayer', () => {
	it('rotates the entered player order from the first player', () => {
		const game = createSession([
			{ name: 'Ari', color: 'ember', symbol: '◆' },
			{ name: 'Bea', color: 'cobalt', symbol: '●' },
			{ name: 'Cam', color: 'verdant', symbol: '▲' },
		]);

		expect(turnOrderFromFirstPlayer(game.players, 'player-2')).toMatchObject([
			{ id: 'player-2' },
			{ id: 'player-3' },
			{ id: 'player-1' },
		]);
		expect(turnOrderFromFirstPlayer(game.players, null)).toEqual([]);
	});
});

describe('setup transitions', () => {
	it('assigns a first player, unique characters, and three unique missions', () => {
		const randomized = applySetupRandomization(session(), {
			firstPlayerId: 'player-2',
			assignedCharacters: ['Kelsier', 'Vin'],
			selectedMissions: ['Confrontation', 'A Hero Rises', 'The Final Empire'],
		});

		expect(randomized.firstPlayerId).toBe('player-2');
		expect(randomized.activePlayerId).toBe(randomized.firstPlayerId);
		expect(
			new Set(randomized.players.map((player) => player.character)).size,
		).toBe(randomized.players.length);
		expect(new Set(randomized.missions).size).toBe(3);
	});

	it('only completes a fully randomized setup', () => {
		const game = session();
		expect(isSetupReady(game)).toBe(false);
		expect(completeSetup(game)).toBe(game);

		const ready = {
			...game,
			firstPlayerId: 'player-1',
			players: game.players.map((player) => ({
				...player,
				character: 'Vin',
			})),
			missions: ['Confrontation', 'A Hero Rises', 'The Final Empire'],
		};
		expect(isSetupReady(ready)).toBe(true);
		expect(completeSetup(ready)).toMatchObject({ setupComplete: true });
	});
});

describe('play transitions', () => {
	it('advances the turn, awards earned Boxings, and clears the scratchpad', () => {
		const game = {
			...session(),
			activePlayerId: 'player-1',
			scratchpad: {
				coins: 5,
				combat: 3,
				missionPoints: 2,
				lastPayment: 'Paid 1 turn coin.',
			},
		};

		const next = advanceTurn(game, 1);

		expect(next.activePlayerId).toBe('player-2');
		expect(next.completedTurns).toBe(1);
		expect(next.round).toBe(1);
		expect(next.players[0].boxings).toBe(2);
		expect(next.scratchpad).toEqual({
			coins: 0,
			combat: 0,
			missionPoints: 0,
			lastPayment: null,
		});
	});

	it('keeps counters non-negative and pays coins before Boxings', () => {
		const game = {
			...session(),
			activePlayerId: 'player-1',
			players: [{ ...session().players[0], boxings: 2 }, session().players[1]],
			scratchpad: {
				coins: 4,
				combat: 0,
				missionPoints: 0,
				lastPayment: null,
			},
		};
		const paid = spend(game, 5);

		expect(paid.players[0].boxings).toBe(1);
		expect(paid.scratchpad).toMatchObject({
			coins: 0,
			lastPayment: 'Paid 4 turn coins + 1 Boxing.',
		});
		expect(adjustScratchpad(game, 'coins', -5).scratchpad.coins).toBe(0);
		expect(adjustBoxings(game, 'player-1', -3).players[0].boxings).toBe(0);
	});
});
