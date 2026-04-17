type CardProps = {
    children: React.ReactNode;
    className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
    return (
        <div className={`w-full bg-white border border-zinc-200/60 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${className}`}>
            {children}
        </div>
    );
}