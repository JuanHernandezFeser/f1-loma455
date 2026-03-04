import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then(() => {
                console.log("Service Worker registrado");
            })
            .catch(err => {
                console.error("Error registrando SW", err);
            });
    });
}

createRoot(document.getElementById("root")!).render(<App />);