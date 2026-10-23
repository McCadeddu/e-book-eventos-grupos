import { useState } from "react";
import type { Grupo } from "../../lib/types";
import type { EventoAdmin, ResultadoAcao } from "../../lib/admin-types";
import { CardFormulario, baseInputStyle, baseButtonStyle } from "./formulario-ui";
import { useEnvioFormulario } from "./useEnvioFormulario";
import type { Encontro } from "../../lib/encontros-utils";

export default function FormularioEncontro({
    ano,
    encontro,
    grupo,
    evento,
    eventos,
    submitLabel,
    onSubmit,
    onCancel,
    mostrarVinculoEvento,
    permitirNivelEvento,
}: {
    ano: number;
    encontro?: Encontro;
    grupo?: Grupo;
    evento?: EventoAdmin;
    eventos: EventoAdmin[];
    submitLabel: string;
    onSubmit: (payload: Record<string, unknown>) => Promise<ResultadoAcao>;
    onCancel: () => void;
    mostrarVinculoEvento: boolean;
    permitirNivelEvento: boolean;
}) {
    const { status, salvando, enviar } = useEnvioFormulario(onSubmit);
    const [eventoId, setEventoId] = useState<string | null>(encontro?.evento_id || evento?.id || null);
    const [nivel, setNivel] = useState<"evento" | "organizacao">(
        encontro?.nivel === "organizacao" ? "organizacao" : "evento"
    );

    async function handleSubmit(eventoForm: React.FormEvent<HTMLFormElement>) {
        eventoForm.preventDefault();

        const formData = new FormData(eventoForm.currentTarget);
        const eventoSelecionado =
            String(formData.get("evento_id") || eventoId || "").trim() || null;
        const nivelAtual = permitirNivelEvento
            ? String(formData.get("nivel") || nivel)
            : encontro?.nivel || "evento";

        const basePayload = {
            anoPastoral: ano,
            tipo: formData.get("tipo"),
            titulo: formData.get("titulo"),
            horario: formData.get("horario"),
            local: formData.get("local"),
            visibilidade: formData.get("visibilidade"),
            nivel: nivelAtual,
            mostrar_no_anual:
                permitirNivelEvento && nivelAtual === "evento"
                    ? formData.get("mostrar_no_anual") === "on"
                    : encontro?.mostrar_no_anual ?? true,
        };

        const payload = encontro
            ? {
                  ...basePayload,
                  id: encontro.id,
                  grupo_id: mostrarVinculoEvento
                      ? eventoSelecionado
                          ? null
                          : grupo?.id || encontro.grupo_id || null
                      : null,
                  evento_id: evento?.id || eventoSelecionado,
                  data_inicio:
                      String(formData.get("data_inicio") || "").trim() ||
                      encontro.data_inicio ||
                      null,
                  data_fim: String(formData.get("data_fim") || "").trim() || null,
                  data_legivel: formData.get("data_legivel") || "",
              }
            : {
                  ...basePayload,
                  grupoId: mostrarVinculoEvento
                      ? eventoSelecionado
                          ? null
                          : grupo?.id || null
                      : null,
                  evento_id: evento?.id || eventoSelecionado,
                  dataInicio: String(formData.get("dataInicio") || "").trim() || null,
                  dataFim: String(formData.get("dataFim") || "").trim() || null,
                  dataLegivel: formData.get("dataLegivel") || "",
              };

        await enviar(payload);

    }

    return (
        <CardFormulario
            title={
                encontro
                    ? `Editar encontro${evento ? ` de ${evento.titulo}` : grupo ? ` de ${grupo.nome}` : ""}`
                    : `Novo encontro${evento ? ` de ${evento.titulo}` : grupo ? ` de ${grupo.nome}` : ""}`
            }
            color={evento ? "#ff6136" : "#4bbbc8"}
        >
            <form data-setor="encontro" onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
                {permitirNivelEvento && (
                    <>
                        <select
                            aria-label="Nível do encontro"
                    name="nivel"
                            value={nivel}
                            onChange={(e) =>
                                setNivel(
                                    e.target.value === "organizacao"
                                        ? "organizacao"
                                        : "evento"
                                )
                            }
                            style={baseInputStyle()}
                        >
                            <option value="evento">Evento principal</option>
                            <option value="organizacao">Equipe organizativa</option>
                        </select>

                        <label style={{ opacity: nivel === "organizacao" ? 0.6 : 1 }}>
                            <input
                                type="checkbox"
                                name="mostrar_no_anual"
                                defaultChecked={encontro?.mostrar_no_anual ?? true}
                                disabled={nivel === "organizacao"}
                            />{" "}
                            Mostrar no calendario anual
                        </label>
                    </>
                )}

                <select
                    aria-label="Tipo do encontro"
                    name="tipo"
                    defaultValue={encontro?.tipo || (permitirNivelEvento ? "evento" : "encontro_regular")}
                    style={baseInputStyle()}
                >
                    {encontro?.tipo && !(permitirNivelEvento
                        ? ["evento", "preparacao", "avaliacao"]
                        : ["encontro_regular", "evento_especial"]).includes(encontro.tipo) && (
                        <option value={encontro.tipo}>{encontro.tipo} (tipo existente)</option>
                    )}
                    {permitirNivelEvento ? (
                        <>
                            <option value="evento">Evento</option>
                            <option value="preparacao">Preparacao</option>
                            <option value="avaliacao">Avaliacao</option>
                        </>
                    ) : (
                        <>
                            <option value="encontro_regular">Encontro regular</option>
                            <option value="evento_especial">Evento especial</option>
                        </>
                    )}
                </select>

                {mostrarVinculoEvento && (
                    <select
                        aria-label="Evento vinculado"
                    name="evento_id"
                        value={eventoId || ""}
                        onChange={(e) => setEventoId(e.target.value || null)}
                        style={baseInputStyle()}
                    >
                        <option value="">Nenhum evento vinculado</option>
                        {eventos.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.titulo}
                            </option>
                        ))}
                    </select>
                )}

                <input
                    type="date"
                    name={encontro ? "data_inicio" : "dataInicio"}
                    aria-label={`Data de início do encontro em ${ano}`}
                    min={`${ano}-01-01`}
                    max={`${ano}-12-31`}
                    defaultValue={encontro?.data_inicio || ""}
                    required
                    style={baseInputStyle()}
                />
                <input
                    type="date"
                    aria-label="Data de término (opcional)"
                    name={encontro ? "data_fim" : "dataFim"}
                    defaultValue={encontro?.data_fim || ""}
                    style={baseInputStyle()}
                />
                <input
                    name={encontro ? "data_legivel" : "dataLegivel"}
                    defaultValue={encontro?.data_legivel || ""}
                    aria-label="Data legivel opcional"
                    placeholder="Data legivel opcional"
                    style={baseInputStyle()}
                />
                <input
                    name="titulo"
                    defaultValue={encontro?.titulo || ""}
                    aria-label="Titulo"
                    placeholder="Titulo"
                    style={baseInputStyle()}
                />
                <input
                    name="horario"
                    defaultValue={encontro?.horario || ""}
                    aria-label="Horario"
                    placeholder="Horario"
                    style={baseInputStyle()}
                />
                <input
                    name="local"
                    defaultValue={encontro?.local || ""}
                    aria-label="Local"
                    placeholder="Local"
                    style={baseInputStyle()}
                />
                <select
                    aria-label="Visibilidade no e-book"
                    name="visibilidade"
                    defaultValue={encontro?.visibilidade || "publico"}
                    style={baseInputStyle()}
                >
                    <option value="publico">Publico no e-book</option>
                    <option value="interno">Oculto no e-book</option>
                </select>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <button
                        type="submit"
                        disabled={salvando}
                        style={baseButtonStyle(evento ? "#ff6136" : "#4bbbc8")}
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
