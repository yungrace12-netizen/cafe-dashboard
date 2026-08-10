-- ============================================================
-- 원재료 기반 레시피 원가 계산 (BOM)
-- ============================================================

-- 원재료 마스터 (원두, 우유, 설탕 등)
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,               -- 예: 원두, 우유, 설탕시럽
  unit text not null,                -- 기준 단위: g / ml / 개
  package_amount numeric not null,   -- 팩 용량 (예: 1000 = 1000g)
  package_price int not null,        -- 팩 가격
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 상품별 레시피(BOM): 어떤 상품에 어떤 원재료가 얼마나 들어가는지
create table recipe_items (
  id uuid primary key default gen_random_uuid(),
  product_code text not null references products(product_code) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity numeric not null,         -- 사용량 (ingredients.unit 기준, 예: 18 → 18g)
  created_at timestamptz default now(),
  unique(product_code, ingredient_id)
);

create index idx_recipe_items_product on recipe_items(product_code);
