import fs from "fs";
import path from "path";
import { supabase } from "./supabaseClient";

export type EbookConfig = {
    ano: number;
    titulo: string;
    subtitulo: string;
    botao_texto: string;
    capas: string[];
    logo: string;
};

type EbookCollection = {
    ano_atual?: number;
    ano_publicado?: number;
    ano_em_preparacao?: number;
    edicoes: EbookConfig[];
};

type EbookCollectionResolved = {
    anoPublicado: number;
    anoEmPreparacao: number;
    edicoes: EbookConfig[];
    origem: "supabase" | "arquivo";
};

type EbookEdicaoRow = {
    ano: number;
    titulo: string;
    subtitulo: string | null;
    botao_texto: string | null;
    capas: string[] | null;
    logo: string | null;
};

type EbookEstadoRow = {
    id: string;
    ano_publicado: number | null;
    ano_em_preparacao: number | null;
};

function caminhoData(nomeArquivo: string) {
    return path.join(process.cwd(), "..", "data", nomeArquivo);
}

function normalizarEdicao(row: EbookEdicaoRow): EbookConfig {
    return {
        ano: row.ano,
        titulo: row.titulo,
        subtitulo: row.subtitulo ?? "",
        botao_texto: row.botao_texto ?? "Abrir agenda",
        capas: Array.isArray(row.capas) ? row.capas : [],
        logo: row.logo ?? "/villaregia-logo.png",
    };
}

function carregarEdicoesDeArquivo(): EbookCollectionResolved {
    const caminhoColecao = caminhoData("ebooks.json");

    if (fs.existsSync(caminhoColecao)) {
        const conteudo = fs.readFileSync(caminhoColecao, "utf-8");
        const dados = JSON.parse(conteudo) as EbookCollection;
        const anoPublicado =
            dados.ano_publicado ?? dados.ano_atual ?? dados.edicoes?.[0]?.ano ?? 0;
        const anoEmPreparacao = dados.ano_em_preparacao ?? anoPublicado;

        return {
            anoPublicado,
            anoEmPreparacao,
            edicoes: dados.edicoes ?? [],
            origem: "arquivo",
        };
    }

    const caminhoLegado = caminhoData("ebook.json");
    const conteudoLegado = fs.readFileSync(caminhoLegado, "utf-8");
    const edicaoLegada = JSON.parse(conteudoLegado) as EbookConfig;

    return {
        anoPublicado: edicaoLegada.ano,
        anoEmPreparacao: edicaoLegada.ano,
        edicoes: [edicaoLegada],
        origem: "arquivo",
    };
}

export async function carregarEdicoesEbook(): Promise<EbookCollectionResolved> {
    try {
        const [{ data: edicoes, error: erroEdicoes }, { data: estado, error: erroEstado }] =
            await Promise.all([
                supabase.from("ebook_edicoes").select("*").order("ano", { ascending: true }),
                supabase.from("ebook_estado").select("*").eq("id", "principal").maybeSingle(),
            ]);

        if (erroEdicoes || erroEstado) {
            throw erroEdicoes ?? erroEstado;
        }

        const listaEdicoes = (edicoes ?? []).map((row) =>
            normalizarEdicao(row as EbookEdicaoRow)
        );

        if (listaEdicoes.length === 0) {
            return carregarEdicoesDeArquivo();
        }

        const estadoAtual = estado as EbookEstadoRow | null;
        const anoPublicado =
            estadoAtual?.ano_publicado ?? listaEdicoes[0]?.ano ?? 0;
        const anoEmPreparacao =
            estadoAtual?.ano_em_preparacao ?? anoPublicado;

        return {
            anoPublicado,
            anoEmPreparacao,
            edicoes: listaEdicoes,
            origem: "supabase",
        };
    } catch {
        return carregarEdicoesDeArquivo();
    }
}

async function encontrarEdicaoOuFalhar(ano: number) {
    const { edicoes } = await carregarEdicoesEbook();
    const edicao = edicoes.find((item) => item.ano === ano) ?? edicoes[0];

    if (!edicao) {
        throw new Error("Nenhuma edicao de e-book foi configurada.");
    }

    return edicao;
}

export async function carregarEbookPublicado() {
    const { anoPublicado } = await carregarEdicoesEbook();
    return encontrarEdicaoOuFalhar(anoPublicado);
}

export async function carregarEbookEmPreparacao() {
    const { anoEmPreparacao } = await carregarEdicoesEbook();
    return encontrarEdicaoOuFalhar(anoEmPreparacao);
}

export async function carregarEbookAtual() {
    return carregarEbookPublicado();
}

export async function getAnoPublicadoEbook() {
    return (await carregarEbookPublicado()).ano;
}

export async function getAnoEmPreparacaoEbook() {
    return (await carregarEbookEmPreparacao()).ano;
}

export async function getAnoAtualEbook() {
    return getAnoPublicadoEbook();
}

export async function carregarEbookPorAno(ano: number) {
    const { edicoes } = await carregarEdicoesEbook();
    return edicoes.find((edicao) => edicao.ano === ano) ?? null;
}

export async function listarAnosEbook() {
    return (await carregarEdicoesEbook())
        .edicoes.map((edicao) => edicao.ano)
        .sort((a, b) => a - b);
}

export function pertenceAoAno(
    dataIso: string | null | undefined,
    ano: number
) {
    if (!dataIso) {
        return false;
    }

    return Number(dataIso.slice(0, 4)) === ano;
}
