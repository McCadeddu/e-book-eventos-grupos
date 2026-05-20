import fs from "fs";
import path from "path";

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
};

function caminhoData(nomeArquivo: string) {
    return path.join(process.cwd(), "..", "data", nomeArquivo);
}

export function carregarEdicoesEbook(): EbookCollectionResolved {
    const caminhoColecao = caminhoData("ebooks.json");

    if (fs.existsSync(caminhoColecao)) {
        const conteudo = fs.readFileSync(caminhoColecao, "utf-8");
        const dados = JSON.parse(conteudo) as EbookCollection;
        const anoPublicado =
            dados.ano_publicado ?? dados.ano_atual ?? dados.edicoes?.[0]?.ano ?? 0;
        const anoEmPreparacao =
            dados.ano_em_preparacao ?? anoPublicado;

        return {
            anoPublicado,
            anoEmPreparacao,
            edicoes: dados.edicoes ?? [],
        };
    }

    const caminhoLegado = caminhoData("ebook.json");
    const conteudoLegado = fs.readFileSync(caminhoLegado, "utf-8");
    const edicaoLegada = JSON.parse(conteudoLegado) as EbookConfig;

    return {
        anoPublicado: edicaoLegada.ano,
        anoEmPreparacao: edicaoLegada.ano,
        edicoes: [edicaoLegada],
    };
}

function encontrarEdicaoOuFalhar(ano: number) {
    const { edicoes } = carregarEdicoesEbook();
    const edicao = edicoes.find((item) => item.ano === ano) ?? edicoes[0];

    if (!edicao) {
        throw new Error("Nenhuma edicao de e-book foi configurada.");
    }

    return edicao;
}

export function carregarEbookPublicado() {
    const { anoPublicado } = carregarEdicoesEbook();
    return encontrarEdicaoOuFalhar(anoPublicado);
}

export function carregarEbookEmPreparacao() {
    const { anoEmPreparacao } = carregarEdicoesEbook();
    return encontrarEdicaoOuFalhar(anoEmPreparacao);
}

export function carregarEbookAtual() {
    return carregarEbookPublicado();
}

export function getAnoPublicadoEbook() {
    return carregarEbookPublicado().ano;
}

export function getAnoEmPreparacaoEbook() {
    return carregarEbookEmPreparacao().ano;
}

export function getAnoAtualEbook() {
    return getAnoPublicadoEbook();
}

export function carregarEbookPorAno(ano: number) {
    const { edicoes } = carregarEdicoesEbook();
    return edicoes.find((edicao) => edicao.ano === ano) ?? null;
}

export function listarAnosEbook() {
    return carregarEdicoesEbook()
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
