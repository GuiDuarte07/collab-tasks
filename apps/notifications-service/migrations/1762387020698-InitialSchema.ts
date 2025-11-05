import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1762387020698 implements MigrationInterface {
  name = 'InitialSchema1762387020698';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`CREATE TABLE "notifications" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "user_id" uuid NOT NULL,
            "task_id" uuid NOT NULL,
            "type" character varying(50) NOT NULL,
            "message" text NOT NULL,
            "read" boolean NOT NULL DEFAULT false,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_userId_read" ON "notifications" ("user_id", "read")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_taskId" ON "notifications" ("task_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notifications_taskId"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_userId_read"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
