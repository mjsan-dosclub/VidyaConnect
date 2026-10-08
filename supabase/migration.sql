-- Apply once in the Supabase SQL editor. Secrets never belong in SQL.
create table public.leads (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
 mode text not null check(mode in ('voice','manual')), status text not null default 'draft' check(status in ('draft','submitted','confirmed')),
 name text, phone text check(phone is null or phone='' or phone ~ '^[6-9][0-9]{9}$'), email text, school_name text, raw_transcript text,
 bullet_requirements jsonb not null default '[]', callback_date date,
 callback_slot text check(callback_slot in ('Morning','Afternoon','Evening')), objective text check(objective in ('Demo','Know More','Catch-up Call')),
 email_sent boolean not null default false, owner_hash text not null
);
create index leads_created_idx on public.leads(created_at desc);
alter table public.leads enable row level security;
revoke all on public.leads from anon,authenticated;
grant select on public.leads to authenticated;
create policy admin_read on public.leads for select to authenticated using ((auth.jwt()->'app_metadata'->>'role')='admin');
alter publication supabase_realtime add table public.leads;
create table public.email_outbox(lead_id uuid primary key references public.leads(id) on delete cascade, created_at timestamptz not null default now(), sent_at timestamptz);
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon,authenticated;
create table public.rate_limits(key text primary key,window_start timestamptz not null,hits integer not null);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon,authenticated;
create function public.consume_rate_limit(p_key text) returns boolean language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 insert into rate_limits(key,window_start,hits) values(p_key,now(),1) on conflict(key) do update set hits=case when rate_limits.window_start<now()-interval '1 minute' then 1 else rate_limits.hits+1 end,window_start=case when rate_limits.window_start<now()-interval '1 minute' then now() else rate_limits.window_start end returning hits into n;
 delete from rate_limits where window_start<now()-interval '1 day';
 return n<=30;
end;$$;
create function public.finalize_lead(p_id uuid,p_details jsonb,p_status text) returns void language plpgsql security definer set search_path=public as $$
begin
 if p_status not in ('submitted','confirmed') then raise exception 'Invalid status'; end if;
 perform 1 from leads where id=p_id for update;
 if not found then raise exception 'Missing lead'; end if;
 if exists(select 1 from leads where id=p_id and status<>'draft') then return; end if;
 update leads set status=p_status,name=p_details->>'name',phone=p_details->>'phone',email=nullif(p_details->>'email',''),school_name=p_details->>'school_name',bullet_requirements=p_details->'bullet_requirements',objective=p_details->>'objective',callback_date=(p_details->>'callback_date')::date,callback_slot=p_details->>'callback_slot' where id=p_id;
 if nullif(p_details->>'email','') is not null then insert into email_outbox(lead_id) values(p_id) on conflict do nothing; end if;
end;$$;
create function public.mark_email_sent(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin update email_outbox set sent_at=now() where lead_id=p_id;update leads set email_sent=true where id=p_id;end;$$;
revoke execute on function public.finalize_lead(uuid,jsonb,text),public.consume_rate_limit(text),public.mark_email_sent(uuid) from public,anon,authenticated;
grant execute on function public.finalize_lead(uuid,jsonb,text),public.consume_rate_limit(text),public.mark_email_sent(uuid) to service_role;

grant all on public.leads,public.email_outbox,public.rate_limits to service_role;
