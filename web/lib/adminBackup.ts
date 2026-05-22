import { randomUUID } from "crypto";
import { supabase } from "./supabaseClient";
import { getSupabaseAdminClient } from "./supabaseAdmin";

type EntidadeBackup = "grupos" | "eventos" | "encontros";
type AcaoBackup = "criar" | "editar" | "excluir";

type BackupMetadata = {
    entidade: EntidadeBackup;
    acao: AcaoBackup;
    referenciaId?: string | null;
};

async function carregarSnapshotAtual() {
    const client = getBackupClient();

    const [gruposResp, eventosResp, encontrosResp] = await Promise.all([
        client.from("grupos").select("*").order("ordem", { ascending: true }),
        client.from("eventos").select("*").order("ordem", { ascending: true }),
        client
            .from("encontros")
            .select("*")
            .order("data_inicio", { ascending: true }),
    ]);

    if (gruposResp.error) throw gruposResp.error;
    if (eventosResp.error) throw eventosResp.error;
    if (encontrosResp.error) throw encontrosResp.error;

    return {
        grupos: gruposResp.data ?? [],
        eventos: eventosResp.data ?? [],
        encontros: encontrosResp.data ?? [],
    };
}

function getBackupClient() {
    try {
        return getSupabaseAdminClient();
    } catch {
        return supabase;
    }
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
            versao: 2,
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
    } catch (error) {
        console.warn(
            "Nao foi possivel salvar o backup automatico:",
            error instanceof Error ? error.message : error
        );
    }
}
