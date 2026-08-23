import { RouterProvider } from "@tanstack/react-router"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { router } from "./router"
import "./styles.css"
import "./stylex/tokens.stylex"

createRoot(document.getElementById("root")!).render(<StrictMode><RouterProvider router={router} /></StrictMode>)
