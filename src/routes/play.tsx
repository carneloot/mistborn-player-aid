import { createFileRoute } from "@tanstack/react-router"
import { PlayPage } from "../app"

export const Route = createFileRoute("/play")({
  component: PlayPage,
})
