export default function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={`w-full px-4 py-3 rounded-xl border border-zinc-200/80 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 disabled:opacity-50 disabled:bg-zinc-50 ${className}`}
        />
    );
}