import { useEffect } from "react";

/**
 * Logs when a component mounts and unmounts, plus how long it stayed alive.
 * Use only in development.
 */
export function useMountLogger(componentName) {
    useEffect(() => {
        if (!import.meta.env.DEV) return;

        const mountTime = performance.now();
        console.log(`[Mount] ${componentName} mounted`);

        return () => {
            const aliveDuration = performance.now() - mountTime;
            console.log(
                `[Unmount] ${componentName} unmounted after ${aliveDuration.toFixed(
                    2
                )}ms`
            );
        };
    }, [componentName]);
}