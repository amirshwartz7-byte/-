import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import SetupRequired from "./pages/SetupRequired.tsx";
import { AppProvider } from "./store/AppContext";
import { isDemoMode, isSupabaseConfigured } from "./lib/supabaseClient";
import DemoNavigator from "./components/DemoNavigator.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <HashRouter>
        <AppProvider>
          <App />
          {isDemoMode && <DemoNavigator />}
        </AppProvider>
      </HashRouter>
    ) : (
      <SetupRequired />
    )}
  </StrictMode>
);
