"use client";

import createGlobe from "cobe";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface GlobeProps {
    className?: string;
    globeConfig?: any;
    data?: any[];
}

// Helper to convert hex to [r, g, b] (0-1 range)
// Handles #RRGGBB
const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
};

export function World({ className, globeConfig, data }: GlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pointerInteracting = useRef(null);
    const pointerInteractionMovement = useRef(0);
    const [r, setR] = useState(0);

    const updatePointerInteraction = (value: any) => {
        pointerInteractionMovement.current = value;
        if (canvasRef.current) {
            canvasRef.current.style.cursor = value ? "grabbing" : "grab";
        }
    };

    let width = 0;

    useEffect(() => {
        let phi = 0;

        if (!canvasRef.current) return;

        width = canvasRef.current.offsetWidth;
        let globe: any;

        const onResize = () => {
            if (canvasRef.current) {
                width = canvasRef.current.offsetWidth;
            }
        };

        window.addEventListener("resize", onResize);
        onResize();

        // Map Aceternity config to Cobe config
        // Defaults are provided if config is missing
        const baseColor = globeConfig?.globeColor ? hexToRgb(globeConfig.globeColor) : [0.3, 0.3, 1];
        const glowColor = globeConfig?.atmosphereColor ? hexToRgb(globeConfig.atmosphereColor) : [1, 1, 1];
        const markerColor = [1, 0, 0]; // Default red for testing if needed

        setTimeout(() => {
            if (!canvasRef.current) return;
            globe = createGlobe(canvasRef.current, {
                devicePixelRatio: 2,
                width: width * 2,
                height: width * 2,
                phi: 0,
                theta: 0,
                dark: 1,
                diffuse: 1.2,
                mapSamples: 16000,
                mapBrightness: 6,
                baseColor: baseColor,
                markerColor: markerColor,
                glowColor: glowColor,
                opacity: 1,
                offset: [0, 0],
                markers: [], // FIX: markers must be defined to avoid crash
                onRender: (state: any) => {
                    if (!pointerInteracting.current) {
                        phi += 0.003; // Auto-rotation speed
                    }
                    state.phi = phi + r;
                },
            });
        }, 10)

        // Opacity fade-in for smooth loading
        if (canvasRef.current) {
            canvasRef.current.style.opacity = "0";
            setTimeout(() => {
                if (canvasRef.current) canvasRef.current.style.opacity = "1";
            }, 300);
        }

        return () => {
            if (globe) globe.destroy();
            window.removeEventListener("resize", onResize);
        };
    }, [globeConfig, data, r]);

    return (
        <div
            className={cn(
                "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
                className
            )}
        >
            <canvas
                className={cn(
                    "h-full w-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
                )}
                ref={canvasRef}
                onPointerDown={(e) => {
                    pointerInteracting.current =
                        e.clientX - pointerInteractionMovement.current;
                    updatePointerInteraction(
                        e.clientX - pointerInteractionMovement.current
                    );
                }}
                onPointerUp={() => {
                    pointerInteracting.current = null;
                    updatePointerInteraction(null);
                }}
                onPointerOut={() => {
                    pointerInteracting.current = null;
                    updatePointerInteraction(null);
                }}
                onMouseMove={(e) => {
                    if (pointerInteracting.current !== null) {
                        const delta = e.clientX - pointerInteracting.current;
                        pointerInteractionMovement.current = delta;
                        setR(delta / 200);
                    }
                }}
                onTouchMove={(e) => {
                    if (pointerInteracting.current !== null && e.touches[0]) {
                        const delta = e.touches[0].clientX - pointerInteracting.current;
                        pointerInteractionMovement.current = delta;
                        setR(delta / 200);
                    }
                }}
            />
        </div>
    );
}
