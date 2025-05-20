import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { OrganizationProvider } from "./contexts/OrganizationContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <OrganizationProvider>
      <App />
    </OrganizationProvider>
  </AuthProvider>
);
