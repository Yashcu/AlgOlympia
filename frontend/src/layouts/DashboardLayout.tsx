import Navbar from '../components/Navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-[#FBFBFD]">
            <Navbar />
            <main className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}