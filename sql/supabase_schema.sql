-- =========================================================
-- Chiquinho dos Doces — Painel de Gestão
-- Schema do Supabase: tabelas, triggers e políticas de RLS
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Função utilitária: atualiza updated_at automaticamente
-- ---------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================================================
-- TABELA: products
-- =========================================================
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10, 2) not null check (price >= 0),
  category text not null check (category in ('mousse', 'torta')),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- =========================================================
-- TABELA: orders
-- =========================================================
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_whatsapp text not null,
  delivery_type text not null check (delivery_type in ('entrega', 'retirada')),
  address text,
  number text,
  neighborhood text,
  reference text,
  payment_method text not null check (payment_method in ('pix', 'dinheiro', 'cartao')),
  change_for text,
  observation text,
  subtotal numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  status text not null default 'novo'
    check (status in ('novo', 'em_preparo', 'saiu_entrega', 'entregue', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- =========================================================
-- TABELA: order_items
-- =========================================================
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null default 0,
  subtotal numeric(10, 2) not null default 0,
  observation text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at);
create index if not exists idx_products_category_active on products(category, is_active);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- ---- products ----
-- Catálogo (público/anônimo) só enxerga produtos ativos
drop policy if exists "public_read_active_products" on products;
create policy "public_read_active_products"
  on products for select
  to anon
  using (is_active = true);

-- Administrador autenticado enxerga e gerencia todos os produtos
drop policy if exists "admin_read_all_products" on products;
create policy "admin_read_all_products"
  on products for select
  to authenticated
  using (true);

drop policy if exists "admin_insert_products" on products;
create policy "admin_insert_products"
  on products for insert
  to authenticated
  with check (true);

drop policy if exists "admin_update_products" on products;
create policy "admin_update_products"
  on products for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin_delete_products" on products;
create policy "admin_delete_products"
  on products for delete
  to authenticated
  using (true);

-- ---- orders ----
-- Qualquer cliente (anônimo) pode criar um pedido pelo checkout
drop policy if exists "public_create_orders" on orders;
create policy "public_create_orders"
  on orders for insert
  to anon
  with check (true);

-- Somente administrador autenticado pode ver e alterar pedidos
drop policy if exists "admin_read_orders" on orders;
create policy "admin_read_orders"
  on orders for select
  to authenticated
  using (true);

drop policy if exists "admin_update_orders" on orders;
create policy "admin_update_orders"
  on orders for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "admin_delete_orders" on orders;
create policy "admin_delete_orders"
  on orders for delete
  to authenticated
  using (true);

-- ---- order_items ----
-- Qualquer cliente (anônimo) pode criar os itens do próprio pedido no checkout
drop policy if exists "public_create_order_items" on order_items;
create policy "public_create_order_items"
  on order_items for insert
  to anon
  with check (true);

-- Somente administrador autenticado pode ver os itens dos pedidos
drop policy if exists "admin_read_order_items" on order_items;
create policy "admin_read_order_items"
  on order_items for select
  to authenticated
  using (true);

drop policy if exists "admin_delete_order_items" on order_items;
create policy "admin_delete_order_items"
  on order_items for delete
  to authenticated
  using (true);

-- =========================================================
-- Produtos iniciais (opcional) — mesmo catálogo que já existe no site,
-- para popular a tabela na primeira vez. Pode apagar este bloco se
-- preferir cadastrar tudo manualmente pelo painel.
-- =========================================================
insert into products (name, description, price, category, image_url, is_active)
select * from (values
  ('Mousse de Maracujá', 'Refrescante e cremosa, com polpa de maracujá.', 15.00, 'mousse', 'img/mousse-maracuja.png', true),
  ('Mousse de Limão', 'Leve e cítrica, com toque especial de limão.', 15.00, 'mousse', 'img/mousse-limao.png', true),
  ('Mousse de Morango', 'Doce na medida certa, com pedaços de morango.', 15.00, 'mousse', 'img/mousse-morango.png', true),
  ('Mousse de Chocolate', 'Cremosa e intensa, para os apaixonados por chocolate.', 15.00, 'mousse', 'img/mousse-chocolate.jpg', true),
  ('Torta de Bolacha Tradicional', 'Clássica e irresistível, feita com camadas de bolacha e creme.', 15.00, 'torta', null, true),
  ('Torta de Bolacha de Chocolate', 'Camadas de bolacha com creme de chocolate e cobertura especial.', 15.00, 'torta', null, true)
) as seed(name, description, price, category, image_url, is_active)
where not exists (select 1 from products);

-- =========================================================
-- Criar o usuário administrador
-- =========================================================
-- Este schema não cria o login automaticamente. Crie o admin em:
-- Supabase Dashboard → Authentication → Users → Add user
-- (defina um e-mail e senha; use-os para entrar em admin.html)
