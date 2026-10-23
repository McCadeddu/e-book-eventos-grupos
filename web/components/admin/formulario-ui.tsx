import type { ReactNode } from "react";

export function baseInputStyle() {
    return {
        width: "100%",
        padding: "0.65rem 0.8rem",
        borderRadius: "8px",
        border: "1px solid #d8d2c8",
        fontSize: "0.95rem",
        backgroundColor: "#ffffff",
    } as const;
}

export function baseButtonStyle(backgroundColor: string, color = "#ffffff") {
    return {
        padding: "0.55rem 0.95rem",
        backgroundColor,
        color,
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: 600,
    } as const;
}

export function CardFormulario({
    title,
    color,
    children,
}: {
    title: string;
    color: string;
    children: ReactNode;
}) {
    return (
        <div
            style={{
                marginTop: "1rem",
                padding: "1rem",
                border: `1px solid ${color}`,
                borderRadius: "10px",
                backgroundColor: "#ffffff",
                boxShadow: "0 3px 10px rgba(0,0,0,0.04)",
            }}
        >
            <h3 style={{ marginTop: 0, color }}>{title}</h3>
            {children}
        </div>
    );
}
