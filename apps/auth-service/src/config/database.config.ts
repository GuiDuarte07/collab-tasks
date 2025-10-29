import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity, RefreshTokenEntity } from '../entities';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'collabtasks_db',
  entities: [UserEntity, RefreshTokenEntity],
  synchronize: true,
  logging: true,
};

//
// ================ ATENÇÃO =================
// ENTENDO QUE O USO DO "synchronize: true" PODE SER PERIGOSO EM AMBIENTES DE PRODUÇÃO,
// POIS PODE LEVAR À PERDA DE DADOS. ESSE CONFIGURAÇÃO DEVE SER USADA APENAS EM AMBIENTES DE DESENVOLVIMENTO
// DECISÃO TOMADA APENAS PARA FACILITAR O DESENVOLVIMENTO DESSE DESAFIO PRÁTICO.
//
