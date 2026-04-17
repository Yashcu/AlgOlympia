import { SignIn, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SignInPage() {
    const { isSignedIn } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isSignedIn) navigate("/", { replace: true });
    }, [isSignedIn, navigate]);

    return (
        <div className="min-h-[100dvh] bg-[#FBFBFD] flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">

            <div className="w-full max-w-md flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Minimal Branding */}
                <div className="flex flex-col items-center text-center w-full">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-xl font-bold shadow-sm mb-6">
                        A
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                        Sign in to AlgOlympia
                    </h1>
                    <p className="mt-2 text-sm text-zinc-500">
                        Welcome back. Please verify your identity.
                    </p>
                </div>

                {/* Clerk Wrapper */}
                <div className="flex justify-center w-full">
                    <SignIn
                        appearance={{
                            elements: {
                                card: "shadow-none border-none bg-transparent p-0",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                footer: "hidden",
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}