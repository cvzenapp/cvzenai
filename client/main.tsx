import "./global.css";
import App from "./App";
import { createRoot } from "react-dom/client";
import { initTokenDebugger, cleanupInvalidTokens } from "./lib/tokenDebugger";

// Initialize token debugger to catch invalid token writes
if (import.meta.env.DEV) {
  initTokenDebugger();
}

// Clean up any invalid tokens on app start
cleanupInvalidTokens();

createRoot(document.getElementById("root")!).render(<App />);