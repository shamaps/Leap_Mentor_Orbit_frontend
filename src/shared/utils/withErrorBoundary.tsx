// src/shared/utils/withErrorBoundary.tsx
import type { ComponentType } from "react";
import RouteErrorBoundary from "@/shared/components/RouteErrorBoundary";

function withErrorBoundary<P extends object>(
    WrappedComponent: ComponentType<P>,
    zone?: string
) {
    const ComponentWithBoundary = (props: P) => (
        <RouteErrorBoundary zone={zone}>
            <WrappedComponent {...props} />
        </RouteErrorBoundary>
    );

    // Sets a readable name in React DevTools instead of "ComponentWithBoundary"
    const wrappedName =
        WrappedComponent.displayName || WrappedComponent.name || "Component";
    ComponentWithBoundary.displayName = `withErrorBoundary(${wrappedName})`;

    return ComponentWithBoundary;
}

export default withErrorBoundary;