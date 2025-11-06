import 'reflect-metadata';
import 'dotenv/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, type DataSourceOptions } from 'typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT || 5432),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'collabtasks_db',
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  autoLoadEntities: true,
  synchronize: false,
  migrations: [__dirname + '/../../migrations/*.{ts,js}'],
  migrationsTableName: 'task_migrations',
  logging: true,
};

// DataSource para o CLI do TypeORM (migrations)
const dataSourceOptions: DataSourceOptions = {
  ...(databaseConfig as unknown as DataSourceOptions),
  entities: [__dirname + '/../entities/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../../migrations/*.{ts,js}'],
};

export default new DataSource(dataSourceOptions);
