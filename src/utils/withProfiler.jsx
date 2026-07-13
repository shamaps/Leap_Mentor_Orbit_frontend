import { Profiler } from "react";

/**
 * Logs mount/update timing for a component.
 * Only logs in development to avoid overhead in production.
 *
 * id        - name of the component being profiled
 * phase     - "mount" | "update" | "nested-update"
 * actualDuration - time spent rendering this commit
 * baseDuration   - estimated time to render without memoization
 * startTime / commitTime - timestamps for this commit
 */
function onRenderCallback(
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
) {
    if (import.meta.env.DEV) {
        console.log(
            `[Profiler] ${id} | ${phase} | actual: ${actualDuration.toFixed(
                2
            )}ms | base: ${baseDuration.toFixed(2)}ms`
        );
    }
}

export function withProfiler(Component, id) {
    return function ProfiledComponent(props) {
        return (
            <Profiler id={id} onRender={onRenderCallback}>
                <Component {...props} />
            </Profiler>
        );
    };
}