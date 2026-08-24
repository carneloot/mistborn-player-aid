import { useAtomSet, useAtomValue } from '@effect/atom-react';

import type { Session } from '../domain/session';
import { randomizeSetupAtom, sessionAtom, undoAtom } from '../state/session';

export function useSession() {
	const session = useAtomValue(sessionAtom);
	const setSession = useAtomSet(sessionAtom);
	const undo = useAtomValue(undoAtom);
	const setUndo = useAtomSet(undoAtom);
	const randomizeSetup = useAtomSet(randomizeSetupAtom);
	const change = (fn: (current: Session) => Session) =>
		setSession((current) => {
			if (current === null) return current;
			const next = fn(current);
			if (next !== current)
				setUndo((previous) => [...previous, current].slice(-20));
			return next;
		});
	const undoLast = () =>
		setUndo((current) => {
			const previous = current.at(-1);
			if (previous !== undefined) setSession(previous);
			return current.slice(0, -1);
		});
	return {
		session,
		setSession,
		setUndo,
		randomizeSetup,
		change,
		undoLast,
		canUndo: undo.length > 0,
	};
}
