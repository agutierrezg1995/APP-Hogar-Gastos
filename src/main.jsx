import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/** Monta la aplicacion React en el contenedor raiz. */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/** Registra service worker para instalación y cache básico PWA. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
