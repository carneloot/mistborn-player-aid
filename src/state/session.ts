import { BrowserKeyValueStore } from '@effect/platform-browser';
import { Effect, Random } from 'effect';
import * as Atom from 'effect/unstable/reactivity/Atom';

import {
	applySetupRandomization,
	characters,
	missions,
	PersistedSessionSchema,
	type Session,
} from '../domain/session';

const runtime = Atom.runtime(BrowserKeyValueStore.layerLocalStorage);

export const sessionAtom = Atom.kvs({
	runtime,
	key: 'mistborn-player-aid/session-v1',
	schema: PersistedSessionSchema,
	defaultValue: () => null,
});

export type UndoState = Session | null;
export const undoAtom = Atom.make<UndoState[]>([]);

export const randomizeSetupAtom = Atom.fn((_, get) =>
	Effect.gen(function* () {
		const session = get(sessionAtom);
		if (session === null || session.setupComplete) return session;
		const [players, assignedCharacters, selectedMissions] = yield* Effect.all(
			[
				Random.shuffle(session.players),
				Random.shuffle(characters),
				Random.shuffle(missions),
			],
			{ concurrency: 3 },
		);
		const firstPlayer = players[0];
		if (!firstPlayer) return session;
		const randomized = applySetupRandomization(session, {
			firstPlayerId: firstPlayer.id,
			assignedCharacters,
			selectedMissions: selectedMissions.slice(0, 3),
		});
		get.set(sessionAtom, randomized);
		return randomized;
	}).pipe(Effect.withSpan('randomizeSetup')),
);
