type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "danger" | "ghost" | "outline";
    loading?: boolean;
    size?: "sm" | "md";
    fullWidth?: boolean;
};

export default function Button({
    variant = "primary",
    loading,
    size = "md",
    fullWidth = false,
    children,
    className = "",
    ...rest
}: Props) {
    const base = `inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus:outline-none ${fullWidth ? "w-full" : ""}`;

    const sizes = {
        sm: "px-3 py-1.5 text-xs rounded-lg",
        md: "px-4 py-2.5 text-sm rounded-xl",
    };

    // Apple-style pure, flat colors with subtle hover/active states
    const styles = {
        primary: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        danger: "bg-[#FF3B30] text-white hover:bg-[#FF453A] shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        ghost: "bg-transparent text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900",
        outline: "border border-zinc-200/80 text-zinc-700 bg-white hover:bg-zinc-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
    };

    return (
        <button
            className={`${base} ${sizes[size]} ${styles[variant]} ${className}`}
            disabled={loading || rest.disabled}
            {...rest}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Processing...
                </span>
            ) : children}
        </button>
    );
}