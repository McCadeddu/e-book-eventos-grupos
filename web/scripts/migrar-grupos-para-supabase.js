// web/scripts/migrar-grupos-para-supabase.js

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

// caminho do JSON atual
const caminho = path.join(process.cwd(), "..", "data", "grupos.json");

async function migrar() {
    const conteudo = fs.readFileSync(caminho, "utf-8");
    const dados = JSON.parse(conteudo);

    const grupos = dados.grupos;

    if (!Array.isArray(grupos)) {
        console.error("❌ Estrutura inválida em grupos.json");
        process.exit(1);
    }

    console.log(`🔄 Migrando ${grupos.length} grupos...`);

    for (const grupo of grupos) {
        const { error } = await supabase
            .from("grupos")
            .upsert({
                id: grupo.id,
                slug: grupo.slug,
                nome: grupo.nome,
                faixa_etaria: grupo.faixa_etaria,
                descricao: grupo.descricao,
                objetivo_ano: grupo.objetivo_ano,
                convite_final: grupo.convite_final,
                equipe: grupo.equipe,
                categoria: grupo.categoria || "grupo",
                ordem: grupo.ordem ?? 0,
            });

        if (error) {
            console.error(`❌ Erro ao migrar ${grupo.nome}:`, error.message);
        } else {
            console.log(`✅ ${grupo.nome}`);
        }
    }

    console.log("🎉 Migração concluída.");
}

migrar();
