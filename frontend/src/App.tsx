import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import SignInPage from "./pages/SignInPage";
import DashboardLayout from "./layouts/DashboardLayout";
import TeamPage from "./components/TeamPage";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/signin"
          element={
            <>
              <SignedOut>
                <SignInPage />
              </SignedOut>
              <SignedIn>
                <Navigate to="/" replace />
              </SignedIn>
            </>
          }
        />

        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <DashboardLayout>
                  <TeamPage />
                </DashboardLayout>
              </SignedIn>
              <SignedOut>
                <Navigate to="/signin" replace />
              </SignedOut>
            </>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
