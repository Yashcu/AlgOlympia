import { UserButton, useUser } from "@clerk/clerk-react";

export default function Navbar() {
    const { user } = useUser();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-zinc-200/50 transition-all duration-300">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        A
                    </div>
                    <span className="font-semibold text-zinc-900 text-sm tracking-tight">AlgOlympia</span>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {user && (
                        <span className="hidden sm:block text-sm font-medium text-zinc-500">
                            {user.firstName ?? user.emailAddresses[0]?.emailAddress}
                        </span>
                    )}
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-8 h-8 rounded-full border border-zinc-200",
                            },
                        }}
                    />
                </div>
            </div>
        </header>
    );
}