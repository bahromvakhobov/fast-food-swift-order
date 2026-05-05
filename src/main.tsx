import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import '@google/model-viewer';


createRoot(document.getElementById("root")!).render(<App />);
