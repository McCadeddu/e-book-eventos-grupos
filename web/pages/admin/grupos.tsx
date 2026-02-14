// web/pages/admin/grupos.tsx

import Link from "next/link";
import { Grupo } from "../../lib/types";
import { getGruposOrdenados } from "../../lib/db/grupos";
import { getEncontros } from "../../lib/db/encontros";
import { Encontro, ordenarEncontrosPorData } from "../../lib/encontros-utils";

import { getEventos } from "../../lib/db/eventos";

import { useEffect, useState } from "react";

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
import { useRouter } from "next/router";
import { alertasDoEncontro } from "../../lib/alertas";

// função para formatar a data do encontro de forma legível,
// considerando as várias formas de cadastrar a data(data_legivel,
// data_inicio + data_fim, etc)
function labelData(encontro: Encontro): string {
    if (encontro.data_legivel?.trim()) return encontro.data_legivel;

    if (encontro.data_inicio && encontro.data_fim) {
        return `${encontro.data_inicio.split("-").reverse().join("/")} – ${encontro.data_fim.split("-").reverse().join("/")}`;
    }

    if (encontro.data_inicio) {
        return encontro.data_inicio.split("-").reverse().join("/");
    }

    return "Data a definir";
}

// componente separado para os grupos,
// que são listados na barra lateral esquerda, e também podem ser ordenados
function ItemGrupo({
    grupo,
    modoEdicao,
}: {
    grupo: Grupo;
    modoEdicao: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: grupo.id });

    if (!modoEdicao) {
        return (
            <li style={{ padding: "0.4rem 0" }}>
                <a
                    href={`#grupo-${grupo.slug}`}
                    style={{ textDecoration: "none" }}
                >
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

// componente separado para os eventos,
// que são listados na barra lateral direita, e também podem ser ordenados
function ItemEvento({
    evento,
    modoEdicao,
}: {
    evento: any;
    modoEdicao: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: evento.id });

    if (!modoEdicao) {
        return (
            <li style={{ padding: "0.4rem 0" }}>
                <a
                    href={`#evento-${evento.id}`}
                    style={{ textDecoration: "none" }}
                >
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

// tipo das props da página, que inclui os grupos, encontros e eventos 
// carregados do banco de dados
type Props = {
    grupos: Grupo[];
    encontros: Encontro[];
    eventos: any[];
};

export default function Home({ grupos, encontros, eventos }: Props) {
    const [ordemGrupos, setOrdemGrupos] = useState(grupos);
    const [modoEdicao, setModoEdicao] = useState(false);

    const [ordemEventos, setOrdemEventos] = useState(eventos);
    const [modoEdicaoEventos, setModoEdicaoEventos] = useState(false);

    const router = useRouter();

    // função para filtrar os encontros que pertencem a um grupo,
    // considerando tanto encontros normais (com grupo_id)
    // quanto encontros que fazem parte de um evento (evento_id) que inclui o grupo
    function encontrosDoGrupo(grupoId: string) {
        return ordenarEncontrosPorData(
            encontros.filter((e) => {
                // encontros normais do grupo
                if (e.grupo_id === grupoId) return true;

                // encontros que pertencem a um evento
                if (e.evento_id) {
                    const evento = eventos.find(ev => ev.id === e.evento_id);

                    if (!evento) return false;

                    if (evento.todos_os_grupos) return true;

                    if (evento.grupos_envolvidos?.includes(grupoId)) return true;
                }

                return false;
            })
        );
    }

    // função para filtrar os encontros que pertencem a um evento,
    // considerando o campo evento_id do encontro
    // (e não o grupo_id, pois um evento pode incluir vários grupos)
    function encontrosDoEvento(eventoId: string) {
        return ordenarEncontrosPorData(
            encontros.filter((e) => e.evento_id === eventoId)
        );
    }

    // useEffect para rolar até o grupo ou evento específico se a URL tiver um hash (ex: /admin/grupos#grupo-jovens)
    useEffect(() => {
        function handleHash() {
            const hash = window.location.hash;
            if (!hash) return;

            const el = document.getElementById(hash.replace("#", ""));
            el?.scrollIntoView({ behavior: "smooth" });
        }

        handleHash();
        window.addEventListener("hashchange", handleHash);

        return () => {
            window.removeEventListener("hashchange", handleHash);
        };
    }, []);

    // useEffect para atualizar a ordem quando os grupos mudarem (ex: nova ordem salva ou grupo editado)
    async function onDragEnd(event: any) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = ordemGrupos.findIndex(g => g.id === active.id);
        const newIndex = ordemGrupos.findIndex(g => g.id === over.id);

        const novaOrdem = arrayMove(ordemGrupos, oldIndex, newIndex);
        setOrdemGrupos(novaOrdem);
    }

    // função para salvar a nova ordem no banco de dados e sair do modo de edição (que volta a mostrar os links normais)
    async function salvarOrdem() {
        await fetch("/api/grupos/ordenar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ordem: ordemGrupos.map((g, index) => ({
                    id: g.id,
                    ordem: index + 1,
                })),
            }),
        });

        setModoEdicao(false);
        router.replace(router.asPath);
    }

    // funções equivalentes para os eventos (que são listados na barra lateral direita)
    async function onDragEndEventos(event: any) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = ordemEventos.findIndex(e => e.id === active.id);
        const newIndex = ordemEventos.findIndex(e => e.id === over.id);

        const novaOrdem = arrayMove(ordemEventos, oldIndex, newIndex);
        setOrdemEventos(novaOrdem);
    }

    // função para salvar a nova ordem dos eventos no banco de dados e sair do modo de edição (que volta a mostrar os links normais)
    async function salvarOrdemEventos() {
        await fetch("/api/eventos/ordenar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ordem: ordemEventos.map((e, index) => ({
                    id: e.id,
                    ordem: index + 1,
                })),
            }),
        });

        setModoEdicaoEventos(false);
        router.replace(router.asPath);
    }

    return (
        <main style={{ padding: "2.5rem", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "2rem" }}>
                <aside style={{ width: "220px", position: "sticky", top: "2rem" }}>
                    <h3>Grupos</h3>

                    <div style={{ marginBottom: "1rem" }}>
                        {!modoEdicao ? (
                            <button onClick={() => setModoEdicao(true)}>
                                ✏️ Editar ordem
                            </button>
                        ) : (
                            <button onClick={salvarOrdem}>
                                💾 Salvar ordem
                            </button>
                        )}
                    </div>

                    {modoEdicao ? (
                        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                            <SortableContext
                                items={ordemGrupos.map(g => g.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                    {ordemGrupos.map(grupo => (
                                        <ItemGrupo
                                            key={grupo.id}
                                            grupo={grupo}
                                            modoEdicao={true}
                                        />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                            {ordemGrupos.map(grupo => (
                                <ItemGrupo
                                    key={grupo.id}
                                    grupo={grupo}
                                    modoEdicao={false}
                                />
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
                            <button onClick={salvarOrdemEventos}>
                                💾 Salvar ordem eventos
                            </button>
                        )}
                    </div>

                    {modoEdicaoEventos ? (
                        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEndEventos}>
                            <SortableContext
                                items={ordemEventos.map(e => e.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                    {ordemEventos.map(evento => (
                                        <ItemEvento
                                            key={evento.id}
                                            evento={evento}
                                            modoEdicao={true}
                                        />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
{ordemEventos.map(evento => (
    <ItemEvento
        key={evento.id}
        evento={evento}
        modoEdicao={false}
    />
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
                        }}
                    >
                        <Link href="/grupos/novo">
                            <button
                                style={{
                                    padding: "0.5rem 1rem",
                                    backgroundColor: "#fff4d4f1",
                                    color: "#4bbbc8",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                }}
                            >
                                ➕ Novo grupo
                            </button>
                        </Link>

                        <Link href="/admin/eventos/novo">
                            <button
                                style={{
                                    padding: "0.5rem 1rem",
                                    backgroundColor: "#fff4d4f1",
                                    color: "#ff6136",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                }}
                            >
                                ➕ Novo evento
                            </button>
                        </Link>
                    </div>
                    {ordemGrupos.map(grupo => (
                        <section
                            id={`grupo-${grupo.slug}`}
                            key={grupo.id}
                            style={{
                                background: "#fff4d4f1",
                                borderRadius: "10px",
                                padding: "2rem",
                                marginBottom: "2.5rem",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: "1.4rem",
                                        fontWeight: 500,
                                        color: "#4bbbc8",
                                    }}
                                >
                                    {grupo.nome}
                                </h2>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "1rem",
                                        fontSize: "0.95rem",
                                    }}
                                >
                                    <Link
                                        href={`/grupos/${grupo.slug}/editar`}
                                        style={{
                                            textDecoration: "none",
                                            color: "#2f4858",
                                        }}
                                    >
                                        ✏️ Editar grupo
                                    </Link>

                                    <button
                                        onClick={async () => {
                                            if (!confirm("Excluir grupo?")) return;

                                            await fetch("/api/grupos", {
                                                method: "DELETE",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ grupoId: grupo.id }),
                                            });

                                            router.replace(router.asPath);
                                        }}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            padding: 0,
                                            color: "#8b0000",
                                            cursor: "pointer",
                                            fontSize: "0.95rem",
                                        }}
                                    >
                                        🗑 Excluir grupo
                                    </button>
                                </div>
                            </div>

                            <p><em>{grupo.faixa_etaria}</em></p>
                            <p>{grupo.descricao}</p>

                            <h3 style={{ marginTop: "1.5rem" }}>Encontros</h3>

                            <ul>
                                {encontrosDoGrupo(grupo.id).length === 0 && (
                                    <li>Nenhum encontro cadastrado.</li>
                                )}

                                {encontrosDoGrupo(grupo.id).map(encontro => (
                                    <li
                                        key={encontro.id}
                                        style={{
                                            marginBottom: "0.8rem",
                                            padding: "0.8rem",
                                            border: "1px solid #e0d8c3",
                                            borderRadius: "8px",
                                            backgroundColor: "#fffdf7",
                                            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                                        }}
                                    >
                                        <strong>{labelData(encontro)}</strong>
                                        {encontro.titulo && ` — ${encontro.titulo}`}

                                        <div style={{ marginTop: "0.3rem", fontSize: "0.9rem" }}>
                                            <Link href={`/grupos/${grupo.slug}/editar-encontro/${encontro.id}`}>
                                                ✏️ Editar
                                            </Link>

                                            {" | "}

                                            <button
                                                onClick={async () => {
                                                    if (!confirm("Excluir encontro?")) return;

                                                    await fetch("/api/encontros", {
                                                        method: "DELETE",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            id: encontro.id,
                                                            grupo_id: grupo.id,
                                                        }),
                                                    });

                                                    router.replace(router.asPath);
                                                }}
                                                style={{
                                                    background: "transparent",
                                                    border: "none",
                                                    color: "darkred",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                🗑 Excluir
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div style={{ marginTop: "1rem" }}>
                                <Link href={`/grupos/${grupo.slug}/novo-encontro`}>
                                    ➕ Novo encontro
                                </Link>
                            </div>
                        </section>
                    ))}
                    <h2 style={{ marginTop: "3rem", color: "#ff6136" }}>
                        Eventos
                    </h2>

                    {ordemEventos.map((evento) => {
                        const encontrosEvento = encontrosDoEvento(evento.id);

                        return (
                            <section
                                id={`evento-${evento.id}`}
                                key={evento.id}
                                style={{
                                    background: "#fff4d4f1",
                                    borderRadius: "10px",
                                    padding: "2rem",
                                    marginBottom: "2.5rem",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <h2
                                        style={{
                                            margin: 0,
                                            fontSize: "1.4rem",
                                            fontWeight: 500,
                                            color: "#ff6136",
                                        }}
                                    >
                                        {evento.titulo}
                                    </h2>

                                    <div style={{ display: "flex", gap: "1rem" }}>
                                        <Link href={`/admin/eventos/editar/${evento.id}`}>
                                            ✏️ Editar evento
                                        </Link>

                                        <button
                                            onClick={async () => {
                                                if (!confirm("Excluir evento?")) return;

                                                await fetch("/api/eventos", {
                                                    method: "DELETE",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ id: evento.id }),
                                                });

                                                router.replace(router.asPath);
                                            }}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "darkred",
                                                cursor: "pointer",
                                            }}
                                        >
                                            🗑 Excluir evento
                                        </button>
                                    </div>
                                </div>

                                {/* 🔵 ENCONTROS DO EVENTO */}
                                <h3 style={{ marginTop: "1.5rem" }}>Encontros do Evento</h3>

                                <ul>
                                    {encontrosEvento.length === 0 && (
                                        <li>Nenhum encontro cadastrado.</li>
                                    )}

                                    {encontrosEvento.map((encontro) => {
                                        const organizacao = encontro.nivel === "organizacao";

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
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
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
                                                            letterSpacing: "0.5px",
                                                        }}
                                                    >
                                                        {organizacao ? "ORGANIZAÇÃO" : "EVENTO"}
                                                    </span>
                                                </div>

                                                {encontro.titulo && ` — ${encontro.titulo}`}

                                                <div style={{ marginTop: "0.3rem", fontSize: "0.9rem" }}>
                                                    <Link
                                                        href={`/admin/eventos/${evento.id}/editar-encontro/${encontro.id}`}
                                                    >
                                                        ✏️ Editar
                                                    </Link>

                                                    {" | "}

                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm("Excluir encontro?")) return;

                                                            await fetch("/api/encontros", {
                                                                method: "DELETE",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({
                                                                    id: encontro.id,
                                                                    evento_id: evento.id,
                                                                }),
                                                            });

                                                            router.replace(router.asPath);
                                                        }}
                                                        style={{
                                                            background: "transparent",
                                                            border: "none",
                                                            color: "darkred",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        🗑 Excluir
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* 🔵 BOTÃO NOVO ENCONTRO */}
                                <div style={{ marginTop: "1rem" }}>
                                    <Link href={`/admin/eventos/${evento.id}/novo-encontro`}>
                                        ➕ Novo encontro
                                    </Link>
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}

export async function getStaticProps() {
    const grupos = await getGruposOrdenados();
    const encontros = await getEncontros();
    const eventos = await getEventos();

    return {
        props: { grupos, encontros, eventos },
        revalidate: 1,
    };
}