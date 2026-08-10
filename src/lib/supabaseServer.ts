import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const secretKey = process.env.SUPABASE_SECRET_KEY!;

// 서버(API 라우트)에서만 사용하는 관리자 클라이언트. RLS를 무시하므로
// 절대 브라우저로 이 키가 노출되면 안 됩니다 (NEXT_PUBLIC_ 접두사 사용 금지).
export const supabaseAdmin = createClient(supabaseUrl, secretKey);
