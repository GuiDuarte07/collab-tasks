import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { TaskEntity } from './task.entity';

@Entity({ name: 'task_assignments' })
@Index(['taskId', 'userId'], { unique: true })
export class TaskAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'task_id' })
  taskId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 50, default: 'assigned' })
  role!: string;

  @CreateDateColumn({ type: 'timestamp', name: 'assigned_at' })
  assignedAt!: Date;

  @ManyToOne(() => TaskEntity, (task) => task.assignments, {
    onDelete: 'CASCADE',
  })
  task!: TaskEntity;
}
