import { supabase } from "../../src/lib/supabase";

import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { user_id } = req.body;
    if (!user_id) {
      return res.status(400).json({ success: false, error: "ID do usuário não fornecido." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("VITE_SUPABASE_URL ou Chave do Supabase ausente nas variáveis de ambiente da Vercel.");
      return res.status(500).json({ success: false, error: "Credenciais do Supabase ausentes no servidor (Vercel)." });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('usuarios')
      .update({ is_approved: true, pago: true, comprovante_enviado: true })
      .eq('id', user_id);

    if (error) {
      console.error("Erro no Supabase ao aprovar usuário:", error.message);
      return res.status(500).json({ success: false, error: `Falha no banco de dados (Supabase): ${error.message}` });
    }

    return res.json({ success: true, message: "Usuário liberado com sucesso!" });
  } catch (error: any) {
    console.error("Erro inesperado na rota approve-user (Vercel):", error.message);
    return res.status(500).json({ success: false, error: "Falha interna no servidor ao liberar usuário." });
  }
}
