-- Read permissions and exercise transactions using temporary, non-personal fixtures.
-- All inserted fixtures and changes are rolled back; no email is sent.
begin;

do $verify$
declare
  fixture uuid := gen_random_uuid();
  tbl text;
  fn text;
  n integer;
begin
  foreach tbl in array array['leads','email_outbox','rate_limits'] loop
    if not exists(select 1 from pg_class c join pg_namespace ns on ns.oid=c.relnamespace where ns.nspname='public' and c.relname=tbl and c.relrowsecurity) then
      raise exception 'RLS not enabled on %',tbl;
    end if;
    if has_table_privilege('anon','public.'||tbl,'select,insert,update,delete') then
      raise exception 'Anonymous table access unexpectedly allowed on %',tbl;
    end if;
  end loop;
  if has_table_privilege('authenticated','public.leads','insert,update,delete') then raise exception 'Authenticated users can write leads directly';end if;
  foreach fn in array array['public.finalize_lead(uuid,jsonb,text)','public.consume_rate_limit(text)','public.mark_email_sent(uuid)'] loop
    if has_function_privilege('anon',fn,'execute') or has_function_privilege('authenticated',fn,'execute') then raise exception 'Privileged RPC accessible to visitors: %',fn;end if;
    if not has_function_privilege('service_role',fn,'execute') then raise exception 'Service role cannot execute %',fn;end if;
  end loop;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='leads') then raise exception 'Realtime publication missing';end if;
  insert into public.leads(id,mode,status,owner_hash,raw_transcript) values(fixture,'voice','draft',repeat('0',64),'Temporary VidyaConnect verification fixture');
  perform set_config('vidyaconnect.verify_lead',fixture::text,true);
  perform public.finalize_lead(fixture,jsonb_build_object('name','Verification fixture','phone','9876543210','email','verification@example.invalid','school_name','Verification institution','bullet_requirements',jsonb_build_array('Temporary test requirement'),'objective','Demo'),'confirmed');
  perform public.finalize_lead(fixture,jsonb_build_object('name','Should not overwrite'),'confirmed');
  if not exists(select 1 from public.leads where id=fixture and status='confirmed' and name='Verification fixture' and raw_transcript='Temporary VidyaConnect verification fixture') then raise exception 'Finalization is not immutable or lost transcript';end if;
  if (select count(*) from public.email_outbox where lead_id=fixture)<>1 then raise exception 'Email outbox was not queued exactly once';end if;
  perform public.mark_email_sent(fixture);
  if not exists(select 1 from public.leads where id=fixture and email_sent) then raise exception 'Email state was not updated';end if;
  for n in 1..30 loop
    if not public.consume_rate_limit('verification-'||fixture::text) then raise exception 'Rate limiter rejected request % too early',n;end if;
  end loop;
  if public.consume_rate_limit('verification-'||fixture::text) then raise exception 'Rate limiter did not enforce its limit';end if;
end;
$verify$;

-- A user-controlled user_metadata.role must never unlock the admin feed.
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","user_metadata":{"role":"admin"},"app_metadata":{}}',true);
do $verify$
begin
  if exists(select 1 from public.leads where id=current_setting('vidyaconnect.verify_lead')::uuid) then raise exception 'Non-manager can read leads';end if;
end;
$verify$;

-- Trusted app_metadata.role=admin should permit the manager read.
select set_config('request.jwt.claims','{"role":"authenticated","app_metadata":{"role":"admin"}}',true);
do $verify$
begin
  if not exists(select 1 from public.leads where id=current_setting('vidyaconnect.verify_lead')::uuid) then raise exception 'Manager cannot read lead feed';end if;
end;
$verify$;
reset role;
rollback;
select 'VidyaConnect database verification passed; fixtures rolled back' as result;
