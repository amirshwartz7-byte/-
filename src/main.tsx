import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import SetupRequired from "./pages/SetupRequired.tsx";
import { AppProvider } from "./store/AppContext";
import { isSupabaseConfigured } from "./lib/supabaseClient";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <HashRouter>
        <AppProvider>
          <App />
        </AppProvider>
      </HashRouter>
    ) : (
      <SetupRequired />
    )}
  </StrictMode>
);
