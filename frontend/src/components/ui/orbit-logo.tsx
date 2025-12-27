"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

export const OrbitLogo = ({ className }: { className?: string }) => {
    return (
        <div className={cn("w-full h-full relative flex items-center justify-center", className)}>
            <Image
                src="/orbit-logo.png"
                alt="Orbit Logo"
                fill
                className="object-contain invert brightness-0"
                priority
            />
        </div>
    );
};
