import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { RbacSeed } from './rbac-seed';

// Load environment variables
config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
    entities: ['src/entities/*.entity.ts'],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection established');

    const seed = new RbacSeed(dataSource);
    await seed.seed();

    console.log('RBAC seed completed successfully');
  } catch (error) {
    console.error('Error during RBAC seed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeed();
