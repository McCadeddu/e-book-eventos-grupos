export default function AvisosEncontro({ avisos }: { avisos: string[] }) {
    if (avisos.length === 0) return null;
    return (
        <aside aria-label="Informações a conferir" style={{ margin: "0.75rem 0", padding: "0.75rem", background: "#fff4d4", color: "#694500", borderRadius: "8px" }}>
            <strong>Informações a conferir</strong>
            <ul style={{ margin: "0.3rem 0 0", paddingLeft: "1.25rem" }}>
                {avisos.map(aviso => <li key={aviso}>{aviso}</li>)}
            </ul>
        </aside>
    );
}
