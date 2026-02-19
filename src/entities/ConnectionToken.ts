import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('connection_tokens')
@Index(['tokenHash'], { unique: true })
export class ConnectionToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64 })
  userId!: string;

  @Column({ length: 64 })
  tokenHash!: string;

  @Column({ type: 'text' })
  token!: string;

  @Column({ length: 32 })
  scope!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
