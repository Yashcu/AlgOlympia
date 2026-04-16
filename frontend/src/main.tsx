import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import "./index.css";
import App from "./App.tsx";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={clerkPubKey}>
    <App />
  </ClerkProvider>,
);
