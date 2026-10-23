import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "./supabaseAdmin";

type EntidadeBackup = "grupos" | "eventos" | "encontros";
type AcaoBackup = "criar" | "editar" | "excluir" | "preparar-edicao";

type BackupMetadata = {
    entidade: EntidadeBackup;
    acao: AcaoBackup;
    referenciaId?: string | null;
};

async function carregarSnapshotAtual() {
    const client = getBackupClient();

    const [gruposResp, eventosResp, encontrosResp, gruposEdicao, eventosEdicao, edicoes, estado] = await Promise.all([
        client.from("grupos").select("*").order("ordem", { ascending: true }),
        client.from("eventos").select("*").order("ordem", { ascending: true }),
        client
            .from("encontros")
            .select("*")
            .order("data_inicio", { ascending: true }),
        client.from("grupo_edicoes").select("*"),
        client.from("evento_edicoes").select("*"),
        client.from("ebook_edicoes").select("*"),
        client.from("ebook_estado").select("*"),
    ]);

    if (gruposResp.error) throw gruposResp.error;
    if (eventosResp.error) throw eventosResp.error;
    if (encontrosResp.error) throw encontrosResp.error;
    for (const resposta of [gruposEdicao, eventosEdicao, edicoes, estado]) if (resposta.error) throw resposta.error;

    return {
        grupos: gruposResp.data ?? [],
        eventos: eventosResp.data ?? [],
        encontros: encontrosResp.data ?? [],
        grupo_edicoes: gruposEdicao.data ?? [],
        evento_edicoes: eventosEdicao.data ?? [],
        ebook_edicoes: edicoes.data ?? [],
        ebook_estado: estado.data ?? [],
    };
}

function getBackupClient() {
    return getSupabaseAdminClient();
}

async function aplicarRetencaoDeBackups() {
    const client = getBackupClient();
    const { data, error } = await client
        .from("admin_backups")
        .select("id")
        .order("created_at", { ascending: false })
        .range(120, 9999);

    if (error) {
        throw error;
    }

    const ids = (data ?? []).map((item: { id: string }) => item.id);

    if (ids.length === 0) {
        return;
    }

    const { error: erroExcluir } = await client
        .from("admin_backups")
        .delete()
        .in("id", ids);

    if (erroExcluir) {
        throw erroExcluir;
    }
}

export async function salvarBackupAutomatico(metadata: BackupMetadata) {
    try {
        const client = getBackupClient();
        const snapshot = await carregarSnapshotAtual();

        const payload = {
            id: randomUUID(),
            versao: 3,
            origem: "admin-online",
            entidade: metadata.entidade,
            acao: metadata.acao,
            referencia_id: metadata.referenciaId ?? null,
            capturado_em: new Date().toISOString(),
            resumo: {
                total_grupos: snapshot.grupos.length,
                total_eventos: snapshot.eventos.length,
                total_encontros: snapshot.encontros.length,
            },
            payload: snapshot,
        };

        const { error } = await client.from("admin_backups").insert(payload);

        if (error) {
            throw error;
        }

        await aplicarRetencaoDeBackups();
        return { sucesso: true as const };
    } catch (error) {
        console.warn(
            "Nao foi possivel salvar o backup automatico:",
            error instanceof Error ? error.message : error
        );
        return { sucesso: false as const, erro: "Backup nao concluido. Verifique a configuracao administrativa e a tabela admin_backups." };
    }
}
