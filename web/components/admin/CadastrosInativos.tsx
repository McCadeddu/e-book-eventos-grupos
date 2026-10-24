import type { Grupo } from "../../lib/types";
import type { EventoAdmin } from "../../lib/admin-types";
import { baseButtonStyle } from "./formulario-ui";

type Props = {
    ano: number;
    grupos: Grupo[];
    eventos: EventoAdmin[];
    onAtivar: (setor: "grupos" | "eventos", id: string) => Promise<void>;
};

export default function CadastrosInativos({ ano, grupos, eventos, onAtivar }: Props) {
    const registros = [
        ...grupos.map(g => ({ id: g.id, nome: g.nome, setor: "grupos" as const })),
        ...eventos.map(e => ({ id: e.id, nome: e.titulo, setor: "eventos" as const })),
    ];
    return (
        <details style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f3f5f6", borderRadius: "12px" }}>
            <summary>Cadastros inativos em {ano} ({registros.length})</summary>
            <p>Os conteúdos e encontros estão preservados. Reativar inclui o cadastro novamente nesta edição, mantendo sua visibilidade anterior.</p>
            {registros.length === 0 ? <p>Nenhum cadastro desativado neste ano.</p> : (
                <ul style={{ paddingLeft: "1.25rem" }}>
                    {registros.map(r => (
                        <li key={`${r.setor}-${r.id}`} style={{ marginBottom: "0.75rem" }}>
                            <span>{r.setor === "grupos" ? "Grupo" : "Evento"}: {r.nome} </span>
                            <button type="button" style={baseButtonStyle("#0b6b45")}
                                aria-label={`Reativar ${r.nome} em ${ano}`}
                                onClick={() => void onAtivar(r.setor, r.id)}>
                                Reativar em {ano}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </details>
    );
}
