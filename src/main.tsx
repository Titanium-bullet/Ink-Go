import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";
import { WalletProvider } from "./state/wallet";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </LanguageProvider>
  </StrictMode>,
);
