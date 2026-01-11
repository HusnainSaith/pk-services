import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source';
import { SubscriptionPlan } from '../src/modules/subscriptions/entities/subscription-plan.entity';

export async function seedSubscriptionPlans() {
  console.log('\n📦 Seeding Subscription Plans...');

  const planRepo = AppDataSource.getRepository(SubscriptionPlan);

  const subscriptionPlans = [
    {
      name: 'Basic',
      description: 'Piano base per utenti individuali con servizi essenziali',
      priceMonthly: 9.99,
      priceAnnual: 99.99,
      features: [
        'Richiesta ISEE',
        'Dichiarazione dei Redditi (730/PF)',
        'Calcolo IMU',
        '2 richieste al mese',
        'Supporto email',
      ],
      serviceLimits: {
        isee: 2,
        modello730: 2,
        imu: 2,
        monthlyRequests: 2,
      },
      enabledServices: ['ISEE', '730_PF', 'IMU'],
      isActive: true,
    },
    {
      name: 'Professional',
      description: 'Piano professionale per utenti con esigenze avanzate',
      priceMonthly: 19.99,
      priceAnnual: 199.99,
      features: [
        'Tutti i servizi Basic',
        '5 richieste al mese',
        'Accesso a tutti i corsi',
        'Consulenza prioritaria',
        'Supporto telefonico',
        'Prenotazione appuntamenti prioritaria',
      ],
      serviceLimits: {
        isee: 5,
        modello730: 5,
        imu: 5,
        monthlyRequests: 5,
      },
      enabledServices: ['ISEE', '730_PF', 'IMU'],
      isActive: true,
    },
    {
      name: 'Premium',
      description: 'Piano premium per professionisti e famiglie numerose',
      priceMonthly: 29.99,
      priceAnnual: 299.99,
      features: [
        'Tutti i servizi Professional',
        'Richieste illimitate',
        'Gestione nucleo familiare',
        'Consulenza dedicata',
        'Supporto 24/7',
        'Prenotazione appuntamenti prioritaria',
        'Accesso API',
        'Report personalizzati',
      ],
      serviceLimits: {
        isee: -1, // -1 = unlimited
        modello730: -1,
        imu: -1,
        monthlyRequests: -1,
      },
      enabledServices: ['ISEE', '730_PF', 'IMU'],
      isActive: true,
    },
    {
      name: 'Free Trial',
      description: 'Piano di prova gratuito per 30 giorni',
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        '1 richiesta ISEE',
        '1 richiesta 730/PF',
        'Accesso base ai corsi',
        'Supporto email',
        'Valido 30 giorni',
      ],
      serviceLimits: {
        isee: 1,
        modello730: 1,
        imu: 0,
        monthlyRequests: 1,
      },
      enabledServices: ['ISEE', '730_PF'],
      isActive: true,
    },
  ];

  for (const planData of subscriptionPlans) {
    const existing = await planRepo.findOne({ where: { name: planData.name } });

    if (!existing) {
      const plan = planRepo.create(planData);
      await planRepo.save(plan);
      console.log(
        `✅ Created subscription plan: ${planData.name} (${planData.priceMonthly}€/month)`,
      );
    } else {
      console.log(`⏭️  Subscription plan "${planData.name}" already exists`);
    }
  }

  console.log('✅ Subscription plans seeding completed\n');
}

// Run directly if this file is executed
if (require.main === module) {
  (async () => {
    await AppDataSource.initialize();
    try {
      await seedSubscriptionPlans();
      console.log('✅ All done!');
    } catch (error) {
      console.error('❌ Error seeding subscription plans:', error);
      process.exit(1);
    } finally {
      await AppDataSource.destroy();
    }
  })();
}
