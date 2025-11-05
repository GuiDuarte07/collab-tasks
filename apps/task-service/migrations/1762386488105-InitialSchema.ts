import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1762386488105 implements MigrationInterface {
  name = 'InitialSchema1762386488105';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(
      `CREATE TYPE "public"."tasks_status_enum" AS ENUM('TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_priority_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT')`,
    );

    await queryRunner.query(`CREATE TABLE "tasks" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "title" character varying(255) NOT NULL,
            "description" text NOT NULL,
            "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'TODO',
            "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'MEDIUM',
            "due_date" TIMESTAMP,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_tasks" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(`CREATE TABLE "task_assignments" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "task_id" uuid NOT NULL,
            "user_id" uuid NOT NULL,
            "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_task_assignments" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(`CREATE TABLE "task_comments" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "task_id" uuid NOT NULL,
            "user_id" uuid NOT NULL,
            "content" text NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_task_comments" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(`CREATE TABLE "task_audits" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "task_id" uuid NOT NULL,
            "user_id" uuid NOT NULL,
            "action" character varying NOT NULL,
            "old_value" text,
            "new_value" text,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_task_audits" PRIMARY KEY ("id")
        )`);

    await queryRunner.query(
      `ALTER TABLE "task_assignments" ADD CONSTRAINT "FK_task_assignments_task" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" ADD CONSTRAINT "FK_task_comments_task" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_audits" ADD CONSTRAINT "FK_task_audits_task" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_audits" DROP CONSTRAINT "FK_task_audits_task"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_comments" DROP CONSTRAINT "FK_task_comments_task"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignments" DROP CONSTRAINT "FK_task_assignments_task"`,
    );

    await queryRunner.query(`DROP TABLE "task_audits"`);
    await queryRunner.query(`DROP TABLE "task_comments"`);
    await queryRunner.query(`DROP TABLE "task_assignments"`);
    await queryRunner.query(`DROP TABLE "tasks"`);

    await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);

    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
