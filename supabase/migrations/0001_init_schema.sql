-- ============================================================
-- 카페 경영 대시보드 초기 스키마
-- OK POS(오케이포스) 엑셀 리포트 기반 설계
-- ============================================================

-- 1. 거래(영수증) 단위 - 당일매출상세현황 기반
create table sales_transactions (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null,
  receipt_no text not null,        -- 영수증번호
  pos_no text,                     -- 포스번호
  paid_at time not null,           -- 결제시각
  order_type text not null,        -- 매출 / 반품
  total_amount int not null,       -- 총매출액
  net_amount int not null,         -- 실매출액
  supply_amount int,               -- 가액
  vat_amount int,                  -- 부가세
  guest_count int,                 -- 객수
  unit_price int,                  -- 객단가
  created_at timestamptz default now(),
  unique(sale_date, receipt_no)
);

-- 2. 결제수단 상세 (정규화 - 매일 컬럼 개수가 달라지는 문제 해결)
create table sales_payments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references sales_transactions(id) on delete cascade,
  payment_method text not null,    -- 단순현금 / 현금영수 / 신용카드
  amount int not null
);

-- 3. 상품 마스터 (원가는 수동입력, nullable)
create table products (
  product_code text primary key,   -- 상품코드
  product_name text not null,
  category text,                   -- 대분류
  cost_price int,                  -- 원가 (수동입력)
  updated_at timestamptz default now()
);

-- 4. 상품별 일일 판매 - 상품ABC분석 기반
create table sales_by_product (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null,
  product_code text references products(product_code),
  net_amount int not null,         -- 실매출액
  quantity int not null,           -- 판매수량
  abc_grade text,                  -- A/B/C/Z 등급
  created_at timestamptz default now(),
  unique(sale_date, product_code)
);

-- 5. 고정비/변동비 (수동입력)
create table expenses (
  id uuid primary key default gen_random_uuid(),
  expense_month date not null,     -- 해당 월 (YYYY-MM-01)
  category text not null,          -- 임대료/인건비/재료비 등
  cost_type text not null,         -- 고정비 / 변동비
  amount int not null,
  memo text,
  created_at timestamptz default now()
);

-- 6. 매출 목표
create table sales_targets (
  target_month date primary key,
  target_amount int not null
);

-- 인덱스
create index idx_sales_transactions_date on sales_transactions(sale_date);
create index idx_sales_by_product_date on sales_by_product(sale_date);
create index idx_sales_payments_txn on sales_payments(transaction_id);
