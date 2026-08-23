import { useAtomSet, useAtomValue } from "@effect/atom-react"
import type { Session } from "../domain/session"
import { sessionAtom, undoAtom, updateSession } from "../state/session"

export function useSession() {
  const session = useAtomValue(sessionAtom)
  const setSession = useAtomSet(sessionAtom)
  const undo = useAtomValue(undoAtom)
  const setUndo = useAtomSet(undoAtom)
  const change = (fn: (current: Session) => Session) => {
    const next = updateSession(session, fn, undo)
    setSession(next.session)
    setUndo(next.undo)
  }
  const undoLast = () => {
    const previous = undo.at(-1)
    if (previous !== undefined) {
      setSession(previous)
      setUndo(undo.slice(0, -1))
    }
  }
  return { session, setSession, setUndo, change, undoLast, canUndo: undo.length > 0 }
}
