import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// 브라우저(클라이언트 컴포넌트)에서 쓰는 클라이언트. RLS가 적용되므로
// 정책을 열어주지 않은 테이블은 이 키로 읽고 쓸 수 없습니다.
export const supabase = createClient(supabaseUrl, publishableKey);
