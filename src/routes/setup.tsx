import { createFileRoute } from "@tanstack/react-router"
import { SetupPage } from "../app"

export const Route = createFileRoute("/setup")({
  component: SetupPage,
})
