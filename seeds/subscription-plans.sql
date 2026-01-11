-- Subscription Plans Seed Data
-- Run with: node -e "require('pg').Client...

INSERT INTO subscription_plans (name, description, price_monthly, price_annual, features, service_limits, is_active)
VALUES 
(
  'Basic',
  'Piano base per utenti individuali con servizi essenziali',
  9.99,
  99.99,
  '["Richiesta ISEE", "Dichiarazione dei Redditi (730/PF)", "Calcolo IMU", "2 richieste al mese", "Supporto email"]'::jsonb,
  '{"isee": 2, "modello730": 2, "imu": 2, "monthlyRequests": 2}'::jsonb,
  true
),
(
  'Professional',
  'Piano professionale per utenti con esigenze avanzate',
  19.99,
  199.99,
  '["Tutti i servizi Basic", "5 richieste al mese", "Accesso a tutti i corsi", "Consulenza prioritaria", "Supporto telefonico", "Prenotazione appuntamenti prioritaria"]'::jsonb,
  '{"isee": 5, "modello730": 5, "imu": 5, "monthlyRequests": 5}'::jsonb,
  true
),
(
  'Premium',
  'Piano premium per professionisti e famiglie numerose',
  29.99,
  299.99,
  '["Tutti i servizi Professional", "Richieste illimitate", "Gestione nucleo familiare", "Consulenza dedicata", "Supporto 24/7", "Prenotazione appuntamenti prioritaria", "Accesso API", "Report personalizzati"]'::jsonb,
  '{"isee": -1, "modello730": -1, "imu": -1, "monthlyRequests": -1}'::jsonb,
  true
),
(
  'Free Trial',
  'Piano di prova gratuito per 30 giorni',
  0.00,
  0.00,
  '["1 richiesta ISEE", "1 richiesta 730/PF", "Accesso base ai corsi", "Supporto email", "Valido 30 giorni"]'::jsonb,
  '{"isee": 1, "modello730": 1, "imu": 0, "monthlyRequests": 1}'::jsonb,
  true
);
