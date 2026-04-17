import React from "react";
import { motion } from "framer-motion";

interface ToggleProps {
    options: string[];
    activeOption: string;
    onChange: (option: string) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ options, activeOption, onChange }) => {
    return (
        <div className="flex p-1 bg-zinc-100/80 rounded-xl mb-8 relative shadow-inner">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none ${activeOption === option ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                        }`}
                >
                    {option}
                </button>
            ))}
            <motion.div
                className="absolute inset-y-1 bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]"
                initial={false}
                animate={{
                    left: `calc(${(options.indexOf(activeOption) * 100) / options.length}% + 4px)`,
                    width: `calc(${100 / options.length}% - 8px)`,
                }}
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
        </div>
    );
};