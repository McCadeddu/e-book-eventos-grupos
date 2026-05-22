import type { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Grupo } from "../../lib/types";
import { getGruposOrdenados } from "../../lib/db/grupos";
import { getEncontros } from "../../lib/db/encontros";
import { Encontro, ordenarEncontrosPorData } from "../../lib/encontros-utils";
import { getEventos } from "../../lib/db/eventos";
import { alertasDoEncontro } from "../../lib/alertas";
import {
    DndContext,
    closestCenter,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type EventoAdmin = {
    id: string;
    titulo: string;
    faixa_etaria?: string | null;
    descricao?: string | null;
    equipe?: string[];
    grupos_envolvidos?: string[];
    todos_os_grupos?: boolean;
    objetivo_ano?: string | null;
    convite?: string | null;
    visibilidade?: string;
};

type Props = {
    grupos: Grupo[];
    encontros: Encontro[];
    eventos: EventoAdmin[];
};

type ResultadoAcao =
    | { sucesso: true; grupoSlug?: string; eventoId?: string }
    | { sucesso: false; erro: string };

function labelData(encontro: Encontro): string {
    if (encontro.data_legivel?.trim()) return encontro.data_legivel;

    if (encontro.data_inicio && encontro.data_fim) {
        return `${encontro.data_inicio.split("-").reverse().join("/")} - ${encontro.data_fim.split("-").reverse().join("/")}`;
    }

    if (encontro.data_inicio) {
        return encontro.data_inicio.split("-").reverse().join("/");
    }

    return "Data a definir";
}

function seloVisibilidade(visibilidade?: string) {
    const oculto = visibilidade === "interno";

    return {
        label: oculto ? "OCULTO NO E-BOOK" : "PUBLICO NO E-BOOK",
        backgroundColor: oculto ? "#7a2e0b" : "#0b6b45",
    };
}

function baseInputStyle() {
    return {
        width: "100%",
        padding: "0.65rem 0.8rem",
        borderRadius: "8px",
        border: "1px solid #d8d2c8",
        fontSize: "0.95rem",
        backgroundColor: "#ffffff",
    } as const;
}

function baseButtonStyle(backgroundColor: string, color = "#ffffff") {
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

function SecondaryButton({
    children,
    onClick,
    color = "#2f4858",
}: {
    children: React.ReactNode;
    onClick: () => void;
    color?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                background: "none",
                border: "none",
                padding: 0,
                color,
                cursor: "pointer",
                fontSize: "0.95rem",
            }}
        >
            {children}
        </button>
    );
}

function BotaoVisibilidade({
    publico,
    onClick,
}: {
    publico: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={publico}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.55rem",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: publico ? "#0b6b45" : "#7a2e0b",
                fontWeight: 600,
            }}
        >
            <span
                aria-hidden="true"
                style={{
                    position: "relative",
                    width: "44px",
                    height: "24px",
                    borderRadius: "999px",
                    backgroundColor: publico ? "#0b6b45" : "#7a2e0b",
                    transition: "background-color 150ms ease",
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                }}
            >
                <span
                    style={{
                        position: "absolute",
                        top: "3px",
                        left: publico ? "23px" : "3px",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        transition: "left 150ms ease",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                    }}
                />
            </span>
            <span>{publico ? "Publico no e-book" : "Oculto no e-book"}</span>
        </button>
    );
}

function CardFormulario({
    title,
    color,
    children,
}: {
    title: string;
    color: string;
    children: React.ReactNode;
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

function ItemGrupo({
    grupo,
    modoEdicao,
}: {
    grupo: Grupo;
    modoEdicao: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: grupo.id });

    if (!modoEdicao) {
        return (
            <li style={{ padding: "0.4rem 0" }}>
                <a href={`#grupo-${grupo.slug}`} style={{ textDecoration: "none" }}>
                    ▸ {grupo.nome}
                </a>
            </li>
        );
    }

    return (
        <li
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                cursor: "grab",
                padding: "0.4rem 0",
                userSelect: "none",
            }}
        >
            ▸ {grupo.nome}
        </li>
    );
}

function ItemEvento({
    evento,
    modoEdicao,
}: {
    evento: EventoAdmin;
    modoEdicao: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: evento.id });

    if (!modoEdicao) {
        return (
            <li style={{ padding: "0.4rem 0" }}>
                <a href={`#evento-${evento.id}`} style={{ textDecoration: "none" }}>
                    ▸ {evento.titulo}
                </a>
            </li>
        );
    }

    return (
        <li
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                cursor: "grab",
                padding: "0.4rem 0",
                userSelect: "none",
            }}
        >
            ▸ {evento.titulo}
        </li>
    );
}

function FormularioGrupo({
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
    const [status, setStatus] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSalvando(true);
        setStatus(null);

        const formData = new FormData(event.currentTarget);
        const resultado = await onSubmit({
            id: grupo?.id,
            slug: grupo?.slug,
            nome: formData.get("nome"),
            faixa_etaria: formData.get("faixa_etaria"),
            descricao: formData.get("descricao"),
            objetivo_ano: formData.get("objetivo_ano"),
            equipe: formData.get("equipe"),
            convite_final: formData.get("convite_final"),
        });

        if (!resultado.sucesso) {
            setStatus(resultado.erro);
            setSalvando(false);
            return;
        }
    }

    return (
        <CardFormulario
            title={grupo ? `Editar grupo: ${grupo.nome}` : "Novo grupo"}
            color="#4bbbc8"
        >
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
                <input
                    name="nome"
                    defaultValue={grupo?.nome || ""}
                    placeholder="Nome do grupo"
                    required
                    style={baseInputStyle()}
                />
                <input
                    name="faixa_etaria"
                    defaultValue={grupo?.faixa_etaria || ""}
                    placeholder="Faixa etaria"
                    style={baseInputStyle()}
                />
                <textarea
                    name="descricao"
                    defaultValue={grupo?.descricao || ""}
                    placeholder="Descricao do grupo"
                    rows={3}
                    style={baseInputStyle()}
                />
                <textarea
                    name="objetivo_ano"
                    defaultValue={grupo?.objetivo_ano || ""}
                    placeholder="Objetivo do ano"
                    rows={3}
                    style={baseInputStyle()}
                />
                <input
                    name="equipe"
                    defaultValue={grupo?.equipe?.join(", ") || ""}
                    placeholder="Equipe separada por virgula"
                    style={baseInputStyle()}
                />
                <textarea
                    name="convite_final"
                    defaultValue={grupo?.convite_final || ""}
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

function FormularioEvento({
    evento,
    grupos,
    submitLabel,
    onSubmit,
    onCancel,
}: {
    evento?: EventoAdmin;
    grupos: Grupo[];
    submitLabel: string;
    onSubmit: (payload: Record<string, unknown>) => Promise<ResultadoAcao>;
    onCancel: () => void;
}) {
    const [status, setStatus] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);
    const [todos, setTodos] = useState(evento?.todos_os_grupos ?? false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSalvando(true);
        setStatus(null);

        const formData = new FormData(event.currentTarget);
        const gruposSelecionados = todos ? [] : formData.getAll("grupos_envolvidos");

        const resultado = await onSubmit({
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

        if (!resultado.sucesso) {
            setStatus(resultado.erro);
            setSalvando(false);
            return;
        }
    }

    return (
        <CardFormulario
            title={evento ? `Editar evento: ${evento.titulo}` : "Novo evento"}
            color="#ff6136"
        >
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
                <input
                    name="titulo"
                    defaultValue={evento?.titulo || ""}
                    placeholder="Titulo do evento"
                    required
                    style={baseInputStyle()}
                />
                <input
                    name="faixa_etaria"
                    defaultValue={evento?.faixa_etaria || ""}
                    placeholder="Faixa etaria"
                    style={baseInputStyle()}
                />
                <textarea
                    name="descricao"
                    defaultValue={evento?.descricao || ""}
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
                    placeholder="Equipe separada por virgula"
                    style={baseInputStyle()}
                />
                <textarea
                    name="objetivo_ano"
                    defaultValue={evento?.objetivo_ano || ""}
                    placeholder="Objetivo do ano"
                    rows={3}
                    style={baseInputStyle()}
                />
                <textarea
                    name="convite"
                    defaultValue={evento?.convite || ""}
                    placeholder="Convite"
                    rows={2}
                    style={baseInputStyle()}
                />
                <select
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

function FormularioEncontro({
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
    const [status, setStatus] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);
    const [eventoId, setEventoId] = useState<string | null>(encontro?.evento_id || evento?.id || null);
    const [nivel, setNivel] = useState<"evento" | "organizacao">(
        encontro?.nivel === "organizacao" ? "organizacao" : "evento"
    );

    async function handleSubmit(eventoForm: React.FormEvent<HTMLFormElement>) {
        eventoForm.preventDefault();
        setSalvando(true);
        setStatus(null);

        const formData = new FormData(eventoForm.currentTarget);
        const eventoSelecionado =
            String(formData.get("evento_id") || eventoId || "").trim() || null;
        const nivelAtual = permitirNivelEvento
            ? String(formData.get("nivel") || nivel)
            : encontro?.nivel || "evento";

        const payload = {
            id: encontro?.id,
            grupo_id: mostrarVinculoEvento
                ? eventoSelecionado
                    ? null
                    : grupo?.id || encontro?.grupo_id || null
                : null,
            grupoId: mostrarVinculoEvento
                ? eventoSelecionado
                    ? null
                    : grupo?.id || encontro?.grupo_id || null
                : null,
            evento_id: evento?.id || eventoSelecionado,
            tipo: formData.get("tipo"),
            data_inicio:
                String(formData.get("data_inicio") || formData.get("dataInicio") || "").trim() ||
                encontro?.data_inicio ||
                null,
            dataInicio:
                String(formData.get("data_inicio") || formData.get("dataInicio") || "").trim() ||
                encontro?.data_inicio ||
                null,
            data_fim:
                String(formData.get("data_fim") || formData.get("dataFim") || "").trim() || null,
            dataFim:
                String(formData.get("data_fim") || formData.get("dataFim") || "").trim() || null,
            data_legivel: formData.get("data_legivel") || formData.get("dataLegivel") || "",
            dataLegivel: formData.get("data_legivel") || formData.get("dataLegivel") || "",
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

        const resultado = await onSubmit(payload);

        if (!resultado.sucesso) {
            setStatus(resultado.erro);
            setSalvando(false);
            return;
        }
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
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
                {permitirNivelEvento && (
                    <>
                        <select
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
                    name="tipo"
                    defaultValue={encontro?.tipo || (permitirNivelEvento ? "evento" : "encontro_regular")}
                    style={baseInputStyle()}
                >
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
                    defaultValue={encontro?.data_inicio || ""}
                    required
                    style={baseInputStyle()}
                />
                <input
                    type="date"
                    name={encontro ? "data_fim" : "dataFim"}
                    defaultValue={encontro?.data_fim || ""}
                    style={baseInputStyle()}
                />
                <input
                    name={encontro ? "data_legivel" : "dataLegivel"}
                    defaultValue={encontro?.data_legivel || ""}
                    placeholder="Data legivel opcional"
                    style={baseInputStyle()}
                />
                <input
                    name="titulo"
                    defaultValue={encontro?.titulo || ""}
                    placeholder="Titulo"
                    style={baseInputStyle()}
                />
                <input
                    name="horario"
                    defaultValue={encontro?.horario || ""}
                    placeholder="Horario"
                    style={baseInputStyle()}
                />
                <input
                    name="local"
                    defaultValue={encontro?.local || ""}
                    placeholder="Local"
                    style={baseInputStyle()}
                />
                <select
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

export default function AdminGeral({ grupos, encontros, eventos }: Props) {
    const [ordemGrupos, setOrdemGrupos] = useState(grupos);
    const [ordemEventos, setOrdemEventos] = useState(eventos);
    const [listaEncontros, setListaEncontros] = useState(encontros);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [modoEdicaoEventos, setModoEdicaoEventos] = useState(false);
    const [gruposAbertos, setGruposAbertos] = useState<string[]>([]);
    const [eventosAbertos, setEventosAbertos] = useState<string[]>([]);
    const [criandoGrupo, setCriandoGrupo] = useState(false);
    const [criandoEvento, setCriandoEvento] = useState(false);
    const [editandoGrupoId, setEditandoGrupoId] = useState<string | null>(null);
    const [editandoEventoId, setEditandoEventoId] = useState<string | null>(null);
    const [novoEncontroGrupoId, setNovoEncontroGrupoId] = useState<string | null>(null);
    const [novoEncontroEventoId, setNovoEncontroEventoId] = useState<string | null>(null);
    const [editandoEncontroId, setEditandoEncontroId] = useState<string | null>(null);
    const router = useRouter();

    function fecharFormularios() {
        setCriandoGrupo(false);
        setCriandoEvento(false);
        setEditandoGrupoId(null);
        setEditandoEventoId(null);
        setNovoEncontroGrupoId(null);
        setNovoEncontroEventoId(null);
        setEditandoEncontroId(null);
    }

    async function recarregar(ancora?: string) {
        await router.replace(ancora ? `/admin/grupos${ancora}` : router.asPath);
    }

    function alternarGrupo(grupoId: string) {
        setGruposAbertos((atuais) =>
            atuais.includes(grupoId)
                ? atuais.filter((id) => id !== grupoId)
                : [...atuais, grupoId]
        );
    }

    function alternarEvento(eventoId: string) {
        setEventosAbertos((atuais) =>
            atuais.includes(eventoId)
                ? atuais.filter((id) => id !== eventoId)
                : [...atuais, eventoId]
        );
    }

    function encontrosDoGrupo(grupoId: string) {
        return ordenarEncontrosPorData(
            listaEncontros.filter((encontro) => {
                if (encontro.grupo_id === grupoId) return true;

                if (encontro.evento_id) {
                    const evento = ordemEventos.find((item) => item.id === encontro.evento_id);
                    if (!evento) return false;
                    if (evento.todos_os_grupos) return true;
                    if (evento.grupos_envolvidos?.includes(grupoId)) return true;
                }

                return false;
            })
        );
    }

    function encontrosDoEvento(eventoId: string) {
        return ordenarEncontrosPorData(
            listaEncontros.filter((encontro) => encontro.evento_id === eventoId)
        );
    }

    useEffect(() => {
        function handleHash() {
            const hash = window.location.hash;
            if (!hash) return;

            const id = hash.replace("#", "");
            const el = document.getElementById(id);

            if (id.startsWith("grupo-")) {
                const slug = id.replace("grupo-", "");
                const grupo = grupos.find((item) => item.slug === slug);
                if (grupo) {
                    setGruposAbertos((atuais) =>
                        atuais.includes(grupo.id) ? atuais : [...atuais, grupo.id]
                    );
                }
            }

            if (id.startsWith("evento-")) {
                const eventoId = id.replace("evento-", "");
                const evento = eventos.find((item) => item.id === eventoId);
                if (evento) {
                    setEventosAbertos((atuais) =>
                        atuais.includes(evento.id) ? atuais : [...atuais, evento.id]
                    );
                }
            }

            el?.scrollIntoView({ behavior: "smooth" });
        }

        handleHash();
        window.addEventListener("hashchange", handleHash);
        return () => window.removeEventListener("hashchange", handleHash);
    }, [grupos, eventos]);

    async function onDragEnd(event: any) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = ordemGrupos.findIndex((item) => item.id === active.id);
        const newIndex = ordemGrupos.findIndex((item) => item.id === over.id);
        setOrdemGrupos(arrayMove(ordemGrupos, oldIndex, newIndex));
    }

    async function onDragEndEventos(event: any) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = ordemEventos.findIndex((item) => item.id === active.id);
        const newIndex = ordemEventos.findIndex((item) => item.id === over.id);
        setOrdemEventos(arrayMove(ordemEventos, oldIndex, newIndex));
    }

    async function salvarOrdem() {
        await fetch("/api/grupos/ordenar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ordem: ordemGrupos.map((grupo, index) => ({
                    id: grupo.id,
                    ordem: index + 1,
                })),
            }),
        });
        setModoEdicao(false);
        recarregar();
    }

    async function salvarOrdemEventos() {
        await fetch("/api/eventos/ordenar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ordem: ordemEventos.map((evento, index) => ({
                    id: evento.id,
                    ordem: index + 1,
                })),
            }),
        });
        setModoEdicaoEventos(false);
        recarregar();
    }

    async function alternarVisibilidadeEncontro(encontro: Encontro) {
        const novaVisibilidade =
            encontro.visibilidade === "publico" ? "interno" : "publico";

        const resposta = await fetch("/api/encontros", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: encontro.id,
                grupo_id: encontro.grupo_id || null,
                evento_id: encontro.evento_id || null,
                visibilidade: novaVisibilidade,
            }),
        });

        const resultado = await resposta.json();
        if (!resultado.sucesso) {
            alert(resultado.erro || "Nao foi possivel atualizar a visibilidade do encontro.");
            return;
        }

        setListaEncontros((atuais) =>
            atuais.map((item) =>
                item.id === encontro.id
                    ? { ...item, visibilidade: novaVisibilidade }
                    : item
            )
        );
    }

    async function alternarVisibilidadeEvento(evento: EventoAdmin) {
        const novaVisibilidade =
            evento.visibilidade === "publico" ? "interno" : "publico";

        const resposta = await fetch("/api/eventos", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: evento.id, visibilidade: novaVisibilidade }),
        });

        const resultado = await resposta.json();
        if (!resultado.sucesso) {
            alert(resultado.erro || "Nao foi possivel atualizar a visibilidade do evento.");
            return;
        }

        setOrdemEventos((atuais) =>
            atuais.map((item) =>
                item.id === evento.id
                    ? { ...item, visibilidade: novaVisibilidade }
                    : item
            )
        );
    }

    async function criarGrupo(payload: Record<string, unknown>): Promise<ResultadoAcao> {
        const resposta = await fetch("/api/grupos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const resultado = await resposta.json();
        if (!resultado.sucesso) {
            return { sucesso: false, erro: resultado.erro || "Nao foi possivel criar o grupo." };
        }
        fecharFormularios();
        await recarregar(resultado.grupo?.slug ? `#grupo-${resultado.grupo.slug}` : undefined);
        return { sucesso: true, grupoSlug: resultado.grupo?.slug };
    }

    async function atualizarGrupo(payload: Record<string, unknown>): Promise<ResultadoAcao> {
        const resposta = await fetch("/api/grupos", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const resultado = await resposta.json();
        if (!resultado.sucesso) {
            return { sucesso: false, erro: resultado.erro || "Nao foi possivel atualizar o grupo." };
        }
        fecharFormularios();
        await recarregar(typeof payload.slug === "string" ? `#grupo-${payload.slug}` : undefined);
        return { sucesso: true };
    }

    async function criarEvento(payload: Record<string, unknown>): Promise<ResultadoAcao> {
        const resposta = await fetch("/api/eventos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const resultado = await resposta.json();
        if (!resultado.sucesso) {
            return { sucesso: false, erro: resultado.erro || "Nao foi possivel criar o evento." };
        }
        fecharFormularios();
        await recarregar();
        return { sucesso: true };
    }

    async function atualizarEvento(payload: Record<string, unknown>): Promise<ResultadoAcao> {
        const resposta = await fetch("/api/eventos", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const resultado = await resposta.json();
        if (!resultado.sucesso) {
            return { sucesso: false, erro: resultado.erro || "Nao foi possivel atualizar o evento." };
        }
        fecharFormularios();
        await recarregar(typeof payload.id === "string" ? `#evento-${payload.id}` : undefined);
        return { sucesso: true };
    }

    async function criarEncontro(payload: Record<string, unknown>): Promise<ResultadoAcao> {
        const resposta = await fetch("/api/encontros", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const resultado = await resposta.json();
        if (!resultado.sucesso) {
            return { sucesso: false, erro: resultado.erro || "Nao foi possivel criar o encontro." };
        }
        fecharFormularios();
        await recarregar();
        return { sucesso: true };
    }

    async function atualizarEncontro(payload: Record<string, unknown>): Promise<ResultadoAcao> {
        const resposta = await fetch("/api/encontros", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const resultado = await resposta.json();
        if (!resultado.sucesso) {
            return { sucesso: false, erro: resultado.erro || "Nao foi possivel atualizar o encontro." };
        }
        fecharFormularios();
        await recarregar();
        return { sucesso: true };
    }

    return (
        <main style={{ padding: "2.5rem", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "2rem" }}>
                <aside style={{ width: "220px", position: "sticky", top: "2rem" }}>
                    <h3>Grupos</h3>
                    <div style={{ marginBottom: "1rem" }}>
                        {!modoEdicao ? (
                            <button onClick={() => setModoEdicao(true)}>✏️ Editar ordem</button>
                        ) : (
                            <button onClick={salvarOrdem}>💾 Salvar ordem</button>
                        )}
                    </div>

                    {modoEdicao ? (
                        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                            <SortableContext
                                items={ordemGrupos.map((grupo) => grupo.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                    {ordemGrupos.map((grupo) => (
                                        <ItemGrupo key={grupo.id} grupo={grupo} modoEdicao />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                            {ordemGrupos.map((grupo) => (
                                <ItemGrupo key={grupo.id} grupo={grupo} modoEdicao={false} />
                            ))}
                        </ul>
                    )}

                    <h3 style={{ marginTop: "2rem" }}>Eventos</h3>
                    <div style={{ marginBottom: "1rem" }}>
                        {!modoEdicaoEventos ? (
                            <button onClick={() => setModoEdicaoEventos(true)}>
                                ✏️ Editar ordem eventos
                            </button>
                        ) : (
                            <button onClick={salvarOrdemEventos}>💾 Salvar ordem eventos</button>
                        )}
                    </div>

                    {modoEdicaoEventos ? (
                        <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={onDragEndEventos}
                        >
                            <SortableContext
                                items={ordemEventos.map((evento) => evento.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                    {ordemEventos.map((evento) => (
                                        <ItemEvento key={evento.id} evento={evento} modoEdicao />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                            {ordemEventos.map((evento) => (
                                <ItemEvento key={evento.id} evento={evento} modoEdicao={false} />
                            ))}
                        </ul>
                    )}
                </aside>

                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            marginBottom: "1.5rem",
                            display: "flex",
                            gap: "1rem",
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            type="button"
                            style={baseButtonStyle("#fff4d4", "#4bbbc8")}
                            onClick={() => {
                                fecharFormularios();
                                setCriandoGrupo(true);
                            }}
                        >
                            ➕ Novo grupo
                        </button>
                        <button
                            type="button"
                            style={baseButtonStyle("#fff4d4", "#ff6136")}
                            onClick={() => {
                                fecharFormularios();
                                setCriandoEvento(true);
                            }}
                        >
                            ➕ Novo evento
                        </button>
                    </div>

                    {criandoGrupo && (
                        <FormularioGrupo
                            submitLabel="Salvar grupo"
                            onSubmit={criarGrupo}
                            onCancel={fecharFormularios}
                        />
                    )}

                    {criandoEvento && (
                        <FormularioEvento
                            grupos={ordemGrupos}
                            submitLabel="Salvar evento"
                            onSubmit={criarEvento}
                            onCancel={fecharFormularios}
                        />
                    )}

                    {ordemGrupos.map((grupo) => {
                        const encontrosGrupo = encontrosDoGrupo(grupo.id);
                        const grupoAberto = gruposAbertos.includes(grupo.id);

                        return (
                            <section
                                id={`grupo-${grupo.slug}`}
                                key={grupo.id}
                                style={{
                                    background: "#fff4d4f1",
                                    borderRadius: "10px",
                                    padding: "1.1rem 1.4rem",
                                    marginBottom: "1rem",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: "1rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => alternarGrupo(grupo.id)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            padding: 0,
                                            textAlign: "left",
                                            cursor: "pointer",
                                            flex: 1,
                                        }}
                                    >
                                        <h2
                                            style={{
                                                margin: 0,
                                                fontSize: "1.4rem",
                                                fontWeight: 500,
                                                color: "#4bbbc8",
                                            }}
                                        >
                                            {grupoAberto ? "▾ " : "▸ "} {grupo.nome}
                                        </h2>
                                        <div
                                            style={{
                                                marginTop: "0.25rem",
                                                fontSize: "0.9rem",
                                                color: "#725e50",
                                            }}
                                        >
                                            {encontrosGrupo.length} encontro(s)
                                        </div>
                                    </button>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <SecondaryButton
                                            onClick={() => {
                                                fecharFormularios();
                                                setEditandoGrupoId(grupo.id);
                                                setGruposAbertos((atuais) =>
                                                    atuais.includes(grupo.id)
                                                        ? atuais
                                                        : [...atuais, grupo.id]
                                                );
                                            }}
                                        >
                                            ✏️ Editar grupo
                                        </SecondaryButton>
                                        <SecondaryButton
                                            color="#8b0000"
                                            onClick={async () => {
                                                if (!confirm("Excluir grupo?")) return;
                                                await fetch("/api/grupos", {
                                                    method: "DELETE",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                    },
                                                    body: JSON.stringify({ grupoId: grupo.id }),
                                                });
                                                recarregar();
                                            }}
                                        >
                                            🗑 Excluir grupo
                                        </SecondaryButton>
                                    </div>
                                </div>

                                {grupoAberto && (
                                    <>
                                        <p>
                                            <em>{grupo.faixa_etaria}</em>
                                        </p>
                                        <p>{grupo.descricao}</p>

                                        {editandoGrupoId === grupo.id && (
                                            <FormularioGrupo
                                                grupo={grupo}
                                                submitLabel="Salvar alteracoes"
                                                onSubmit={atualizarGrupo}
                                                onCancel={fecharFormularios}
                                            />
                                        )}

                                        <h3 style={{ marginTop: "1.5rem" }}>Encontros</h3>
                                        <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                                            {encontrosGrupo.length === 0 && (
                                                <li>Nenhum encontro cadastrado.</li>
                                            )}

                                            {encontrosGrupo.map((encontro) => {
                                                const visibilidade = seloVisibilidade(
                                                    encontro.visibilidade
                                                );
                                                const alertas = alertasDoEncontro(encontro);
                                                const editando = editandoEncontroId === encontro.id;

                                                return (
                                                    <li
                                                        key={encontro.id}
                                                        style={{
                                                            marginBottom: "0.8rem",
                                                            padding: "0.8rem",
                                                            border: "1px solid #e0d8c3",
                                                            borderRadius: "8px",
                                                            backgroundColor: "#fffdf7",
                                                            boxShadow:
                                                                "0 2px 6px rgba(0,0,0,0.05)",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "0.6rem",
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <strong>{labelData(encontro)}</strong>
                                                            <span
                                                                style={{
                                                                    fontSize: "0.7rem",
                                                                    fontWeight: 700,
                                                                    padding: "0.2rem 0.5rem",
                                                                    borderRadius: "999px",
                                                                    backgroundColor:
                                                                        visibilidade.backgroundColor,
                                                                    color: "#ffffff",
                                                                }}
                                                            >
                                                                {visibilidade.label}
                                                            </span>
                                                        </div>

                                                        {encontro.titulo && (
                                                            <div style={{ marginTop: "0.35rem" }}>
                                                                — {encontro.titulo}
                                                            </div>
                                                        )}

                                                        {alertas.length > 0 && (
                                                            <ul
                                                                style={{
                                                                    marginTop: "0.4rem",
                                                                    paddingLeft: "1.1rem",
                                                                    color: "#8b5a00",
                                                                }}
                                                            >
                                                                {alertas.map((alerta) => (
                                                                    <li key={alerta}>{alerta}</li>
                                                                ))}
                                                            </ul>
                                                        )}

                                                        <div
                                                            style={{
                                                                marginTop: "0.6rem",
                                                                display: "flex",
                                                                gap: "1rem",
                                                                alignItems: "center",
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <SecondaryButton
                                                                onClick={() => {
                                                                    fecharFormularios();
                                                                    setEditandoEncontroId(encontro.id);
                                                                }}
                                                            >
                                                                ✏️ Editar
                                                            </SecondaryButton>
                                                            <BotaoVisibilidade
                                                                publico={
                                                                    encontro.visibilidade ===
                                                                    "publico"
                                                                }
                                                                onClick={() =>
                                                                    alternarVisibilidadeEncontro(
                                                                        encontro
                                                                    )
                                                                }
                                                            />
                                                            <SecondaryButton
                                                                color="darkred"
                                                                onClick={async () => {
                                                                    if (
                                                                        !confirm(
                                                                            "Excluir encontro?"
                                                                        )
                                                                    )
                                                                        return;
                                                                    await fetch("/api/encontros", {
                                                                        method: "DELETE",
                                                                        headers: {
                                                                            "Content-Type":
                                                                                "application/json",
                                                                        },
                                                                        body: JSON.stringify({
                                                                            id: encontro.id,
                                                                            grupo_id:
                                                                                encontro.grupo_id ||
                                                                                grupo.id,
                                                                            evento_id:
                                                                                encontro.evento_id ||
                                                                                null,
                                                                        }),
                                                                    });
                                                                    recarregar(
                                                                        `#grupo-${grupo.slug}`
                                                                    );
                                                                }}
                                                            >
                                                                🗑 Excluir
                                                            </SecondaryButton>
                                                        </div>

                                                        {editando && (
                                                            <FormularioEncontro
                                                                encontro={encontro}
                                                                grupo={grupo}
                                                                eventos={ordemEventos}
                                                                submitLabel="Salvar encontro"
                                                                onSubmit={atualizarEncontro}
                                                                onCancel={fecharFormularios}
                                                                mostrarVinculoEvento
                                                                permitirNivelEvento={false}
                                                            />
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        {novoEncontroGrupoId === grupo.id ? (
                                            <FormularioEncontro
                                                grupo={grupo}
                                                eventos={ordemEventos}
                                                submitLabel="Criar encontro"
                                                onSubmit={criarEncontro}
                                                onCancel={fecharFormularios}
                                                mostrarVinculoEvento
                                                permitirNivelEvento={false}
                                            />
                                        ) : (
                                            <div style={{ marginTop: "1rem" }}>
                                                <SecondaryButton
                                                    onClick={() => {
                                                        fecharFormularios();
                                                        setNovoEncontroGrupoId(grupo.id);
                                                    }}
                                                >
                                                    ➕ Novo encontro
                                                </SecondaryButton>
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>
                        );
                    })}

                    <h2 style={{ marginTop: "3rem", color: "#ff6136" }}>Eventos</h2>

                    {ordemEventos.map((evento) => {
                        const encontrosEvento = encontrosDoEvento(evento.id);
                        const eventoAberto = eventosAbertos.includes(evento.id);
                        const visibilidadeEvento = seloVisibilidade(evento.visibilidade);

                        return (
                            <section
                                id={`evento-${evento.id}`}
                                key={evento.id}
                                style={{
                                    background: "#fff4d4f1",
                                    borderRadius: "10px",
                                    padding: "1.1rem 1.4rem",
                                    marginBottom: "1rem",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: "1rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() => alternarEvento(evento.id)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            padding: 0,
                                            textAlign: "left",
                                            cursor: "pointer",
                                            flex: 1,
                                        }}
                                    >
                                        <h2
                                            style={{
                                                margin: 0,
                                                fontSize: "1.4rem",
                                                fontWeight: 500,
                                                color: "#ff6136",
                                            }}
                                        >
                                            {eventoAberto ? "▾ " : "▸ "} {evento.titulo}
                                        </h2>
                                        <div
                                            style={{
                                                marginTop: "0.25rem",
                                                fontSize: "0.9rem",
                                                color: "#725e50",
                                                display: "flex",
                                                gap: "0.6rem",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <span>{encontrosEvento.length} encontro(s)</span>
                                            <span
                                                style={{
                                                    fontSize: "0.7rem",
                                                    fontWeight: 700,
                                                    padding: "0.2rem 0.5rem",
                                                    borderRadius: "999px",
                                                    backgroundColor:
                                                        visibilidadeEvento.backgroundColor,
                                                    color: "#ffffff",
                                                }}
                                            >
                                                {visibilidadeEvento.label}
                                            </span>
                                        </div>
                                    </button>

                                    <div
                                        style={{
                                            display: "flex",
                                            gap: "1rem",
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <BotaoVisibilidade
                                            publico={evento.visibilidade === "publico"}
                                            onClick={() => alternarVisibilidadeEvento(evento)}
                                        />
                                        <SecondaryButton
                                            onClick={() => {
                                                fecharFormularios();
                                                setEditandoEventoId(evento.id);
                                                setEventosAbertos((atuais) =>
                                                    atuais.includes(evento.id)
                                                        ? atuais
                                                        : [...atuais, evento.id]
                                                );
                                            }}
                                        >
                                            ✏️ Editar evento
                                        </SecondaryButton>
                                        <SecondaryButton
                                            color="darkred"
                                            onClick={async () => {
                                                if (!confirm("Excluir evento?")) return;
                                                await fetch("/api/eventos", {
                                                    method: "DELETE",
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                    },
                                                    body: JSON.stringify({ id: evento.id }),
                                                });
                                                recarregar();
                                            }}
                                        >
                                            🗑 Excluir evento
                                        </SecondaryButton>
                                    </div>
                                </div>

                                {eventoAberto && (
                                    <>
                                        {editandoEventoId === evento.id && (
                                            <FormularioEvento
                                                evento={evento}
                                                grupos={ordemGrupos}
                                                submitLabel="Salvar alteracoes"
                                                onSubmit={atualizarEvento}
                                                onCancel={fecharFormularios}
                                            />
                                        )}

                                        <h3 style={{ marginTop: "1.5rem" }}>
                                            Encontros do evento
                                        </h3>
                                        <ul style={{ paddingLeft: 0, listStyle: "none" }}>
                                            {encontrosEvento.length === 0 && (
                                                <li>Nenhum encontro cadastrado.</li>
                                            )}

                                            {encontrosEvento.map((encontro) => {
                                                const organizacao =
                                                    encontro.nivel === "organizacao";
                                                const visibilidade = seloVisibilidade(
                                                    encontro.visibilidade
                                                );
                                                const editando =
                                                    editandoEncontroId === encontro.id;

                                                return (
                                                    <li
                                                        key={encontro.id}
                                                        style={{
                                                            marginBottom: "0.8rem",
                                                            padding: "0.8rem",
                                                            border: organizacao
                                                                ? "1px solid #ffd7c8"
                                                                : "1px solid #e0d8c3",
                                                            borderRadius: "8px",
                                                            backgroundColor: organizacao
                                                                ? "#fff5f1"
                                                                : "#fffdf7",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "0.6rem",
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <strong>{labelData(encontro)}</strong>
                                                            <span
                                                                style={{
                                                                    fontSize: "0.7rem",
                                                                    fontWeight: 700,
                                                                    padding: "0.2rem 0.5rem",
                                                                    borderRadius: "999px",
                                                                    backgroundColor: organizacao
                                                                        ? "#ff6136"
                                                                        : "#4bbbc8",
                                                                    color: "#ffffff",
                                                                }}
                                                            >
                                                                {organizacao
                                                                    ? "ORGANIZACAO"
                                                                    : "EVENTO"}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: "0.7rem",
                                                                    fontWeight: 700,
                                                                    padding: "0.2rem 0.5rem",
                                                                    borderRadius: "999px",
                                                                    backgroundColor:
                                                                        visibilidade.backgroundColor,
                                                                    color: "#ffffff",
                                                                }}
                                                            >
                                                                {visibilidade.label}
                                                            </span>
                                                        </div>

                                                        {encontro.titulo && (
                                                            <div style={{ marginTop: "0.35rem" }}>
                                                                — {encontro.titulo}
                                                            </div>
                                                        )}

                                                        <div
                                                            style={{
                                                                marginTop: "0.6rem",
                                                                display: "flex",
                                                                gap: "1rem",
                                                                alignItems: "center",
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <SecondaryButton
                                                                onClick={() => {
                                                                    fecharFormularios();
                                                                    setEditandoEncontroId(
                                                                        encontro.id
                                                                    );
                                                                }}
                                                            >
                                                                ✏️ Editar
                                                            </SecondaryButton>
                                                            <BotaoVisibilidade
                                                                publico={
                                                                    encontro.visibilidade ===
                                                                    "publico"
                                                                }
                                                                onClick={() =>
                                                                    alternarVisibilidadeEncontro(
                                                                        encontro
                                                                    )
                                                                }
                                                            />
                                                            <SecondaryButton
                                                                color="darkred"
                                                                onClick={async () => {
                                                                    if (
                                                                        !confirm(
                                                                            "Excluir encontro?"
                                                                        )
                                                                    )
                                                                        return;
                                                                    await fetch("/api/encontros", {
                                                                        method: "DELETE",
                                                                        headers: {
                                                                            "Content-Type":
                                                                                "application/json",
                                                                        },
                                                                        body: JSON.stringify({
                                                                            id: encontro.id,
                                                                            evento_id: evento.id,
                                                                        }),
                                                                    });
                                                                    recarregar(
                                                                        `#evento-${evento.id}`
                                                                    );
                                                                }}
                                                            >
                                                                🗑 Excluir
                                                            </SecondaryButton>
                                                        </div>

                                                        {editando && (
                                                            <FormularioEncontro
                                                                encontro={encontro}
                                                                evento={evento}
                                                                eventos={ordemEventos}
                                                                submitLabel="Salvar encontro"
                                                                onSubmit={atualizarEncontro}
                                                                onCancel={fecharFormularios}
                                                                mostrarVinculoEvento={false}
                                                                permitirNivelEvento
                                                            />
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>

                                        {novoEncontroEventoId === evento.id ? (
                                            <FormularioEncontro
                                                evento={evento}
                                                eventos={ordemEventos}
                                                submitLabel="Criar encontro"
                                                onSubmit={criarEncontro}
                                                onCancel={fecharFormularios}
                                                mostrarVinculoEvento={false}
                                                permitirNivelEvento
                                            />
                                        ) : (
                                            <div style={{ marginTop: "1rem" }}>
                                                <SecondaryButton
                                                    onClick={() => {
                                                        fecharFormularios();
                                                        setNovoEncontroEventoId(evento.id);
                                                    }}
                                                >
                                                    ➕ Novo encontro
                                                </SecondaryButton>
                                            </div>
                                        )}
                                    </>
                                )}
                            </section>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    const grupos = await getGruposOrdenados();
    const encontros = await getEncontros();
    const eventos = await getEventos();

    return {
        props: { grupos, encontros, eventos },
    };
};
