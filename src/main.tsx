import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { CapitalProvider } from "./contexts/CapitalContext";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CapitalProvider>
      <App />
    </CapitalProvider>
  </React.StrictMode>,
);
