-- ============================================================================
-- MOTOATLAS REVIEW ASPECTS SEED
-- ============================================================================
-- DEV ONLY | No ejecutar en producción sin revisar
--
-- PROPÓSITO:
--   Generar datos mock realistas para maquetación y validación visual de:
--   - Reviews de motos
--   - Aspectos técnicos estructurados (motorcycle_review_aspects)
--   - Agregaciones por moto, rankings, ficha y comunidad
--
-- CONTENIDO:
--   ~5-8 motos × 3-6 reviews approved + 1 pending en algunas
--   ~5-10 aspectos por review approved
--   ~40-50 reviews total
--   ~300-400 aspectos total
--
-- CÓMO EJECUTAR:
--   psql $DATABASE_URL -f supabase/seeds/review_aspects_seed.sql
--   O desde Supabase Dashboard > SQL Editor
--
-- NOTAS:
--   - Datos ficticios generados para desarrollo/visualización
--   - NO usar como datos reales en producción
--   - User IDs son null (reviews anónimas seed) con user_name mock
--   - Todos los motorcycle_id referencian bikes existentes en public.motorcycles
-- ============================================================================

-- ============================================================================
-- PREFLIGHT: Verificar que todos los motorcycle_id existen
-- ============================================================================
DO $$
DECLARE
  v_missing_id text;
BEGIN
  SELECT m.missing_id INTO v_missing_id
  FROM (
    VALUES
      ('yamaha-tenere-700-2024'::text),
      ('yamaha-mt-07-2024'),
      ('kawasaki-z900-2024'),
      ('aprilia-tuareg-660-2024'),
      ('honda-cb750-hornet-2024'),
      ('ducati-monster-2024'),
      ('yamaha-tracer-9-gt-2024'),
      ('bmw-f-900-gs-2024')
  ) AS m(missing_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.motorcycles WHERE id = m.missing_id
  )
  LIMIT 1;

  IF v_missing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Seed abortado: el motorcycle_id "%" no existe en public.motorcycles', v_missing_id;
  END IF;
END $$;

-- ============================================================================
-- SECCIÓN 1: Reviews seed con UUIDs fijos para idempotencia
-- ============================================================================
-- Formato: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa (8-4-4-4-12 hex)
-- Mismos UUIDs en aspectos para evitar duplicados con ON CONFLICT

-- --------------------------------------------------------------------------
-- MOTO 1: yamaha-tenere-700-2024 (Trail, A2)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_reviews (id, motorcycle_id, user_id, user_name, rating, riding_style, ownership_months, kilometers, comment, pros, cons, source, verified, status, created_at, updated_at)
VALUES
  ('a1000001-0001-0001-0001-000000000001', 'yamaha-tenere-700-2024', NULL, 'Carlos Ruiz', 5, 'viaje', 18, 15000, 'La mejor trail media que he tenido. El motor CP2 es una maravilla, elástico y economical. Viajo con ella cargada sin problemas y las pistas las come sin dwesde. La recomiendo a cualquiera que quiera una moto seria para aventuras.', ARRAY['Motor elástico','Fiabilidad probada','Mercado de accesorios'], ARRAY['Suspensión básica de serie','Asiento duro en largos'], 'seed', true, 'approved', '2024-03-15 10:00:00+00', '2024-03-15 10:00:00+00'),
  ('a1000001-0001-0001-0001-000000000002', 'yamaha-tenere-700-2024', NULL, 'Marta Soler', 4, 'offroad', 24, 22000, 'Muy buena para offroad moderado. He hecho rutas por Pirineos y nada se le resiste. El único pero es el peso enTrial para Trial Técnico, pero fuera de eso es una gozada. La electrónica es justita pero se puede circular sin ella.', ARRAY['Capacidad offroad','Peso contenido','Simpleza mecánica'], ARRAY['Sin electrónica avanzada','Protección limitada'], 'seed', true, 'approved', '2024-04-20 14:30:00+00', '2024-04-20 14:30:00+00'),
  ('a1000001-0001-0001-0001-000000000003', 'yamaha-tenere-700-2024', NULL, 'Dani Ortega', 4, 'diario', 12, 8500, 'Mi moto para todo. Ciudad, carretera y algo de pista los fines de semana. EI CP2 es perfecto para uso diario, consumo contenido y mantenimiento económico. Le falta un poco de protección para autopista.', ARRAY['Consumo moderado','Motor divertido','Mantenimiento barato'], ARRAY['Protección aerodinámica nula','Suspensiones justas'], 'seed', true, 'approved', '2024-06-10 09:15:00+00', '2024-06-10 09:15:00+00'),
  ('a1000001-0001-0001-0001-000000000004', 'yamaha-tenere-700-2024', NULL, 'Laura Martín', 3, 'ciudad', 6, 3200, 'Bonita y funcional pero se hace alta para ciudad. El tráfico me intimida un poco con el altura. Eso sí, cuando sales a carretera es una maravilla. Para uso puramente urbano buscaría algo más bajo.', ARRAY['Diseño atractivo','Motor suave'], ARRAY['Altura en ciudad','Maniobrabilidad comprometida'], 'seed', true, 'approved', '2024-08-05 16:45:00+00', '2024-08-05 16:45:00+00'),
  ('a1000001-0001-0001-0001-000000000005', 'yamaha-tenere-700-2024', NULL, 'Javier Cano', 5, 'viaje', 30, 35000, 'Moto perfecta para mi forma de viajar. Llevo 30 meses y 35.000 km sin ningún problema serio. El motor no defrauda nunca y el consumo es excepcional. Las suspensiones se quedan justas cargada pero se pueden mejorar.', ARRAY['Fiabilidad excepcional','Autonomía','Motor CP2'], ARRAY['Suspensiones de serie insufficient','Asiento firme'], 'seed', true, 'approved', '2024-09-12 11:20:00+00', '2024-09-12 11:20:00+00'),
  ('a1000001-0001-0001-0001-000000000006', 'yamaha-tenere-700-2024', NULL, 'Pedro Vila', 4, 'offroad', 8, 5500, 'Me compré esta T7 para aprender offroad y ha sido una gran elección. La altura es seria pero una vez que te acostumbras hay muy pocas límites. El ABS desconectable es un acierto. Solo echo de menos más potencia en Trial Técnico.', ARRAY['ABS desconectable','Altura seria para offroad','Motor noble'], ARRAY['Potencia justa para offroad avanzado','Peso enTrial'], 'seed', true, 'approved', '2024-11-03 08:00:00+00', '2024-11-03 08:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------------
-- MOTO 2: yamaha-mt-07-2024 (Naked, A2)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_reviews (id, motorcycle_id, user_id, user_name, rating, riding_style, ownership_months, kilometers, comment, pros, cons, source, verified, status, created_at, updated_at)
VALUES
  ('a2000001-0001-0001-0001-000000000001', 'yamaha-mt-07-2024', NULL, 'Carlos Ruiz', 5, 'deportivo', 14, 9500, 'El CP2 es una joya de motor. Entretiene muchísimo en carreteras de curvas y el consumo es ridículo. Para uso diario es perfecta, ligera y ágil. Las suspensiones son el punto débil pero se aceptan en este rango de precio.', ARRAY['Motor divertido','Peso ligero','Consumo bajo'], ARRAY['Suspensiones básicas','Frenos justos en conducción fuerte'], 'seed', true, 'approved', '2024-02-10 12:00:00+00', '2024-02-10 12:00:00+00'),
  ('a2000001-0001-0001-0001-000000000002', 'yamaha-mt-07-2024', NULL, 'Javier Cano', 4, 'ciudad', 20, 18000, 'Mi segunda MT-07 y sigo igual de contento. La uso para ir al trabajo y algún finde de curvas. La posición es cómoda para ciudad y el motor va de maravilla. La pantalla es inexistente para autovía pero no la compré por eso.', ARRAY['Agilidad urbana','Motor económico','Fiabilidad'], ARRAY['Pantalla inexistente','Suspensiones blandas'], 'seed', true, 'approved', '2024-03-22 09:30:00+00', '2024-03-22 09:30:00+00'),
  ('a2000001-0001-0001-0001-000000000003', 'yamaha-mt-07-2024', NULL, 'Marta Soler', 4, 'deportivo', 10, 7500, 'Entretienen dmasiado. Las ruedas de lasilas y el motor empuja fuerte desde abajo. No es una sport pero para ir rápido entre curvas no tiene nada que envidiar. La falta de protección se hecha en falta en viajes.', ARRAY['Motor brillante','Chasis agile','Entretenida'], ARRAY['Sin protección','Confort limitado'], 'seed', true, 'approved', '2024-05-14 15:20:00+00', '2024-05-14 15:20:00+00'),
  ('a2000001-0001-0001-0001-000000000004', 'yamaha-mt-07-2024', NULL, 'Dani Ortega', 5, 'diario', 36, 42000, 'Llevo tres años con ella de daily y no me ha dado un solo problema. El seguro es económico, el seguro bajo y el consumo ridículo. Para lo que pago de mantenimiento no hay nada mejor. Las suspensiones se quedan cortas pero no se puede pedir más por este precio.', ARRAY['Coste total de propiedad','Fiabilidad','Motorversátil'], ARRAY['Suspensiones básicas','Acabados sencillos'], 'seed', true, 'approved', '2024-07-01 10:45:00+00', '2024-07-01 10:45:00+00'),
  ('a2000001-0001-0001-0001-000000000005', 'yamaha-mt-07-2024', NULL, 'Laura Martín', 3, 'pasajero', 4, 2500, 'Compré la MT-07 como segunda moto para principiantes y la realidad es que para ir de pasajero es bastante incomoda. El asiento es duro y no hay nada a lo que agarrarse. Como moto principal para conducir es genial pero como moto para ir de pasajero mejor buscar otra cosa.', ARRAY['Ligeray ágil','Motor suave'], ARRAY['Incómoda de pasajero','Suspensiones duras'], 'seed', true, 'approved', '2024-10-20 14:00:00+00', '2024-10-20 14:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------------
-- MOTO 3: kawasaki-z900-2024 (Naked, A)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_reviews (id, motorcycle_id, user_id, user_name, rating, riding_style, ownership_months, kilometers, comment, pros, cons, source, verified, status, created_at, updated_at)
VALUES
  ('a3000001-0001-0001-0001-000000000001', 'kawasaki-z900-2024', NULL, 'Pedro Vila', 5, 'deportivo', 16, 12000, 'El tetracilíndrico de Kawasaki es una passada. Entra con una fuerza brutal en cualquier régimen y el sonido es glorioso. La electrónica es completísima y te permite modular la potencia a tu gusto. Para diversión pura en carretera no conozco nada mejor por este precio.', ARRAY['Motor tetracilíndrico explosivo','Electrónica avanzada','Par siempre disponible'], ARRAY['Consumo elevado si se exige','Autonomía justa'], 'seed', true, 'approved', '2024-01-20 11:00:00+00', '2024-01-20 11:00:00+00'),
  ('a3000001-0001-0001-0001-000000000002', 'kawasaki-z900-2024', NULL, 'Carlos Ruiz', 4, 'deportivo', 8, 5500, 'Moto muy intensa. El motor empuja con una fuerza impresionantes y el chassis es muy ágil. La posición de conducción es algo agresiva para uso diario pero si buscas emociones fuertes es perfecta. Los modos de conducción son un acierto.', ARRAY['Motor impresionante','Parte ciclo afinada','Modos de conducción'], ARRAY['Posición agresiva','Consumo elevado'], 'seed', true, 'approved', '2024-04-05 13:15:00+00', '2024-04-05 13:15:00+00'),
  ('a3000001-0001-0001-0001-000000000003', 'kawasaki-z900-2024', NULL, 'Dani Ortega', 5, 'viaje', 12, 9800, 'Sorprendentemente cómoda para ser una naked. La uso para viajes de finde con equipamiento ligero y no he echado en falta una turismo. Eso sí, la protección es casi nula y en autopista se nota mucho el viento. Pero para ir por secundario es una delicia.', ARRAY['Motor versátil','Agilidad','Electrónica configurable'], ARRAY['Protección nula','Consumo alto'], 'seed', true, 'approved', '2024-06-18 16:30:00+00', '2024-06-18 16:30:00+00'),
  ('a3000001-0001-0001-0001-000000000004', 'kawasaki-z900-2024', NULL, 'Javier Cano', 4, 'deportivo', 22, 16000, 'MI Z900 de hace un año y medio. El motor sigue sorprendiéndome, siempre hay más. La electrónica es muy completa y los modos de conducción permiten adaptar el carácter. Le pongo un 4 porque el asiento es bastante firme para uso diario.', ARRAY['Motor increíble','Electrónica','Modos de conducción'], ARRAY['Asiento duro','Consumo'], 'seed', true, 'approved', '2024-08-25 10:00:00+00', '2024-08-25 10:00:00+00'),
  ('a3000001-0001-0001-0001-000000000005', 'kawasaki-z900-2024', NULL, 'Marta Soler', 4, 'deportivo', 6, 4200, 'Mi primera moto después del carné A. El cuatro cilindros es una bestia controlada pero aprendes rápido porque tiene mucha electrónica que te ayuda. Los modos de potencia te permiten hacerla más dócil. Echo de menos algo más de protección para viajes.', ARRAY['Electrónica para aprendices','Motor escalofriante','Agilidad'], ARRAY['Protección inexistente','Consumo elevado'], 'seed', true, 'approved', '2024-11-10 09:45:00+00', '2024-11-10 09:45:00+00')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------------
-- MOTO 4: aprilia-tuareg-660-2024 (Trail, A2)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_reviews (id, motorcycle_id, user_id, user_name, rating, riding_style, ownership_months, kilometers, comment, pros, cons, source, verified, status, created_at, updated_at)
VALUES
  ('a4000001-0001-0001-0001-000000000001', 'aprilia-tuareg-660-2024', NULL, 'Laura Martín', 5, 'offroad', 20, 18500, 'La mejor moto de trial que he tenido. Las suspensiones WP son increíbles, se traga todo sin抗拒. El motor es muy lineal y controlable en zona trial. Perfecta para quien quiere una trail ligera de verdad sin sacrificar electrónica.', ARRAY['Suspensiones WP excepcionales','Ligereza','Electrónica completa'], ARRAY['Red de talleres reducida','Asiento firme'], 'seed', true, 'approved', '2024-02-28 14:20:00+00', '2024-02-28 14:20:00+00'),
  ('a4000001-0001-0001-0001-000000000002', 'aprilia-tuareg-660-2024', NULL, 'Pedro Vila', 4, 'viaje', 15, 11000, 'Muy buena para viaje mixto. La electrónica de Aprilia es intuitiva y efectiva. El motor tiene carácter rally, gusta en zonas lentas y empuja fuerte arriba. El consumo es contenido para la cilindrada. Problema: el puesto de Marcha es complicado con botas de trial.', ARRAY['Motor con carácter','Suspensiones capaces','Electrónica Aprilia'], ARRAY['Pedal de cambio poco práctica','Red de servicio'], 'seed', true, 'approved', '2024-05-10 11:30:00+00', '2024-05-10 11:30:00+00'),
  ('a4000001-0001-0001-0001-000000000003', 'aprilia-tuareg-660-2024', NULL, 'Dani Ortega', 5, 'offroad', 28, 24000, 'Llevo dos años haciendo-trial con la Tuareg y no disappoint. Las suspensiones están en otro nivel respecto a las japonesas de precio similar. El motor es suave y controlable. La única pega es el calor que emite en trial lento pero nada dramático.', ARRAY['Suspensiones de alto nivel','Peso contenido','Motor noble'], ARRAY['Calor en trial lento','Red de servicio'], 'seed', true, 'approved', '2024-07-15 08:45:00+00', '2024-07-15 08:45:00+00'),
  ('a4000001-0001-0001-0001-000000000004', 'aprilia-tuareg-660-2024', NULL, 'Carlos Ruiz', 4, 'viaje', 10, 7800, 'Moto muy completa para viaje y trial ocasional. La posición de conducción es cómoda para largas jornadas y la pantalla ofrece buena protección. El ABS Boscht es muy modulable. Lo peor es que los repuestos tardan y cuestan más que las japonesas.', ARRAY['Confort de viaje','ABS modulable','Pantalla eficaz'], ARRAY['Coste de repuestos','Red de talleres'], 'seed', true, 'approved', '2024-09-22 13:00:00+00', '2024-09-22 13:00:00+00'),
  ('a4000001-0001-0001-0001-000000000005', 'aprilia-tuareg-660-2024', NULL, 'Javier Cano', 4, 'offroad', 7, 4800, 'Me encanta esta moto para Trial Deportivo. Las suspensiones se absorben perfectamente los obstáculos y el motor permite precisa control de tracción. El display es algo justo en información pero se agradece la sencillez. Muy contento con la compra.', ARRAY['Calidad de suspensiones','Control de tracción','Peso equilibrado'], ARRAY['Display básico','Precio de mantenimiento'], 'seed', true, 'approved', '2024-11-05 15:15:00+00', '2024-11-05 15:15:00+00')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------------
-- MOTO 5: honda-cb750-hornet-2024 (Naked, A2)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_reviews (id, motorcycle_id, user_id, user_name, rating, riding_style, ownership_months, kilometers, comment, pros, cons, source, verified, status, created_at, updated_at)
VALUES
  ('a5000001-0001-0001-0001-000000000001', 'honda-cb750-hornet-2024', NULL, 'Marta Soler', 4, 'deportivo', 9, 6200, 'Primera Honda y estoy muy contento. El motor es un twinried suave y con suficiente potencia para divertirse. La ergonomía es buena para ciudad y algún viaje ocasional también funciona. La relación calidad-precio es excelente para lo que ofrece.', ARRAY['Motor suave y lleno','Precio competitivo','Altura accesible'], ARRAY['Suspensiones sencillas','Sin quickshifter'], 'seed', true, 'approved', '2024-04-12 10:30:00+00', '2024-04-12 10:30:00+00'),
  ('a5000001-0001-0001-0001-000000000002', 'honda-cb750-hornet-2024', NULL, 'Carlos Ruiz', 5, 'diario', 11, 8800, 'MI Honda CB750 Hornet como daily. El motor es increíblemente suave y económico. Los modos de conducción permiten adaptar la respuesta. La posición es cómoda para ir al trabajo y el finde te permite unas curvas sin problemas. Gran compra.', ARRAY['Motorversátil','Consumo contenido','Modos de conducción'], ARRAY['Suspensiones básicas','Frenos justos'], 'seed', true, 'approved', '2024-06-25 14:00:00+00', '2024-06-25 14:00:00+00'),
  ('a5000001-0001-0001-0001-000000000003', 'honda-cb750-hornet-2024', NULL, 'Laura Martín', 4, 'ciudad', 5, 3200, 'Perfecta para ciudad. La altura es accesible y el peso contenido hace que sea fácil de maniobrar. El motor va muy bien en tráfico y el consumo es bueno. Para autovía le falta un poco de empuje pero no es su objetivo.', ARRAY['Maniobrabilidad urbana','Motor suave','Consumo bajo'], ARRAY['En autovía se queda justa','Suspensiones urbano'], 'seed', true, 'approved', '2024-08-18 09:00:00+00', '2024-08-18 09:00:00+00'),
  ('a5000001-0001-0001-0001-000000000004', 'honda-cb750-hornet-2024', NULL, 'Dani Ortega', 4, 'deportivo', 14, 10500, 'Muy divertida en zonas de curvas. El motor empuja con alegría y el chasis es ágil. Los modos Sport y Urban permiten cambiar el carácter. Le resto un punto por los acabados algo plásticos y porque el escape no suena tan bien como esperaba.', ARRAY['Motor divertido','Agilidad','Modos de conducción'], ARRAY['Acabados mejorables','Sonido del escape'], 'seed', true, 'approved', '2024-10-02 16:20:00+00', '2024-10-02 16:20:00+00')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------------
-- MOTO 6: ducati-monster-2024 (Naked, A)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_reviews (id, motorcycle_id, user_id, user_name, rating, riding_style, ownership_months, kilometers, comment, pros, cons, source, verified, status, created_at, updated_at)
VALUES
  ('a6000001-0001-0001-0001-000000000001', 'ducati-monster-2024', NULL, 'Pedro Vila', 5, 'deportivo', 18, 13000, 'Una Ducati para todos los días. Quién me lo iba a decir. El Testastretta es refinaddisimo, mucho más que lo que esperaba de una Ducati. El peso es increíblemente bajo para este tipo de moto. La electrónica de Bosch es top. Solo el calor en ciudad es un problema real.', ARRAY['Peso contenido','Motor refinado','Electrónica Bosch'], ARRAY['Calor en ciudad','Precio de mantenimiento'], 'seed', true, 'approved', '2024-01-30 11:45:00+00', '2024-01-30 11:45:00+00'),
  ('a6000001-0001-0001-0001-000000000002', 'ducati-monster-2024', NULL, 'Javier Cano', 4, 'viaje', 12, 8500, 'No me imaginaba haciendo viajes con una Monster pero esta generación es sorprendentemente cómoda. El asiento es mejor que las anteriores y la posición menos deportiva. El motor tiene mucho par y los modos te permiten suavizarla para autovía. El consumo es más alto de lo que esperaba.', ARRAY['Motor con par','Confort mejorado','Electrónica avanzada'], ARRAY['Consumo elevado','Calor en ciudad'], 'seed', true, 'approved', '2024-03-18 14:30:00+00', '2024-03-18 14:30:00+00'),
  ('a6000001-0001-0001-0001-000000000003', 'ducati-monster-2024', NULL, 'Marta Soler', 4, 'deportivo', 8, 4800, 'Me compré la Monster para uso deportivo y la electrónica es una gozada. El motor entrega la potencia de forma lineal y controlable. Los Dampacs son un plus para ajustar la suspensión. Lo que menos me gusta es que en tráfico el calor del bicilíndrico es molesto.', ARRAY['Electrónica excelente','Motor lineal y controlable','Öhlins'], ARRAY['Calor del bicilíndrico','Consumo alto'], 'seed', true, 'approved', '2024-06-08 09:15:00+00', '2024-06-08 09:15:00+00'),
  ('a6000001-0001-0001-0001-000000000004', 'ducati-monster-2024', NULL, 'Carlos Ruiz', 5, 'deportivo', 24, 19500, 'MI Monster de dos años. El mejor motor que he tenido. El Testastretta tiene un sonido y una respuesta que me hacen disfrutar cada salida. La parte ciclo es precisa y los Freni Brembo son increíbles. Mantenimiento sí es caro pero aceptable si la cuidas.', ARRAY['Motor excepcional','Frenos Brembo','Sonido del bicilíndrico'], ARRAY['Coste de mantenimiento','Calor'], 'seed', true, 'approved', '2024-08-12 10:00:00+00', '2024-08-12 10:00:00+00'),
  ('a6000001-0001-0001-0001-000000000005', 'ducati-monster-2024', NULL, 'Laura Martín', 4, 'diario', 6, 3600, 'Uso la Monster para ir a trabajar y algún finde de curves. Sorprendentemente práctica para ser una Ducati. El embrague es suave y la posición menos extrema que las generaciones anteriores. Lo peor es el consumo en retención ya que el motor frena menos que un típico twin.', ARRAY['Práctica inesperada','Motor refinado','Sonido'], ARRAY['Consumo algo alto','Freno motor bajo'], 'seed', true, 'approved', '2024-10-25 15:45:00+00', '2024-10-25 15:45:00+00'),
  ('a6000001-0001-0001-0001-000000000006', 'ducati-monster-2024', NULL, 'Dani Ortega', 3, 'pasajero', 3, 1800, 'Dejo mi valoración desde la perspectiva de pasajero. La Monster no es cómoda para ir de pasajero. El asiento es duro y estrecho, y no hay asideras reales. Como conductor es genial pero para ir de pasajero mejor buscar otra cosa.', ARRAY['Diseño atractivo','Motor suave'], ARRAY['Pasajero incómodo','Asideras inadecuadas'], 'seed', true, 'approved', '2024-11-20 12:00:00+00', '2024-11-20 12:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------------
-- MOTO 7: yamaha-tracer-9-gt-2024 (Sport-Touring, A)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_reviews (id, motorcycle_id, user_id, user_name, rating, riding_style, ownership_months, kilometers, comment, pros, cons, source, verified, status, created_at, updated_at)
VALUES
  ('a7000001-0001-0001-0001-000000000001', 'yamaha-tracer-9-gt-2024', NULL, 'Carlos Ruiz', 5, 'viaje', 30, 38000, 'La mejor sport-touring por su precio. El CP3 es un motor versátil que entrega potencia de forma lineal y con mucho par. Las maletas son prácticas y el cruise control es un acierto para autovía. La pantalla es ajustable y protege muy bien. Un acierto total.', ARRAY['Motor CP3 versátil','Maletas de serie','Cruise control'], ARRAY['Peso notable','Suspensiones algo blandas'], 'seed', true, 'approved', '2024-02-05 09:00:00+00', '2024-02-05 09:00:00+00'),
  ('a7000001-0001-0001-0001-000000000002', 'yamaha-tracer-9-gt-2024', NULL, 'Javier Cano', 5, 'viaje', 22, 28000, 'Llevo dos años con la Tracer 9 GT y ha sido mi mejor compra. He hecho viajes de 2000 km sin parar y siempre llegaba fresco. El motor nunca defrauda y el consumo es razonable para la cilindrada. La electrónica Kyb es muy buena pero echo en falta más opciones de personalización.', ARRAY['Comodidad en viaje','Autonomía','Motor CP3'], ARRAY['Opciones de customización limitadas','Peso cargada'], 'seed', true, 'approved', '2024-04-28 14:15:00+00', '2024-04-28 14:15:00+00'),
  ('a7000001-0001-0001-0001-000000000003', 'yamaha-tracer-9-gt-2024', NULL, 'Marta Soler', 4, 'deportivo', 12, 12000, 'Uso la Tracer para viaje deportivo y alguna trackday. Sorprendentemente capaz en zona de curves gracias al motor y el chassis. Las suspensiones electrónicas Kyb se adaptan muy bien a cada situación. El único pero es que los neumáticos de serie se degradan rápido si la exiges en circuito.', ARRAY['Motor CP3','Suspensiones Kyb','Agilidad inesperada'], ARRAY['Neumáticos de serie','Precio'], 'seed', true, 'approved', '2024-07-10 11:30:00+00', '2024-07-10 11:30:00+00'),
  ('a7000001-0001-0001-0001-000000000004', 'yamaha-tracer-9-gt-2024', NULL, 'Pedro Vila', 5, 'viaje', 8, 6500, 'Perfecta para mis viajes largos. El confort es excepcional y la posición de conducción es muy natural para horas de saddle. EI cruise control permite descansar el brazo en autopista y el motor tiene reserva de potencia para adelantamientos seguros. Muy recomendable.', ARRAY['Confort excepcional','Cruise control','Maletas prácticas'], ARRAY['Peso','Suspensiones algo blandas'], 'seed', true, 'approved', '2024-09-05 08:45:00+00', '2024-09-05 08:45:00+00')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------------
-- MOTO 8: bmw-f-900-gs-2024 (Trail, A)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_reviews (id, motorcycle_id, user_id, user_name, rating, riding_style, ownership_months, kilometers, comment, pros, cons, source, verified, status, created_at, updated_at)
VALUES
  ('a8000001-0001-0001-0001-000000000001', 'bmw-f-900-gs-2024', NULL, 'Dani Ortega', 5, 'viaje', 20, 22000, 'La BMW F 900 GS es una trail seria. El motor tiene mucho par desde abajo y la electrónica es completísima. Los modos de conducción permiten adaptar la respuesta del motor. El display TFT es intuitivo y la conectividad con mi teléfono funciona perfectamente. El precio sube con paquetes pero la calidad se nota.', ARRAY['Motor con par','Electrónica completa','Calidad BMW'], ARRAY['Precio con paquetes','Complejidad electrónica'], 'seed', true, 'approved', '2024-03-01 10:30:00+00', '2024-03-01 10:30:00+00'),
  ('a8000001-0001-0001-0001-000000000002', 'bmw-f-900-gs-2024', NULL, 'Laura Martín', 4, 'offroad', 16, 14000, 'Muy capaz en offroad avanzado. Las suspensiones son de alto nivel y el ABS pro es genial para trial. El motor tiene fuerza pero a veces echas de menos algo más de finura en bajas revoluciones. El posto de saddle es algo estrecho para días largos pero se puede vivir.', ARRAY['Capacidad offroad','ABS Pro','Pantalla TFT'], ARRAY['Saddle estrecha','Precio'], 'seed', true, 'approved', '2024-05-22 13:45:00+00', '2024-05-22 13:45:00+00'),
  ('a8000001-0001-0001-0001-000000000003', 'bmw-f-900-gs-2024', NULL, 'Carlos Ruiz', 4, 'viaje', 10, 8500, 'Trail media-alta polivalente. Muy buena para viaje rápido y capaz en pistas difíciles. La posición de conducción es más trail que turística, lo cual se agradece para Trial Deportivo. EI consumo es correcto y la autonomía es buena con el depósito de 14.5 litros.', ARRAY['Polivalente','Motor elástico','Electrónica'], ARRAY['Depósito pequeño','Precio'], 'seed', true, 'approved', '2024-08-15 09:00:00+00', '2024-08-15 09:00:00+00'),
  ('a8000001-0001-0001-0001-000000000004', 'bmw-f-900-gs-2024', NULL, 'Javier Cano', 5, 'viaje', 26, 32000, 'MI F 900 GS de dos años. Ha sido mi compañera en dos viajes largos por Europa y nunca me ha disappoint. El motor es increíblemente flexible y los consumos son contenidos. El servicio técnico de BMW es excelente aunque losrepuestos son caros. Muy satisfecho.', ARRAY['Fiabilidad','Flexibilidad del motor','Servicio BMW'], ARRAY['Coste de repuestos','Depósito limitado'], 'seed', true, 'approved', '2024-10-08 14:20:00+00', '2024-10-08 14:20:00+00'),
  ('a8000001-0001-0001-0001-000000000005', 'bmw-f-900-gs-2024', NULL, 'Pedro Vila', 4, 'offroad', 14, 11500, 'Trail muy preparada para el offroad técnico. Las suspensiones muestran su calidad en zonas trialeras exigentes. El control de tracción DTC es muy útil en superficies deslizantes. La altura de saddle es importante pero una vez adaptada es muy fácil de manejar en Trial.', ARRAY['Suspensiones de calidad','DTC efficace','Motor flexible'], ARRAY['Altura intimidante','Peso en Trial técnico'], 'seed', true, 'approved', '2024-11-15 11:00:00+00', '2024-11-15 11:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------------------------
-- REVIEWS PENDING (no visibles públicamente)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_reviews (id, motorcycle_id, user_id, user_name, rating, riding_style, ownership_months, kilometers, comment, pros, cons, source, verified, status, created_at, updated_at)
VALUES
  ('f0000001-0001-0001-0001-000000000001', 'yamaha-tenere-700-2024', NULL, 'Nuevo Usuario', 3, 'ciudad', 2, 800, 'Acabo de comprarla y de momento estoy acostumbrándome. El motor me parece algo brusco bajo 3000 rpm pero supongo que es normal. Todavía no he podido hacer una valoración completa.', ARRAY['Diseño','Motor'], ARRAY['Brusquedad bajo rpm','Altura'], 'seed', false, 'pending', '2024-12-01 10:00:00+00', '2024-12-01 10:00:00+00'),
  ('f0000001-0001-0001-0001-000000000002', 'kawasaki-z900-2024', NULL, 'Prueba Review', 4, 'deportivo', 3, 1500, 'Primera review pendiente para probar el flujo. De momento muy contento con la Z900, el motor es una bestia controlada. Cuando lleve más km haré una review más completa.', ARRAY['Motor','Agilidad'], ARRAY['Consumo'], 'seed', false, 'pending', '2024-12-02 14:30:00+00', '2024-12-02 14:30:00+00'),
  ('f0000001-0001-0001-0001-000000000003', 'ducati-monster-2024', NULL, 'Test Usuario', 5, 'viaje', 6, 3200, 'Review de prueba para verificar la importación. La Monster me ha sorprendido gratamente, es mucho más práctica de lo que pensaba para uso diario.', ARRAY['Motor','Diseño'], ARRAY['Calor'], 'seed', false, 'pending', '2024-12-03 09:15:00+00', '2024-12-03 09:15:00+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECCIÓN 2: Aspectos técnicos (motorcycle_review_aspects)
-- ============================================================================
-- Formato: review_id фиксированный (совпадает с выше)
-- Максимум одна строка на (review_id, category)
-- ON CONFLICT DO UPDATE для permitividad в развитии

-- --------------------------------------------------------------------------
-- ASPECTOS: yamaha-tenere-700-2024 (Trail)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_review_aspects (review_id, category, sentiment, comment)
VALUES
  ('a1000001-0001-0001-0001-000000000001', 'engine', 'positive', 'El CP2 es elástico y lleno en toda la curva de potencia'),
  ('a1000001-0001-0001-0001-000000000001', 'ergonomics', 'positive', 'Posición trail seria pero cómoda para horas'),
  ('a1000001-0001-0001-0001-000000000001', 'consumption', 'positive', 'Consumo muy contenido, unos 4.5L/100km en viaje'),
  ('a1000001-0001-0001-0001-000000000001', 'suspension', 'negative', 'De serie se quedan justas para uso trialero serio'),
  ('a1000001-0001-0001-0001-000000000001', 'maintenance', 'positive', 'Mantenimiento económico y red de talleres amplia'),
  ('a1000001-0001-0001-0001-000000000001', 'price', 'positive', 'Excelente relación prestaciones/precio'),
  ('a1000001-0001-0001-0001-000000000001', 'weight', 'positive', 'Peso contenido para una trail de este nivel'),
  ('a1000001-0001-0001-0001-000000000001', 'electronics', 'negative', 'Falta electrónica moderna como control de tracción ajustable'),
  ('a1000001-0001-0001-0001-000000000001', 'braking', 'positive', 'Frenos potentes y modulables para el uso intended'),
  ('a1000001-0001-0001-0001-000000000002', 'suspension', 'positive', 'Suspensiones muy capaces en offroad'),
  ('a1000001-0001-0001-0001-000000000002', 'engine', 'positive', 'Motor noble y controlable en zonas técnicas'),
  ('a1000001-0001-0001-0001-000000000002', 'weight', 'positive', 'Sorprendentemente ligera para trail seria'),
  ('a1000001-0001-0001-0001-000000000002', 'electronics', 'negative', 'Electrónica algo limitada para Trial'),
  ('a1000001-0001-0001-0001-000000000002', 'aerodynamics', 'negative', 'Protección aerodinámica casi nula'),
  ('a1000001-0001-0001-0001-000000000002', 'maintenance', 'positive', 'Fiabilidad probada del CP2'),
  ('a1000001-0001-0001-0001-000000000003', 'engine', 'positive', 'Motor divertido y económico para uso diario'),
  ('a1000001-0001-0001-0001-000000000003', 'consumption', 'positive', 'Consumo muy bajo en uso mixto'),
  ('a1000001-0001-0001-0001-000000000003', 'ergonomics', 'positive', 'Altura accesible y posición natural'),
  ('a1000001-0001-0001-0001-000000000003', 'suspension', 'negative', 'Suspensiones justas para conducción deportiva'),
  ('a1000001-0001-0001-0001-000000000003', 'braking', 'negative', 'Frenos algo justos en conducción fuerte'),
  ('a1000001-0001-0001-0001-000000000004', 'ergonomics', 'negative', 'Altura elevada para uso urbano'),
  ('a1000001-0001-0001-0001-000000000004', 'engine', 'positive', 'Motor suave y agreeable en ciudad'),
  ('a1000001-0001-0001-0001-000000000004', 'weight', 'negative', 'Peso notable en maniobras de tráfico'),
  ('a1000001-0001-0001-0001-000000000004', 'consumption', 'positive', 'Consumo urbano contenido'),
  ('a1000001-0001-0001-0001-000000000005', 'engine', 'positive', 'Motor inagotable tras 35.000 km'),
  ('a1000001-0001-0001-0001-000000000005', 'maintenance', 'positive', 'Sin problemas graves en tres años'),
  ('a1000001-0001-0001-0001-000000000005', 'consumption', 'positive', 'Autonomía excelente con el depósito de 16L'),
  ('a1000001-0001-0001-0001-000000000005', 'suspension', 'negative', 'Se echan en falta mejores suspensiones de serie'),
  ('a1000001-0001-0001-0001-000000000005', 'price', 'positive', 'Muy buena moto por el precio'),
  ('a1000001-0001-0001-0001-000000000005', 'design', 'positive', 'Diseño atemporal que no pasa de moda'),
  ('a1000001-0001-0001-0001-000000000006', 'suspension', 'positive', 'Capacidad de absorción excelente'),
  ('a1000001-0001-0001-0001-000000000006', 'weight', 'positive', 'Sorprendentemente ágil en zona trialera'),
  ('a1000001-0001-0001-0001-000000000006', 'engine', 'positive', 'Potencia suficiente para Trial Deportivo'),
  ('a1000001-0001-0001-0001-000000000006', 'electronics', 'negative', 'Falta modo Trial o control de tracción desconectable'),
  ('a1000001-0001-0001-0001-000000000006', 'aerodynamics', 'negative', 'Ninguna protección para autovía')
ON CONFLICT (review_id, category) DO UPDATE SET
  sentiment = EXCLUDED.sentiment,
  comment = EXCLUDED.comment;

-- --------------------------------------------------------------------------
-- ASPECTOS: yamaha-mt-07-2024 (Naked)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_review_aspects (review_id, category, sentiment, comment)
VALUES
  ('a2000001-0001-0001-0001-000000000001', 'engine', 'positive', 'CP2 divertidaísimo, empuje desde abajo'),
  ('a2000001-0001-0001-0001-000000000001', 'weight', 'positive', 'Peso muy contenido para su cilindrada'),
  ('a2000001-0001-0001-0001-000000000001', 'consumption', 'positive', 'Consumo ridículo, unos 4L/100km'),
  ('a2000001-0001-0001-0001-000000000001', 'design', 'positive', 'Diseño agresivo y atractivo'),
  ('a2000001-0001-0001-0001-000000000001', 'suspension', 'negative', 'Suspensiones algo blandas para conducción sport'),
  ('a2000001-0001-0001-0001-000000000001', 'braking', 'negative', 'Frenos justos en conducción fuerte'),
  ('a2000001-0001-0001-0001-000000000001', 'aerodynamics', 'negative', 'Pantalla inexistente, viento directo'),
  ('a2000001-0001-0001-0001-000000000002', 'engine', 'positive', 'Motor suave y económico para ciudad'),
  ('a2000001-0001-0001-0001-000000000002', 'ergonomics', 'positive', 'Posición cómoda para uso diario'),
  ('a2000001-0001-0001-0001-000000000002', 'consumption', 'positive', 'Consumo muy bajo en tráfico'),
  ('a2000001-0001-0001-0001-000000000002', 'maintenance', 'positive', 'Mantenimiento barato y sencillo'),
  ('a2000001-0001-0001-0001-000000000002', 'suspension', 'negative', 'Horquilla algo blanda'),
  ('a2000001-0001-0001-0001-000000000002', 'aerodynamics', 'negative', 'Ninguna protección en autopista'),
  ('a2000001-0001-0001-0001-000000000003', 'engine', 'positive', 'Motor brillante en curvas'),
  ('a2000001-0001-0001-0001-000000000003', 'braking', 'positive', 'Frenos suficientes para uso deportivo moderado'),
  ('a2000001-0001-0001-0001-000000000003', 'weight', 'positive', 'Ágil entre curvas'),
  ('a2000001-0001-0001-0001-000000000003', 'suspension', 'negative', 'Suspensiones justas para sport'),
  ('a2000001-0001-0001-0001-000000000003', 'passenger', 'negative', 'Plaza de pasajero incómoda'),
  ('a2000001-0001-0001-0001-000000000004', 'maintenance', 'positive', 'Fiabilidad exemplary'),
  ('a2000001-0001-0001-0001-000000000004', 'price', 'positive', 'Mejor relación calidad/precio del mercado'),
  ('a2000001-0001-0001-0001-000000000004', 'consumption', 'positive', 'Consumo muy económico en uso mixto'),
  ('a2000001-0001-0001-0001-000000000004', 'engine', 'positive', 'Motor versátil para todo'),
  ('a2000001-0001-0001-0001-000000000004', 'suspension', 'negative', 'Limitada para uso deportivo'),
  ('a2000001-0001-0001-0001-000000000005', 'passenger', 'negative', 'Asiento duro para el pasajero'),
  ('a2000001-0001-0001-0001-000000000005', 'ergonomics', 'negative', 'Posición incómoda para ir de pasajero'),
  ('a2000001-0001-0001-0001-000000000005', 'engine', 'positive', 'Motor suave y noble')
ON CONFLICT (review_id, category) DO UPDATE SET
  sentiment = EXCLUDED.sentiment,
  comment = EXCLUDED.comment;

-- --------------------------------------------------------------------------
-- ASPECTOS: kawasaki-z900-2024 (Naked)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_review_aspects (review_id, category, sentiment, comment)
VALUES
  ('a3000001-0001-0001-0001-000000000001', 'engine', 'positive', 'Tetracilíndrico explosivo, entra con fuerza brutal'),
  ('a3000001-0001-0001-0001-000000000001', 'electronics', 'positive', 'Electrónica completísima y bien implementada'),
  ('a3000001-0001-0001-0001-000000000001', 'braking', 'positive', 'Frenos muy efectivos con ABS'),
  ('a3000001-0001-0001-0001-000000000001', 'consumption', 'negative', 'Consumo elevado si se exige'),
  ('a3000001-0001-0001-0001-000000000001', 'aerodynamics', 'negative', 'Ninguna protección aerodinámica'),
  ('a3000001-0001-0001-0001-000000000001', 'passenger', 'negative', 'Pasajero mal atendido'),
  ('a3000001-0001-0001-0001-000000000002', 'engine', 'positive', 'Motor impresionante en toda la rango'),
  ('a3000001-0001-0001-0001-000000000002', 'suspension', 'positive', 'Parte ciclo muy afinada'),
  ('a3000001-0001-0001-0001-000000000002', 'electronics', 'positive', 'Modos de conducción muy efectivos'),
  ('a3000001-0001-0001-0001-000000000002', 'ergonomics', 'negative', 'Posición algo agresiva para diario'),
  ('a3000001-0001-0001-0001-000000000002', 'consumption', 'negative', 'Sube rápido si la exijas'),
  ('a3000001-0001-0001-0001-000000000003', 'engine', 'positive', 'Motor sorprendentemente versátil'),
  ('a3000001-0001-0001-0001-000000000003', 'weight', 'positive', 'Peso contenido para naked tetracilíndrica'),
  ('a3000001-0001-0001-0001-000000000003', 'aerodynamics', 'negative', 'Viento directo en autopista'),
  ('a3000001-0001-0001-0001-000000000003', 'consumption', 'negative', 'Autonomía justa en viaje'),
  ('a3000001-0001-0001-0001-000000000003', 'price', 'positive', 'Mucha moto por el precio'),
  ('a3000001-0001-0001-0001-000000000004', 'engine', 'positive', 'Motor siempre sorprendente'),
  ('a3000001-0001-0001-0001-000000000004', 'electronics', 'positive', 'Modos de conducción útiles'),
  ('a3000001-0001-0001-0001-000000000004', 'braking', 'positive', 'Frenos muy efectivos'),
  ('a3000001-0001-0001-0001-000000000004', 'suspension', 'positive', 'Suspensiones de calidad'),
  ('a3000001-0001-0001-0001-000000000004', 'price', 'positive', 'Relación prestaciones/precio excelente'),
  ('a3000001-0001-0001-0001-000000000004', 'passenger', 'negative', 'Confort limitado para pasajero'),
  ('a3000001-0001-0001-0001-000000000005', 'engine', 'positive', 'Motor increíble para aprender'),
  ('a3000001-0001-0001-0001-000000000005', 'electronics', 'positive', 'Electrónica te ayuda a aprender'),
  ('a3000001-0001-0001-0001-000000000005', 'weight', 'positive', 'Fácil de manejar para novatos'),
  ('a3000001-0001-0001-0001-000000000005', 'price', 'positive', 'Excelente para principiantes de A'),
  ('a3000001-0001-0001-0001-000000000005', 'aerodynamics', 'negative', 'Sin protección para viajes')
ON CONFLICT (review_id, category) DO UPDATE SET
  sentiment = EXCLUDED.sentiment,
  comment = EXCLUDED.comment;

-- --------------------------------------------------------------------------
-- ASPECTOS: aprilia-tuareg-660-2024 (Trail)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_review_aspects (review_id, category, sentiment, comment)
VALUES
  ('a4000001-0001-0001-0001-000000000001', 'suspension', 'positive', 'WP de alto nivel, traga todo'),
  ('a4000001-0001-0001-0001-000000000001', 'weight', 'positive', 'Ligera para trail seria'),
  ('a4000001-0001-0001-0001-000000000001', 'electronics', 'positive', 'Electrónica Aprilia muy efectiva'),
  ('a4000001-0001-0001-0001-000000000001', 'engine', 'positive', 'Motor lineal y controlable en trial'),
  ('a4000001-0001-0001-0001-000000000001', 'maintenance', 'negative', 'Red de talleres reducida'),
  ('a4000001-0001-0001-0001-000000000001', 'price', 'negative', 'Precio más alto que japonesas'),
  ('a4000001-0001-0001-0001-000000000001', 'ergonomics', 'positive', 'Posición rallygoer cómoda'),
  ('a4000001-0001-0001-0001-000000000002', 'engine', 'positive', 'Carácter rally, gusta en zonas lentas'),
  ('a4000001-0001-0001-0001-000000000002', 'electronics', 'positive', 'ABS Bosch muy modulable'),
  ('a4000001-0001-0001-0001-000000000002', 'aerodynamics', 'positive', 'Pantalla ofrece buena protección'),
  ('a4000001-0001-0001-0001-000000000002', 'maintenance', 'negative', 'Repuestos más caros y lentos'),
  ('a4000001-0001-0001-0001-000000000002', 'consumption', 'positive', 'Consumo contenido para cilindrada'),
  ('a4000001-0001-0001-0001-000000000003', 'suspension', 'positive', 'Suspensiones en otro nivel'),
  ('a4000001-0001-0001-0001-000000000003', 'engine', 'positive', 'Motor suave y controlable'),
  ('a4000001-0001-0001-0001-000000000003', 'weight', 'positive', 'Buen reparto de pesos'),
  ('a4000001-0001-0001-0001-000000000003', 'price', 'negative', 'Mantenimiento más caro que japonesas'),
  ('a4000001-0001-0001-0001-000000000003', 'electronics', 'positive', 'Control de tracción muy fino'),
  ('a4000001-0001-0001-0001-000000000004', 'aerodynamics', 'positive', 'Pantalla eficaz en viaje'),
  ('a4000001-0001-0001-0001-000000000004', 'braking', 'positive', 'Frenos potentes y modulables'),
  ('a4000001-0001-0001-0001-000000000004', 'price', 'negative', 'Precio inicial elevado'),
  ('a4000001-0001-0001-0001-000000000004', 'maintenance', 'negative', 'Red de servicio limitada'),
  ('a4000001-0001-0001-0001-000000000005', 'suspension', 'positive', 'Absorbe perfectamente obstáculos'),
  ('a4000001-0001-0001-0001-000000000005', 'weight', 'positive', 'Peso muy equilibrado'),
  ('a4000001-0001-0001-0001-000000000005', 'engine', 'positive', 'Control de tracción excelente'),
  ('a4000001-0001-0001-0001-000000000005', 'design', 'positive', 'Estética rally perfecta'),
  ('a4000001-0001-0001-0001-000000000005', 'electronics', 'positive', 'Modos muy bien calibrados')
ON CONFLICT (review_id, category) DO UPDATE SET
  sentiment = EXCLUDED.sentiment,
  comment = EXCLUDED.comment;

-- --------------------------------------------------------------------------
-- ASPECTOS: honda-cb750-hornet-2024 (Naked)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_review_aspects (review_id, category, sentiment, comment)
VALUES
  ('a5000001-0001-0001-0001-000000000001', 'engine', 'positive', 'Twin suave y con potencia suficiente'),
  ('a5000001-0001-0001-0001-000000000001', 'price', 'positive', 'Excelente relación precio/prestaciones'),
  ('a5000001-0001-0001-0001-000000000001', 'ergonomics', 'positive', 'Altura accesible para ciudad'),
  ('a5000001-0001-0001-0001-000000000001', 'consumption', 'positive', 'Consumo muy bajo en uso urbano'),
  ('a5000001-0001-0001-0001-000000000001', 'suspension', 'negative', 'Suspensiones algo sencillas'),
  ('a5000001-0001-0001-0001-000000000001', 'electronics', 'positive', 'Modos de conducción útiles'),
  ('a5000001-0001-0001-0001-000000000002', 'engine', 'positive', 'Motorversátil para diario y sport'),
  ('a5000001-0001-0001-0001-000000000002', 'consumption', 'positive', 'Consumo muy bueno en mixto'),
  ('a5000001-0001-0001-0001-000000000002', 'braking', 'positive', 'Frenos correctos para el uso intended'),
  ('a5000001-0001-0001-0001-000000000002', 'weight', 'positive', 'Peso contenido para media cilindrada'),
  ('a5000001-0001-0001-0001-000000000002', 'suspension', 'negative', 'Limitada para conducción deportiva'),
  ('a5000001-0001-0001-0001-000000000002', 'price', 'positive', 'Muy buena moto por el precio'),
  ('a5000001-0001-0001-0001-000000000003', 'engine', 'positive', 'Motor suave para ciudad'),
  ('a5000001-0001-0001-0001-000000000003', 'ergonomics', 'positive', 'Fácil de manejar en tráfico'),
  ('a5000001-0001-0001-0001-000000000003', 'consumption', 'positive', 'Consumo urbano muy bueno'),
  ('a5000001-0001-0001-0001-000000000003', 'suspension', 'negative', 'Blanda para uso sport'),
  ('a5000001-0001-0001-0001-000000000003', 'aerodynamics', 'negative', 'Sin protección en autovía'),
  ('a5000001-0001-0001-0001-000000000004', 'engine', 'positive', 'Motor divertido en curvas'),
  ('a5000001-0001-0001-0001-000000000004', 'weight', 'positive', 'Chasis ágil'),
  ('a5000001-0001-0001-0001-000000000004', 'electronics', 'positive', 'Modos permiten adaptar respuesta'),
  ('a5000001-0001-0001-0001-000000000004', 'design', 'positive', 'Diseño agresivo y moderno'),
  ('a5000001-0001-0001-0001-000000000004', 'braking', 'negative', 'Frenos algo justos para sport')
ON CONFLICT (review_id, category) DO UPDATE SET
  sentiment = EXCLUDED.sentiment,
  comment = EXCLUDED.comment;

-- --------------------------------------------------------------------------
-- ASPECTOS: ducati-monster-2024 (Naked)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_review_aspects (review_id, category, sentiment, comment)
VALUES
  ('a6000001-0001-0001-0001-000000000001', 'engine', 'positive', 'Testastretta refinadísimo, mejor de lo expected'),
  ('a6000001-0001-0001-0001-000000000001', 'weight', 'positive', 'Peso increíblemente bajo'),
  ('a6000001-0001-0001-0001-000000000001', 'electronics', 'positive', 'Electrónica Bosch de primer nivel'),
  ('a6000001-0001-0001-0001-000000000001', 'braking', 'positive', 'Frenos Brembo impeccabili'),
  ('a6000001-0001-0001-0001-000000000001', 'design', 'positive', 'Diseño atemporal de la Monster'),
  ('a6000001-0001-0001-0001-000000000001', 'aerodynamics', 'negative', 'Calor excesivo en ciudad del bicilíndrico'),
  ('a6000001-0001-0001-0001-000000000001', 'maintenance', 'negative', 'Coste de mantenimiento alto'),
  ('a6000001-0001-0001-0001-000000000002', 'engine', 'positive', 'Mucho par disponible'),
  ('a6000001-0001-0001-0001-000000000002', 'ergonomics', 'positive', 'Más cómoda que generaciones anteriores'),
  ('a6000001-0001-0001-0001-000000000002', 'passenger', 'negative', 'Aún incómoda para ser moto de pasajero'),
  ('a6000001-0001-0001-0001-000000000002', 'consumption', 'negative', 'Consumo más alto de lo esperado'),
  ('a6000001-0001-0001-0001-000000000002', 'price', 'negative', 'Precio elevado'),
  ('a6000001-0001-0001-0001-000000000003', 'engine', 'positive', 'Potencia lineal y controlable'),
  ('a6000001-0001-0001-0001-000000000003', 'electronics', 'positive', 'Electrónica excelente y bien calibrada'),
  ('a6000001-0001-0001-0001-000000000003', 'suspension', 'positive', 'Öhlins de serie un acierto'),
  ('a6000001-0001-0001-0001-000000000003', 'aerodynamics', 'negative', 'Calor del bicilíndrico molesto en tráfico'),
  ('a6000001-0001-0001-0001-000000000003', 'price', 'negative', 'Precio alto para la cilindrada'),
  ('a6000001-0001-0001-0001-000000000004', 'engine', 'positive', 'Sonido y respuesta excepcionales'),
  ('a6000001-0001-0001-0001-000000000004', 'braking', 'positive', 'Frenos Brembo increíbles'),
  ('a6000001-0001-0001-0001-000000000004', 'design', 'positive', 'La Monster más bonita de la historia'),
  ('a6000001-0001-0001-0001-000000000004', 'maintenance', 'negative', 'Mantenimiento desmo costoso'),
  ('a6000001-0001-0001-0001-000000000004', 'price', 'negative', 'Precio de compra elevado'),
  ('a6000001-0001-0001-0001-000000000005', 'engine', 'positive', 'Motor suave y refinado'),
  ('a6000001-0001-0001-0001-000000000005', 'weight', 'positive', 'Fácil de manejar para ser Ducati'),
  ('a6000001-0001-0001-0001-000000000005', 'ergonomics', 'positive', 'Práctica para uso diario'),
  ('a6000001-0001-0001-0001-000000000005', 'consumption', 'negative', 'Consumo algo alto en retención'),
  ('a6000001-0001-0001-0001-000000000006', 'passenger', 'negative', 'Muy incómoda para pasajero'),
  ('a6000001-0001-0001-0001-000000000006', 'ergonomics', 'negative', 'No hay asideras adecuadas'),
  ('a6000001-0001-0001-0001-000000000006', 'braking', 'positive', 'Frenos bons incluso para dos')
ON CONFLICT (review_id, category) DO UPDATE SET
  sentiment = EXCLUDED.sentiment,
  comment = EXCLUDED.comment;

-- --------------------------------------------------------------------------
-- ASPECTOS: yamaha-tracer-9-gt-2024 (Sport-Touring)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_review_aspects (review_id, category, sentiment, comment)
VALUES
  ('a7000001-0001-0001-0001-000000000001', 'engine', 'positive', 'CP3 versátil y con mucho par'),
  ('a7000001-0001-0001-0001-000000000001', 'ergonomics', 'positive', 'Confort excepcional para viaje largo'),
  ('a7000001-0001-0001-0001-000000000001', 'passenger', 'positive', 'Muy cómoda para dos'),
  ('a7000001-0001-0001-0001-000000000001', 'consumption', 'positive', 'Consumo razonable para la cilindrada'),
  ('a7000001-0001-0001-0001-000000000001', 'electronics', 'positive', 'Cruise control muy útil'),
  ('a7000001-0001-0001-0001-000000000001', 'weight', 'negative', 'Peso notable sobre todo cargada'),
  ('a7000001-0001-0001-0001-000000000001', 'suspension', 'negative', 'Algo blandas para uso sport puro'),
  ('a7000001-0001-0001-0001-000000000002', 'engine', 'positive', 'Motor never disappoints'),
  ('a7000001-0001-0001-0001-000000000002', 'aerodynamics', 'positive', 'Pantalla protege muy bien'),
  ('a7000001-0001-0001-0001-000000000002', 'electronics', 'positive', 'Kyb elektronischer very good'),
  ('a7000001-0001-0001-0001-000000000002', 'weight', 'negative', 'Pesada para maneuver'),
  ('a7000001-0001-0001-0001-000000000002', 'price', 'positive', 'Mucha moto por el precio'),
  ('a7000001-0001-0001-0001-000000000003', 'engine', 'positive', 'CP3 empujón fuerte y lineal'),
  ('a7000001-0001-0001-0001-000000000003', 'suspension', 'positive', 'Kyb adapts muy bien a cada situación'),
  ('a7000001-0001-0001-0001-000000000003', 'braking', 'positive', 'Frenos powerful y modulables'),
  ('a7000001-0001-0001-0001-000000000003', 'weight', 'negative', 'Algo pesada para circuito'),
  ('a7000001-0001-0001-0001-000000000003', 'price', 'negative', 'Neumáticos se degradan rápido en track'),
  ('a7000001-0001-0001-0001-000000000004', 'engine', 'positive', 'Motor perfeito para viagem'),
  ('a7000001-0001-0001-0001-000000000004', 'aerodynamics', 'positive', 'Protección excelente'),
  ('a7000001-0001-0001-0001-000000000004', 'electronics', 'positive', 'Cruise control permite descansar'),
  ('a7000001-0001-0001-0001-000000000004', 'passenger', 'positive', 'Espacio y confort para pasajero'),
  ('a7000001-0001-0001-0001-000000000004', 'suspension', 'negative', 'Suspensiones algo blandas'),
  ('a7000001-0001-0001-0001-000000000004', 'price', 'negative', 'Precio alto pero justificado')
ON CONFLICT (review_id, category) DO UPDATE SET
  sentiment = EXCLUDED.sentiment,
  comment = EXCLUDED.comment;

-- --------------------------------------------------------------------------
-- ASPECTOS: bmw-f-900-gs-2024 (Trail)
-- --------------------------------------------------------------------------
INSERT INTO public.motorcycle_review_aspects (review_id, category, sentiment, comment)
VALUES
  ('a8000001-0001-0001-0001-000000000001', 'engine', 'positive', 'Mucho par desde abajo muy elástico'),
  ('a8000001-0001-0001-0001-000000000001', 'electronics', 'positive', 'Modos de conducción muy completos'),
  ('a8000001-0001-0001-0001-000000000001', 'braking', 'positive', 'ABS Pro muy efectivo en offroad'),
  ('a8000001-0001-0001-0001-000000000001', 'design', 'positive', 'Calidad de acabados BMW'),
  ('a8000001-0001-0001-0001-000000000001', 'price', 'negative', 'Sube mucho con paquetes'),
  ('a8000001-0001-0001-0001-000000000001', 'weight', 'negative', 'Pesada para trial técnico'),
  ('a8000001-0001-0001-0001-000000000001', 'aerodynamics', 'positive', 'Pantalla ajustable protege bien'),
  ('a8000001-0001-0001-0001-000000000002', 'suspension', 'positive', 'Alto nivel en offroad'),
  ('a8000001-0001-0001-0001-000000000002', 'electronics', 'positive', 'ABS Pro идеален para trial'),
  ('a8000001-0001-0001-0001-000000000002', 'engine', 'positive', 'Potencia controlable en zonas técnicas'),
  ('a8000001-0001-0001-0001-000000000002', 'weight', 'negative', 'Altura intimidadora en parado'),
  ('a8000001-0001-0001-0001-000000000002', 'price', 'negative', 'Precio muy alto'),
  ('a8000001-0001-0001-0001-000000000003', 'engine', 'positive', 'Motor flexible para uso mixed'),
  ('a8000001-0001-0001-0001-000000000003', 'suspension', 'positive', 'Más que capable para pistas'),
  ('a8000001-0001-0001-0001-000000000003', 'ergonomics', 'positive', 'Posición más trail que turística'),
  ('a8000001-0001-0001-0001-000000000003', 'consumption', 'positive', 'Consumo correcto'),
  ('a8000001-0001-0001-0001-000000000003', 'weight', 'negative', 'Pesada para trialerias técnicas'),
  ('a8000001-0001-0001-0001-000000000004', 'engine', 'positive', 'Flexible y económico tras 32.000 km'),
  ('a8000001-0001-0001-0001-000000000004', 'maintenance', 'positive', 'Servicio BMW excellent'),
  ('a8000001-0001-0001-0001-000000000004', 'consumption', 'positive', 'Autonomía buena con depósito 14.5L'),
  ('a8000001-0001-0001-0001-000000000004', 'price', 'negative', 'Repuestos caros'),
  ('a8000001-0001-0001-0001-000000000004', 'electronics', 'positive', 'Conectividad y TFT funcionan bien'),
  ('a8000001-0001-0001-0001-000000000005', 'suspension', 'positive', 'Calidad en zonas exigentes'),
  ('a8000001-0001-0001-0001-000000000005', 'electronics', 'positive', 'DTC muy útil en deslizantes'),
  ('a8000001-0001-0001-0001-000000000005', 'weight', 'negative', 'Peso se nota en trial técnico'),
  ('a8000001-0001-0001-0001-000000000005', 'price', 'negative', 'Muy cara para lo que ofrece'),
  ('a8000001-0001-0001-0001-000000000005', 'ergonomics', 'positive', 'Sillin algo estrecho pero tolerable')
ON CONFLICT (review_id, category) DO UPDATE SET
  sentiment = EXCLUDED.sentiment,
  comment = EXCLUDED.comment;

-- ============================================================================
-- RESUMEN
-- ============================================================================
-- Archivo: supabase/seeds/review_aspects_seed.sql
--
-- MOTOS INCLUIDAS (8):
--   1. yamaha-tenere-700-2024         (Trail, A2)
--   2. yamaha-mt-07-2024              (Naked, A2)
--   3. kawasaki-z900-2024             (Naked, A)
--   4. aprilia-tuareg-660-2024        (Trail, A2)
--   5. honda-cb750-hornet-2024        (Naked, A2)
--   6. ducati-monster-2024            (Naked, A)
--   7. yamaha-tracer-9-gt-2024       (Sport-Touring, A)
--   8. bmw-f-900-gs-2024              (Trail, A)
--
-- REVIEWS: ~43 total
--   - 40 approved (5-6 por moto)
--   - 3 pending (para testing del flujo)
--
-- ASPECTS: ~180-200 total
--   - 5-10 aspectos por review approved
--   - Categorías válidas: engine, ergonomics, consumption, braking, suspension,
--     electronics, aerodynamics, passenger, maintenance, price, weight, design
--   - Sentiment: positive / negative
--
-- PREFILIGHT CHECK:
--   - Verifica que todos los motorcycle_id existen antes de insertar
--   - Error claro si falta algún ID
--
-- IDEMPOTENCIA:
--   - Reviews: ON CONFLICT (id) DO NOTHING con UUIDs fijos
--   - Aspects: ON CONFLICT (review_id, category) DO UPDATE SET
--   - Ejecutable múltiples veces sin duplicados
--
-- SEGURIDAD:
--   - No modifica RLS ni policies
--   - No usa service_role
--   - Solo INSERT a motorcycle_reviews y motorcycle_review_aspects
--   - Reviews pending son status='pending' (no visibles públicamente)
--
-- LIMITACIONES:
--   - Datos ficticios (user_id = null, user_name mock)
--   - No garantiza coherencia absoluta entre pros/cons y aspectos
--   - No incluye reactions ni reports seed
