import type { Grupo } from "../../lib/types";
import type { ResultadoAcao } from "../../lib/admin-types";
import { CardFormulario, baseInputStyle, baseButtonStyle } from "./formulario-ui";
import { useEnvioFormulario } from "./useEnvioFormulario";

export default function FormularioGrupo({
    grupo,
    submitLabel,
    onSubmit,
    onCancel,
}: {
    grupo?: Grupo;
    submitLabel: string;
    onSubmit: (payload: Record<string, unknown>) => Promise<ResultadoAcao>;
    onCancel: () => void;
}) {
    const { status, salvando, enviar } = useEnvioFormulario(onSubmit);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        await enviar({
            id: grupo?.id,
            slug: grupo?.slug,
            nome: formData.get("nome"),
            faixa_etaria: formData.get("faixa_etaria"),
            descricao: formData.get("descricao"),
            objetivo_ano: formData.get("objetivo_ano"),
            equipe: formData.get("equipe"),
            convite_final: formData.get("convite_final"),
        });

    }

    return (
        <CardFormulario
            title={grupo ? `Editar grupo: ${grupo.nome}` : "Novo grupo"}
            color="#4bbbc8"
        >
            <form data-setor="grupo" onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
                <input
                    name="nome"
                    defaultValue={grupo?.nome || ""}
                    aria-label="Nome do grupo"
                    placeholder="Nome do grupo"
                    required
                    style={baseInputStyle()}
                />
                <input
                    name="faixa_etaria"
                    defaultValue={grupo?.faixa_etaria || ""}
                    aria-label="Faixa etaria"
                    placeholder="Faixa etaria"
                    style={baseInputStyle()}
                />
                <textarea
                    name="descricao"
                    defaultValue={grupo?.descricao || ""}
                    aria-label="Descricao do grupo"
                    placeholder="Descricao do grupo"
                    rows={3}
                    style={baseInputStyle()}
                />
                <textarea
                    name="objetivo_ano"
                    defaultValue={grupo?.objetivo_ano || ""}
                    aria-label="Objetivo do ano"
                    placeholder="Objetivo do ano"
                    rows={3}
                    style={baseInputStyle()}
                />
                <input
                    name="equipe"
                    defaultValue={grupo?.equipe?.join(", ") || ""}
                    aria-label="Equipe separada por virgula"
                    placeholder="Equipe separada por virgula"
                    style={baseInputStyle()}
                />
                <textarea
                    name="convite_final"
                    defaultValue={grupo?.convite_final || ""}
                    aria-label="Convite final"
                    placeholder="Convite final"
                    rows={2}
                    style={baseInputStyle()}
                />
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <button
                        type="submit"
                        disabled={salvando}
                        style={baseButtonStyle("#4bbbc8")}
                    >
                        {salvando ? "Salvando..." : submitLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={baseButtonStyle("#ece7dd", "#3e4647")}
                    >
                        Cancelar
                    </button>
                </div>
                {status && <p style={{ color: "#8b0000", margin: 0 }}>{status}</p>}
            </form>
        </CardFormulario>
    );
}
