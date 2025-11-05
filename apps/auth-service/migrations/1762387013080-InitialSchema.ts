import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1762387013080 implements MigrationInterface {
  name = 'InitialSchema1762387013080';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`CREATE TABLE "users" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "email" character varying NOT NULL,
            "username" character varying NOT NULL,
            "name" character varying NOT NULL,
            "password" character varying NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_users_email" UNIQUE ("email"),
            CONSTRAINT "UQ_users_username" UNIQUE ("username"),
            CONSTRAINT "PK_users" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(`CREATE TABLE "refresh_tokens" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "token" character varying NOT NULL,
            "user_id" uuid NOT NULL,
            "expires_at" TIMESTAMP NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "UQ_refresh_tokens_token" UNIQUE ("token"),
            CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_user"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
