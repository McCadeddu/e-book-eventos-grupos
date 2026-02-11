// web/pages/admin/grupos.tsx

import Link from "next/link";
import { Grupo } from "../../lib/types";
import { getGruposOrdenados } from "../../lib/db/grupos";
import { getEncontros } from "../../lib/db/encontros";
import { Encontro, ordenarEncontrosPorData } from "../../lib/encontros-utils";

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

type Props = {
    grupos: Grupo[];
    encontros: Encontro[];
};

export default function Home({ grupos, encontros }: Props) {
    const [ordemGrupos, setOrdemGrupos] = useState(grupos);
    const [modoEdicao, setModoEdicao] = useState(false);

    const router = useRouter();

    function encontrosDoGrupo(grupoId: string) {
        return ordenarEncontrosPorData(
            encontros.filter((e) => e.grupo_id === grupoId)
        );
    }

    useEffect(() => {
        const hash = window.location.hash;
        if (!hash) return;
        const el = document.getElementById(hash.replace("#", ""));
        el?.scrollIntoView({ behavior: "smooth" });
    }, [grupos]);

    async function onDragEnd(event: any) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = ordemGrupos.findIndex(g => g.id === active.id);
        const newIndex = ordemGrupos.findIndex(g => g.id === over.id);

        const novaOrdem = arrayMove(ordemGrupos, oldIndex, newIndex);
        setOrdemGrupos(novaOrdem);
    }

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
                </aside>

                <div style={{ flex: 1 }}>
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
                                <h2>{grupo.nome}</h2>

                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <Link href={`/grupos/${grupo.slug}/editar`}>
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
                                            background: "transparent",
                                            border: "none",
                                            color: "darkred",
                                            cursor: "pointer",
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
                                    <li key={encontro.id} style={{ marginBottom: "0.6rem" }}>
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
                </div>
            </div>
        </main>
    );
}

export async function getStaticProps() {
    const grupos = await getGruposOrdenados();
    const encontros = await getEncontros();

    return {
        props: { grupos, encontros },
        revalidate: 1,
    };
}