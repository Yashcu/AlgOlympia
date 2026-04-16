import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import Profile from "./components/Profile";

function App() {
  return (
    <div>
      <SignedOut>
        <SignInButton />
      </SignedOut>

      <SignedIn>
        <UserButton />
        <Profile />
      </SignedIn>
    </div>
  );
}

export default App;
