-- Panel aidat eşleştirmesi için T.C. alanı
alter table public.students add column if not exists tc text not null default '';
create index if not exists students_tc_idx on public.students (tc);
