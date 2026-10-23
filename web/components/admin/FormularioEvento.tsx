import { useState } from "react";
import type { Grupo } from "../../lib/types";
import type { EventoAdmin, ResultadoAcao } from "../../lib/admin-types";
import { CardFormulario, baseInputStyle, baseButtonStyle } from "./formulario-ui";
import { useEnvioFormulario } from "./useEnvioFormulario";

export default function FormularioEvento({
    evento,
    ano,
    grupos,
    submitLabel,
    onSubmit,
    onCancel,
}: {
    ano: number;
    evento?: EventoAdmin;
    grupos: Grupo[];
    submitLabel: string;
    onSubmit: (payload: Record<string, unknown>) => Promise<ResultadoAcao>;
    onCancel: () => void;
}) {
    const { status, salvando, enviar } = useEnvioFormulario(onSubmit);
    const [todos, setTodos] = useState(evento?.todos_os_grupos ?? false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const gruposSelecionados = todos ? [] : formData.getAll("grupos_envolvidos");

        await enviar({
            anoPastoral: ano,
            id: evento?.id,
            titulo: formData.get("titulo"),
            faixa_etaria: formData.get("faixa_etaria"),
            descricao: formData.get("descricao"),
            equipe: formData.get("equipe"),
            objetivo_ano: formData.get("objetivo_ano"),
            convite: formData.get("convite"),
            grupos_envolvidos: gruposSelecionados,
            todos_os_grupos: todos,
            visibilidade: formData.get("visibilidade"),
        });

    }

    return (
        <CardFormulario
            title={evento ? `Editar evento: ${evento.titulo}` : "Novo evento"}
            color="#ff6136"
        >
            <p>Conteúdo da edição {ano}. As alterações serão salvas somente neste ano.</p>
            <form data-setor="evento" onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
                <input
                    name="titulo"
                    defaultValue={evento?.titulo || ""}
                    aria-label="Titulo do evento"
                    placeholder="Titulo do evento"
                    required
                    style={baseInputStyle()}
                />
                <input
                    name="faixa_etaria"
                    defaultValue={evento?.faixa_etaria || ""}
                    aria-label="Faixa etaria"
                    placeholder="Faixa etaria"
                    style={baseInputStyle()}
                />
                <textarea
                    name="descricao"
                    defaultValue={evento?.descricao || ""}
                    aria-label="Descricao do evento"
                    placeholder="Descricao do evento"
                    rows={3}
                    style={baseInputStyle()}
                />
                <div
                    style={{
                        padding: "0.9rem",
                        borderRadius: "8px",
                        border: "1px solid #e0ddd7",
                        backgroundColor: "#faf9f6",
                    }}
                >
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        <label>
                            <input
                                type="radio"
                                name="modo_grupo"
                                checked={todos}
                                onChange={() => setTodos(true)}
                            />{" "}
                            Todos os grupos
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="modo_grupo"
                                checked={!todos}
                                onChange={() => setTodos(false)}
                            />{" "}
                            Selecionar grupos
                        </label>
                    </div>

                    {!todos && (
                        <div
                            style={{
                                display: "grid",
                                gap: "0.45rem",
                                marginTop: "0.8rem",
                            }}
                        >
                            {grupos.map((grupo) => (
                                <label key={grupo.id}>
                                    <input
                                        type="checkbox"
                                        name="grupos_envolvidos"
                                        value={grupo.id}
                                        defaultChecked={evento?.grupos_envolvidos?.includes(
                                            grupo.id
                                        )}
                                    />{" "}
                                    {grupo.nome}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <input
                    name="equipe"
                    defaultValue={evento?.equipe?.join(", ") || ""}
                    aria-label="Equipe separada por virgula"
                    placeholder="Equipe separada por virgula"
                    style={baseInputStyle()}
                />
                <textarea
                    name="objetivo_ano"
                    defaultValue={evento?.objetivo_ano || ""}
                    aria-label="Objetivo do ano"
                    placeholder="Objetivo do ano"
                    rows={3}
                    style={baseInputStyle()}
                />
                <textarea
                    name="convite"
                    defaultValue={evento?.convite || ""}
                    aria-label="Convite"
                    placeholder="Convite"
                    rows={2}
                    style={baseInputStyle()}
                />
                <select
                    aria-label="Visibilidade no e-book"
                    name="visibilidade"
                    defaultValue={evento?.visibilidade || "publico"}
                    style={baseInputStyle()}
                >
                    <option value="publico">Publico no e-book</option>
                    <option value="interno">Oculto no e-book</option>
                </select>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <button
                        type="submit"
                        disabled={salvando}
                        style={baseButtonStyle("#ff6136")}
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
