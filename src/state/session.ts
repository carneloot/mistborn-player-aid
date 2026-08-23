import { BrowserKeyValueStore } from '@effect/platform-browser';
import * as Atom from 'effect/unstable/reactivity/Atom';

import { PersistedSessionSchema, type Session } from '../domain/session';

const runtime = Atom.runtime(BrowserKeyValueStore.layerLocalStorage);

export const sessionAtom = Atom.kvs({
	runtime,
	key: 'mistborn-player-aid/session-v1',
	schema: PersistedSessionSchema,
	defaultValue: () => null,
});

export type UndoState = Session | null;
export const undoAtom = Atom.make<UndoState[]>([]);

export const updateSession = (
	previous: Session | null,
	update: (session: Session) => Session,
	undo: UndoState[],
): { session: Session | null; undo: UndoState[] } => {
	if (previous === null) return { session: null, undo };
	return { session: update(previous), undo: [...undo, previous].slice(-20) };
};
