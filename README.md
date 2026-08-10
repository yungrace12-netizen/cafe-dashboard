# 카페 경영 대시보드

어머니가 운영하시는 카페의 OK POS 매출 데이터를 업로드해서
매출/손익 현황을 확인하는 대시보드입니다.

## 시작하기

1. Supabase 프로젝트 생성 (https://supabase.com)
2. `.env.local.example`을 `.env.local`로 복사 후 Project URL / anon key 채우기
3. `supabase/migrations/0001_init_schema.sql`을 Supabase SQL Editor에서 실행 (테이블 생성)
4. 로컬 실행

```bash
npm install
npm run dev
```

## 폴더 구조

- `src/app/upload` — OK POS 엑셀(당일매출상세현황, 상품ABC분석) 업로드 화면
- `src/app/dashboard` — 경영 대시보드 (다음 단계에서 차트 구현 예정)
- `src/app/api/upload` — 업로드된 엑셀을 파싱해서 Supabase에 저장하는 API
- `src/lib/parseOkpos.ts` — OK POS 엑셀 파싱 로직
- `supabase/migrations` — DB 스키마

## 데이터 흐름

1. OK POS ASP(`okasp.okpos.co.kr`)에서 `당일매출상세현황`, `상품ABC분석` 엑셀 다운로드
2. `/upload` 화면에서 파일 업로드
3. 서버에서 파싱 → `sales_transactions`, `sales_payments`, `products`, `sales_by_product` 테이블에 저장
4. `products.cost_price`는 수동 입력 (원가는 POS에 없는 데이터)
5. `expenses`, `sales_targets`도 수동 입력 (고정비/변동비, 매출 목표)
