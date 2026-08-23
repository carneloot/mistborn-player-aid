import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { LaunchPage, PlayPage, RootLayout, SetupPage } from "./app"

const rootRoute = createRootRoute({ component: RootLayout })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: LaunchPage })
const setupRoute = createRoute({ getParentRoute: () => rootRoute, path: "/setup", component: SetupPage })
const playRoute = createRoute({ getParentRoute: () => rootRoute, path: "/play", component: PlayPage })
const routeTree = rootRoute.addChildren([indexRoute, setupRoute, playRoute])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
