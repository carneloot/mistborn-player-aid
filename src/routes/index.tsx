import { createFileRoute } from "@tanstack/react-router"
import { LaunchPage } from "../app"

export const Route = createFileRoute("/")({
  component: LaunchPage,
})
