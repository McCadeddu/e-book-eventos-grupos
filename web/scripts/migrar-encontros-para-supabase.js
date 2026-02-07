// /web/scripts/migrar-encontros-para-supabase.js

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Variáveis de ambiente do Supabase não encontradas");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// caminho do JSON atual de encontros
const caminho = path.join(process.cwd(), "..", "data", "encontros.json");

async function migrar() {
    const conteudo = fs.readFileSync(caminho, "utf-8");
    const dados = JSON.parse(conteudo);

    const encontros = dados.encontros;

    if (!Array.isArray(encontros)) {
        console.error("❌ Estrutura inválida em encontros.json");
        process.exit(1);
    }

    console.log(`🔄 Migrando ${encontros.length} encontros...`);

    for (const encontro of encontros) {
        const { error } = await supabase
            .from("encontros")
            .upsert({
                id: encontro.id,
                grupo_id: encontro.grupo_id,

                data_inicio: encontro.data_inicio,
                data_fim: encontro.data_fim || null,

                data_legivel: encontro.data_legivel,
                horario: encontro.horario,
                local: encontro.local,

                titulo: encontro.titulo,
                descricao: encontro.descricao,

                tipo: encontro.tipo,
                visibilidade: encontro.visibilidade,
            });

        if (error) {
            console.error(
                `❌ Erro ao migrar encontro ${encontro.id}:`,
                error.message
            );
        }
    }

    console.log("🎉 Migração de encontros concluída.");
}

migrar();