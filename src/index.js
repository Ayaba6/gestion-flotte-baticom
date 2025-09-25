import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.js";
import "./styles/global.css";
import { ToastProvider } from "./components/ui/use-toast.js"; // ✅ ajout
import * as serviceWorker from './serviceWorker.js'; // ✅ Ajout

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <ToastProvider> {/* ✅ englobe l'app */}
      <App />
    </ToastProvider>
  </BrowserRouter>
);
