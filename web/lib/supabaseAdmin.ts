import { createClient } from "@supabase/supabase-js";

function getSupabaseAdminConfig() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

    return { url, serviceRoleKey };
}

export function getSupabaseAdminClient() {
    const { url, serviceRoleKey } = getSupabaseAdminConfig();

    if (!url || !serviceRoleKey) {
        throw new Error(
            "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para habilitar uploads administrativos."
        );
    }

    return createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export const EBOOK_ASSETS_BUCKET = "ebook-assets";
