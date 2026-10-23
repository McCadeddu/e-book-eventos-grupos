import { salvarCadastro, enviarAcaoAdmin, type SetorCadastro } from "../../lib/admin-cadastros";
import FormularioGrupo from "../../components/admin/FormularioGrupo";
import FormularioEvento from "../../components/admin/FormularioEvento";
import FormularioEncontro from "../../components/admin/FormularioEncontro";
import { baseButtonStyle } from "../../components/admin/formulario-ui";
import type { EventoAdmin, ResultadoAcao } from "../../lib/admin-types";
import type { GetServerSideProps } from "next";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Grupo } from "../../lib/types";
import { withAdminPage } from "../../lib/adminPage";
import { carregarAgendaAdministrativa } from "../../lib/admin-ano";
import { Encontro, ordenarEncontrosPorData } from "../../lib/encontros-utils";
import { alertasDoEncontro } from "../../lib/alertas";
import {
    DndContext,
    closestCenter,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = {
    ano: number;
    anos: number[];
    anoPublicado: number;
    grupos: Grupo[];
    encontros: Encontro[];
    eventos: EventoAdmin[];
};

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

export default function AdminGeral({ ano, anos, anoPublicado, grupos, encontros, eventos }: Props) {
    const [mudandoAno, setMudandoAno] = useState(false);
    const [executandoAcao, setExecutandoAcao] = useState(false);
    const acaoEmCurso = useRef(false);
    const [erroAcao, setErroAcao] = useState("");
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

    useEffect(() => {
        setOrdemGrupos(grupos);
        setOrdemEventos(eventos);
        setListaEncontros(encontros);
    }, [grupos, eventos, encontros]);

    function fecharFormularios() {
        setCriandoGrupo(false);
        setCriandoEvento(false);
        setEditandoGrupoId(null);
        setEditandoEventoId(null);
        setNovoEncontroGrupoId(null);
        setNovoEncontroEventoId(null);
        setEditandoEncontroId(null);
    }

    function abrirEdicaoEncontro(encontro: Encontro) {
        fecharFormularios();
        setEditandoEncontroId(encontro.id);
        if (encontro.evento_id) {
            setEventosAbertos((atuais) => Array.from(new Set([...atuais, encontro.evento_id!])));
            document.getElementById(`evento-${encontro.evento_id}`)?.scrollIntoView({ behavior: "smooth" });
        } else {
            setGruposAbertos((atuais) => Array.from(new Set([...atuais, encontro.grupo_id])));
        }
    }

    async function cancelarFormulario() {
        fecharFormularios();
        if (router.query.form) await router.replace(`/admin/grupos?ano=${ano}`, undefined, { shallow: true });
    }

    useEffect(() => {
        const form = router.query.form;
        const id = router.query.id;
        if (typeof form !== "string") return;
        setCriandoGrupo(false);
        setCriandoEvento(false);
        setEditandoGrupoId(null);
        setEditandoEventoId(null);
        setNovoEncontroGrupoId(null);
        setNovoEncontroEventoId(null);
        setEditandoEncontroId(null);
        if (form === "grupo-novo") setCriandoGrupo(true);
        if (form === "evento-novo") setCriandoEvento(true);
        if (typeof id !== "string") return;
        if (["grupo-editar", "encontro-grupo-novo"].includes(form) && grupos.some((item) => item.id === id)) {
            setGruposAbertos((atuais) => Array.from(new Set([...atuais, id])));
            if (form === "grupo-editar") setEditandoGrupoId(id);
            else setNovoEncontroGrupoId(id);
        }
        if (["evento-editar", "encontro-evento-novo"].includes(form) && eventos.some((item) => item.id === id)) {
            setEventosAbertos((atuais) => Array.from(new Set([...atuais, id])));
            if (form === "evento-editar") setEditandoEventoId(id);
            else setNovoEncontroEventoId(id);
        }
        if (form === "encontro-editar") {
            const encontro = encontros.find((item) => item.id === id);
            if (!encontro) return;
            setEditandoEncontroId(id);
            if (encontro.evento_id) setEventosAbertos((atuais) => Array.from(new Set([...atuais, encontro.evento_id!])));
            else setGruposAbertos((atuais) => Array.from(new Set([...atuais, encontro.grupo_id])));
        }
    }, [router.query.form, router.query.id, grupos, eventos, encontros, ano]);

    async function recarregar(ancora?: string) {
        await router.replace(`/admin/grupos?ano=${ano}${ancora || ""}`);
    }

    async function executarAcao(caminho: string, metodo: "POST" | "PUT" | "DELETE", payload: Record<string, unknown>, aoConcluir?: () => Promise<void> | void) {
        if (acaoEmCurso.current) return false;
        acaoEmCurso.current = true;
        setExecutandoAcao(true);
        setErroAcao("");
        try {
            const resultado = await enviarAcaoAdmin(caminho, metodo, payload);
            if (!resultado.sucesso) {
                setErroAcao(resultado.erro);
                return false;
            }
            try {
                await aoConcluir?.();
            } catch {
                setErroAcao("Ação concluída. Recarregue a página para conferir a atualização.");
            }
            return true;
        } finally {
            acaoEmCurso.current = false;
            setExecutandoAcao(false);
        }
    }

    async function excluirEncontro(encontro: Encontro, ancora: string) {
        if (!confirm(`Excluir este encontro de ${ano}?`)) return;
        await executarAcao("/api/encontros", "DELETE", {
            id: encontro.id, grupo_id: encontro.grupo_id, anoPastoral: ano,
        }, () => recarregar(ancora));
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

    async function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = ordemGrupos.findIndex((item) => item.id === active.id);
        const newIndex = ordemGrupos.findIndex((item) => item.id === over.id);
        setOrdemGrupos(arrayMove(ordemGrupos, oldIndex, newIndex));
    }

    async function onDragEndEventos(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = ordemEventos.findIndex((item) => item.id === active.id);
        const newIndex = ordemEventos.findIndex((item) => item.id === over.id);
        setOrdemEventos(arrayMove(ordemEventos, oldIndex, newIndex));
    }

    async function persistirOrdemGrupos(novaOrdem: Grupo[]) {
        return executarAcao("/api/grupos/ordenar", "POST", {
            ordem: novaOrdem.map((grupo, index) => ({ id: grupo.id, ordem: index + 1 })),
        }, () => { setOrdemGrupos(novaOrdem); });
    }

    async function persistirOrdemEventos(novaOrdem: EventoAdmin[]) {
        return executarAcao("/api/eventos/ordenar", "POST", {
            ordem: novaOrdem.map((evento, index) => ({ id: evento.id, ordem: index + 1 })),
        }, () => { setOrdemEventos(novaOrdem); });
    }

    async function salvarOrdem() {
        if (await persistirOrdemGrupos(ordemGrupos)) setModoEdicao(false);
    }

    async function salvarOrdemEventos() {
        if (await persistirOrdemEventos(ordemEventos)) setModoEdicaoEventos(false);
    }

    async function moverGrupo(grupoId: string, direcao: -1 | 1) {
        const indiceAtual = ordemGrupos.findIndex((grupo) => grupo.id === grupoId);
        const novoIndice = indiceAtual + direcao;

        if (indiceAtual < 0 || novoIndice < 0 || novoIndice >= ordemGrupos.length) {
            return;
        }

        const novaOrdem = arrayMove(ordemGrupos, indiceAtual, novoIndice);
        await persistirOrdemGrupos(novaOrdem);
    }

    async function moverEvento(eventoId: string, direcao: -1 | 1) {
        const indiceAtual = ordemEventos.findIndex((evento) => evento.id === eventoId);
        const novoIndice = indiceAtual + direcao;

        if (indiceAtual < 0 || novoIndice < 0 || novoIndice >= ordemEventos.length) {
            return;
        }

        const novaOrdem = arrayMove(ordemEventos, indiceAtual, novoIndice);
        await persistirOrdemEventos(novaOrdem);
    }

    async function alternarVisibilidadeEncontro(encontro: Encontro) {
        const novaVisibilidade = encontro.visibilidade === "publico" ? "interno" : "publico";
        await executarAcao("/api/encontros", "PUT", {
            id: encontro.id, anoPastoral: ano,
            grupo_id: encontro.grupo_id || null, evento_id: encontro.evento_id || null,
            visibilidade: novaVisibilidade,
        }, () => {
            setListaEncontros((atuais) => atuais.map((item) =>
                item.id === encontro.id ? { ...item, visibilidade: novaVisibilidade } : item));
        });
    }

    async function alternarVisibilidadeEvento(evento: EventoAdmin) {
        const novaVisibilidade = evento.visibilidade === "publico" ? "interno" : "publico";
        await executarAcao("/api/eventos", "PUT", { id: evento.id, visibilidade: novaVisibilidade }, () => {
            setOrdemEventos((atuais) => atuais.map((item) =>
                item.id === evento.id ? { ...item, visibilidade: novaVisibilidade } : item));
        });
    }

    async function salvarSetor(setor: SetorCadastro, metodo: "POST" | "PUT", payload: Record<string, unknown>): Promise<ResultadoAcao> {
        const resultado = await salvarCadastro(setor, metodo, payload);
        if (!resultado.sucesso) return resultado;
        const slug = resultado.grupoSlug || (typeof payload.slug === "string" ? payload.slug : undefined);
        const eventoId = resultado.eventoId || (typeof payload.id === "string" ? payload.id : undefined);
        const ancora = setor === "grupos" && slug ? `#grupo-${slug}` : setor === "eventos" && eventoId ? `#evento-${eventoId}` : undefined;
        try {
            await recarregar(ancora);
            fecharFormularios();
        } catch {
            return { sucesso: false, erro: "Cadastro salvo. Recarregue a página para conferir a atualização." };
        }
        return resultado;
    }

    const criarGrupo = (payload: Record<string, unknown>) => salvarSetor("grupos", "POST", payload);
    const atualizarGrupo = (payload: Record<string, unknown>) => salvarSetor("grupos", "PUT", payload);
    const criarEvento = (payload: Record<string, unknown>) => salvarSetor("eventos", "POST", payload);
    const atualizarEvento = (payload: Record<string, unknown>) => salvarSetor("eventos", "PUT", payload);
    const criarEncontro = (payload: Record<string, unknown>) => salvarSetor("encontros", "POST", payload);
    const atualizarEncontro = (payload: Record<string, unknown>) => salvarSetor("encontros", "PUT", payload);

    return (
        <main style={{ padding: "2.5rem", maxWidth: "1200px", margin: "0 auto" }}>
            <section style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "#edf7f8", borderRadius: "12px" }}>
                <h1 style={{ marginTop: 0 }}>Agenda pastoral {ano}</h1>
                <label htmlFor="ano-pastoral">Ano de trabalho </label>
                <select id="ano-pastoral" value={ano} disabled={mudandoAno || executandoAcao}
                    onChange={async (event) => {
                        const proximoAno = event.target.value;
                        fecharFormularios();
                        setMudandoAno(true);
                        try {
                            await router.push(`/admin/grupos?ano=${proximoAno}`);
                        } finally {
                            setMudandoAno(false);
                        }
                    }}>
                    {anos.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <p role="status">{mudandoAno ? "Carregando agenda..." : `${listaEncontros.length} encontro(s) em ${ano}.`}</p>
                {encontros.length === 0 && <p>Agenda sem datas em {ano}. Abra um grupo, evento ou retiro e use “Novo encontro” para começar.</p>}
                <p>As datas são separadas por ano. Os nomes, textos, equipes e a exclusão de grupos e eventos são compartilhados entre os anos.</p>
                <p>O livro publicado continua em {anoPublicado}. <a href={`/livro/edicao/${ano}/calendario`} target="_blank" rel="noreferrer">Ver calendário de {ano}</a></p>
            </section>
            <p role="status" aria-live="polite">{executandoAcao ? "Concluindo ação..." : ""}</p>
            {erroAcao && <p role="alert" style={{ color: "#8b0000" }}>{erroAcao}</p>}
            <fieldset disabled={mudandoAno || executandoAcao} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
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
                            onCancel={cancelarFormulario}
                        />
                    )}

                    {criandoEvento && (
                        <FormularioEvento
                            grupos={ordemGrupos}
                            submitLabel="Salvar evento"
                            onSubmit={criarEvento}
                            onCancel={cancelarFormulario}
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
                                            onClick={() => moverGrupo(grupo.id, -1)}
                                        >
                                            ↑ Subir
                                        </SecondaryButton>
                                        <SecondaryButton
                                            onClick={() => moverGrupo(grupo.id, 1)}
                                        >
                                            ↓ Descer
                                        </SecondaryButton>
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
                                                await executarAcao("/api/grupos", "DELETE", { grupoId: grupo.id }, () => recarregar());
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
                                                onCancel={cancelarFormulario}
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
                                                const editando = editandoEncontroId === encontro.id && !encontro.evento_id;

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
                                                                onClick={() => abrirEdicaoEncontro(encontro)}
                                                            >
                                                                ✏️ Editar
                                                            </SecondaryButton>
                                                            <a href={`/admin/preview/encontro/${encontro.id}`} style={{ color: "#0b5c6b" }}>
                                                                Prévia / PDF / Cartaz
                                                            </a>
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
                                                                onClick={() => excluirEncontro(encontro, `#grupo-${grupo.slug}`)}
                                                            >
                                                                🗑 Excluir
                                                            </SecondaryButton>
                                                        </div>

                                                        {editando && (
                                                            <FormularioEncontro
                                                                ano={ano}
                                                                encontro={encontro}
                                                                grupo={grupo}
                                                                eventos={ordemEventos}
                                                                submitLabel="Salvar encontro"
                                                                onSubmit={atualizarEncontro}
                                                                onCancel={cancelarFormulario}
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
                                                ano={ano}
                                                grupo={grupo}
                                                eventos={ordemEventos}
                                                submitLabel="Criar encontro"
                                                onSubmit={criarEncontro}
                                                onCancel={cancelarFormulario}
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

                    <h2 id="eventos" style={{ marginTop: "3rem", color: "#ff6136" }}>Eventos</h2>

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
                                            onClick={() => moverEvento(evento.id, -1)}
                                        >
                                            ↑ Subir
                                        </SecondaryButton>
                                        <SecondaryButton
                                            onClick={() => moverEvento(evento.id, 1)}
                                        >
                                            ↓ Descer
                                        </SecondaryButton>
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
                                                await executarAcao("/api/eventos", "DELETE", { id: evento.id }, () => recarregar());
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
                                                onCancel={cancelarFormulario}
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
                                                                onClick={() => abrirEdicaoEncontro(encontro)}
                                                            >
                                                                ✏️ Editar
                                                            </SecondaryButton>
                                                            <a href={`/admin/preview/encontro/${encontro.id}`} style={{ color: "#0b5c6b" }}>
                                                                Prévia / PDF / Cartaz
                                                            </a>
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
                                                                onClick={() => excluirEncontro(encontro, `#evento-${evento.id}`)}
                                                            >
                                                                🗑 Excluir
                                                            </SecondaryButton>
                                                        </div>

                                                        {editando && (
                                                            <FormularioEncontro
                                                                ano={ano}
                                                                encontro={encontro}
                                                                evento={evento}
                                                                eventos={ordemEventos}
                                                                submitLabel="Salvar encontro"
                                                                onSubmit={atualizarEncontro}
                                                                onCancel={cancelarFormulario}
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
                                                ano={ano}
                                                evento={evento}
                                                eventos={ordemEventos}
                                                submitLabel="Criar encontro"
                                                onSubmit={criarEncontro}
                                                onCancel={cancelarFormulario}
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
            </fieldset>
        </main>
    );
}

export const getServerSideProps: GetServerSideProps = withAdminPage(async (context) => {
    const dados = await carregarAgendaAdministrativa(context.query.ano);
    if (!dados) return { notFound: true };
    return { props: dados };
});
