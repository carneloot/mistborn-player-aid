import * as stylex from "@stylexjs/stylex"
import { createRootRoute, Outlet } from "@tanstack/react-router"
import { styles } from "../app.styles"

function RootLayout() {
  return <div {...stylex.props(styles.root)}><Outlet /></div>
}

export const Route = createRootRoute({
  component: RootLayout,
})
