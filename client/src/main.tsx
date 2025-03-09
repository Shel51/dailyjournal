import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import fonts
import "@fontsource/merriweather";
import "@fontsource/lora";

createRoot(document.getElementById("root")!).render(<App />);