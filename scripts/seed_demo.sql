-- Dados de demonstração para um salão: equipe, serviços, clientes e ~3 meses de agenda
-- (90 dias para trás e 21 para frente, a partir de agora no fuso do salão).
-- Rodado pelo seed_demo.ps1, que cadastra o salão pela API e passa o id dele em :tenant_id.
-- Idempotente: apaga e recria tudo o que pertence a esse salão (o usuário de login fica).

\set ON_ERROR_STOP on
SET client_encoding = 'UTF8';

BEGIN;

CREATE TEMP TABLE ctx AS
SELECT :'tenant_id'::uuid AS tenant_id,
       (now() AT TIME ZONE 'America/Sao_Paulo')::timestamp(0) AS agora;

SELECT setseed(0.42);

-- Limpa o que o salão já tinha
DELETE FROM appointments WHERE tenant_id = (SELECT tenant_id FROM ctx);
DELETE FROM professional_business_hours
 WHERE professional_id IN (SELECT id FROM professionals WHERE tenant_id = (SELECT tenant_id FROM ctx));
DELETE FROM professionals WHERE tenant_id = (SELECT tenant_id FROM ctx);
DELETE FROM services WHERE tenant_id = (SELECT tenant_id FROM ctx);
DELETE FROM customers WHERE tenant_id = (SELECT tenant_id FROM ctx);

-- Salão: seg-sex 8h-22h (aberto até tarde para a demonstração ter movimento à noite),
-- sábado 8h-18h, domingo fechado
UPDATE tenants SET name = 'Salão Bela Vista' WHERE id = (SELECT tenant_id FROM ctx);
DELETE FROM tenant_business_hours WHERE tenant_id = (SELECT tenant_id FROM ctx);
INSERT INTO tenant_business_hours (tenant_id, day_of_week, opening_time, closing_time, is_closed)
SELECT c.tenant_id, d, '08:00',
       CASE WHEN d = 6 THEN time '18:00' ELSE time '22:00' END,
       d = 7
  FROM ctx c, generate_series(1, 7) d;

-- Serviços (todos com até 60 min, o que mantém a agenda sem sobreposição)
INSERT INTO services (id, tenant_id, name, description, price, duration_minutes, requires_online_payment, active, created_at)
SELECT gen_random_uuid(), c.tenant_id, s.name, s.description, s.price, s.duration, false, s.active, c.agora - interval '180 days'
  FROM ctx c, (VALUES
    ('Corte feminino',             'Lavagem, corte e finalização',          90.00, 60, true),
    ('Corte masculino',            'Corte na tesoura ou máquina',           45.00, 30, true),
    ('Barba',                      'Barba com toalha quente',               35.00, 30, true),
    ('Corte + barba',              'Combo corte masculino e barba',         70.00, 60, true),
    ('Escova',                     'Escova modelada',                       60.00, 45, true),
    ('Hidratação',                 'Hidratação profunda com máscara',       85.00, 60, true),
    ('Coloração (retoque de raiz)','Retoque de raiz com tinta do salão',   120.00, 60, true),
    ('Manicure',                   'Cutilagem e esmaltação',                35.00, 45, true),
    ('Pedicure',                   'Cutilagem e esmaltação',                40.00, 45, true),
    ('Design de sobrancelha',      'Design com pinça e henna opcional',     40.00, 30, true),
    ('Progressiva',                'Fora do cardápio desde a última reforma', 180.00, 60, false)
  ) AS s(name, description, price, duration, active);

-- Equipe: cada um com os serviços que costuma fazer
CREATE TEMP TABLE seed_prof (name text, specialization text, active boolean, services text[]);
INSERT INTO seed_prof VALUES
  ('Ana Paula',     'Cabelo',              true,  ARRAY['Corte feminino', 'Escova', 'Hidratação']),
  ('Bruno Martins', 'Barbearia',           true,  ARRAY['Corte masculino', 'Barba', 'Corte + barba']),
  ('Carla Mendes',  'Manicure e pedicure', true,  ARRAY['Manicure', 'Pedicure']),
  ('Diego Rocha',   'Barbearia',           true,  ARRAY['Corte masculino', 'Barba', 'Corte + barba']),
  ('Fernanda Lima', 'Coloração',           true,  ARRAY['Coloração (retoque de raiz)', 'Hidratação', 'Escova']),
  ('Juliana Alves', 'Estética',            true,  ARRAY['Design de sobrancelha', 'Manicure']),
  ('Rafael Souza',  'Barbearia',           false, ARRAY['Corte masculino']);

INSERT INTO professionals (id, tenant_id, name, specialization, active, created_at)
SELECT gen_random_uuid(), c.tenant_id, p.name, p.specialization, p.active, c.agora - interval '180 days'
  FROM seed_prof p, ctx c;

-- Horários próprios: Carla não trabalha às segundas; Diego entra ao meio-dia nos dias de semana
INSERT INTO professional_business_hours (professional_id, day_of_week, opening_time, closing_time, is_closed)
SELECT p.id, 1, '08:00', '22:00', true
  FROM professionals p JOIN ctx c ON c.tenant_id = p.tenant_id
 WHERE p.name = 'Carla Mendes';
INSERT INTO professional_business_hours (professional_id, day_of_week, opening_time, closing_time, is_closed)
SELECT p.id, d, '12:00', '22:00', false
  FROM professionals p JOIN ctx c ON c.tenant_id = p.tenant_id, generate_series(1, 5) d
 WHERE p.name = 'Diego Rocha';

-- Clientes: 120 combinações de nome e sobrenome, telefone único, e-mail em ~60%
CREATE TEMP TABLE seed_cust AS
WITH first_names AS (
  SELECT row_number() OVER () AS i, n FROM unnest(ARRAY[
    'Maria', 'João', 'Ana', 'Pedro', 'Juliana', 'Lucas', 'Fernanda', 'Gabriel', 'Camila', 'Rafael',
    'Beatriz', 'Mateus', 'Larissa', 'Gustavo', 'Letícia', 'Felipe', 'Mariana', 'Thiago', 'Patrícia', 'André',
    'Aline', 'Bruno', 'Vanessa', 'Rodrigo', 'Natália', 'Eduardo', 'Débora', 'Vinícius', 'Renata', 'Caio',
    'Isabela', 'Leonardo', 'Priscila', 'Marcelo', 'Tatiane', 'Daniel', 'Bianca', 'Ricardo', 'Sabrina', 'Otávio']) AS n
), last_names AS (
  SELECT row_number() OVER () AS j, s FROM unnest(ARRAY[
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes',
    'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Araújo', 'Melo', 'Barbosa', 'Cardoso', 'Nascimento', 'Moura']) AS s
)
-- 800 combinações embaralhadas de forma fixa (md5); as 120 primeiras viram clientes
SELECT row_number() OVER (ORDER BY md5(f.n || ' ' || l.s)) AS n, f.n || ' ' || l.s AS name
  FROM first_names f CROSS JOIN last_names l;

INSERT INTO customers (id, tenant_id, name, phone, email, created_at)
SELECT gen_random_uuid(), c.tenant_id, s.name,
       '55' || (ARRAY['86', '86', '86', '85', '11', '98'])[1 + s.n % 6] || '9' || lpad((81230000 + s.n * 37)::text, 8, '0'),
       CASE WHEN random() < 0.6
            THEN translate(lower(s.name), 'áàâãéêíóôõúç ', 'aaaaeeiooouc.') || s.n || '@example.com' END,
       c.agora - (random() * interval '300 days')
  FROM seed_cust s, ctx c
 WHERE s.n <= 120;

-- Agenda: um horário candidato por hora cheia, dentro do expediente (salão ∩ profissional),
-- preenchido com chance maior no passado recente e menor no futuro distante
CREATE TEMP TABLE seed_slot AS
SELECT p.id AS professional_id, sp.services, dia::date AS dia, dia::date + make_time(h, 0, 0) AS inicio
  FROM ctx c
  JOIN professionals p ON p.tenant_id = c.tenant_id AND p.active
  JOIN seed_prof sp ON sp.name = p.name
 CROSS JOIN generate_series((c.agora::date - 90)::timestamp, (c.agora::date + 21)::timestamp, interval '1 day') AS dia
 CROSS JOIN generate_series(8, 21) AS h
  JOIN tenant_business_hours t ON t.tenant_id = c.tenant_id AND t.day_of_week = extract(isodow FROM dia)
  LEFT JOIN professional_business_hours pb ON pb.professional_id = p.id AND pb.day_of_week = extract(isodow FROM dia)
 WHERE NOT t.is_closed
   AND NOT coalesce(pb.is_closed, false)
   AND make_time(h, 0, 0) >= greatest(t.opening_time, coalesce(pb.opening_time, t.opening_time))
   AND make_time(h, 0, 0) + interval '60 minutes' <= least(t.closing_time, coalesce(pb.closing_time, t.closing_time));

CREATE TEMP TABLE seed_appt AS
SELECT s.*,
       s.services[1 + floor(random() * array_length(s.services, 1))::int] AS service_name,
       1 + floor(random() * 120)::int AS customer_n,
       random() AS r
  FROM seed_slot s, ctx c
 WHERE random() < CASE
         WHEN s.dia < c.agora::date - 30 THEN 0.50
         WHEN s.dia < c.agora::date      THEN 0.62
         WHEN s.dia = c.agora::date      THEN 0.75
         WHEN s.dia <= c.agora::date + 7 THEN 0.45
         ELSE 0.20 END;

INSERT INTO appointments (id, tenant_id, customer_id, professional_id, service_id,
                          start_time, end_time, status, price, created_at)
SELECT gen_random_uuid(), c.tenant_id, cu.id, a.professional_id, sv.id,
       a.inicio, a.inicio + make_interval(mins => sv.duration_minutes),
       CASE
         -- Já terminou: quase tudo concluído; nos últimos 3 dias, alguns ficaram sem baixa (atrasados)
         WHEN a.inicio + make_interval(mins => sv.duration_minutes) <= c.agora THEN
           CASE WHEN a.r < 0.08 THEN 'CANCELED'
                WHEN a.r < 0.16 AND a.inicio >= c.agora - interval '3 days' THEN 'CONFIRMED'
                WHEN a.r < 0.20 AND a.inicio >= c.agora - interval '3 days' THEN 'PENDING'
                ELSE 'COMPLETED' END
         -- Em andamento
         WHEN a.inicio <= c.agora THEN 'CONFIRMED'
         -- Futuro: confirma-se mais perto do dia
         ELSE
           CASE WHEN a.r < 0.06 THEN 'CANCELED'
                WHEN a.inicio < c.agora + interval '2 days' AND a.r < 0.70 THEN 'CONFIRMED'
                WHEN a.r < 0.40 THEN 'CONFIRMED'
                ELSE 'PENDING' END
       END,
       sv.price,
       a.inicio - make_interval(days => 1 + floor(a.r * 20)::int)
  FROM seed_appt a
  JOIN ctx c ON true
  JOIN seed_cust sc ON sc.n = a.customer_n
  JOIN customers cu ON cu.tenant_id = c.tenant_id AND cu.name = sc.name
  JOIN services sv ON sv.tenant_id = c.tenant_id AND sv.name = a.service_name;

COMMIT;

SELECT (SELECT count(*) FROM professionals WHERE tenant_id = (SELECT tenant_id FROM ctx)) AS profissionais,
       (SELECT count(*) FROM services      WHERE tenant_id = (SELECT tenant_id FROM ctx)) AS servicos,
       (SELECT count(*) FROM customers     WHERE tenant_id = (SELECT tenant_id FROM ctx)) AS clientes,
       (SELECT count(*) FROM appointments  WHERE tenant_id = (SELECT tenant_id FROM ctx)) AS agendamentos;
