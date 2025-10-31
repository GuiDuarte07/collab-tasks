import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type AuditChange = {
  field: string;
  from: unknown;
  to: unknown;
};

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ASSIGNMENT_ADD'
  | 'ASSIGNMENT_REMOVE'
  | 'ASSIGNMENT_UPDATE';

@Entity('task_audits')
export class TaskAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_task_audits_task_id')
  @Column({ type: 'uuid', name: 'task_id' })
  taskId: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Column({ type: 'jsonb', nullable: true })
  changes?: AuditChange[] | null;

  @Column({ type: 'jsonb', nullable: true })
  snapshot?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
