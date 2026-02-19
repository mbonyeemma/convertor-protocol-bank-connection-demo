import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('bank_transactions')
@Index(['referenceId'])
export class BankTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64 })
  referenceId!: string;

  @Column({ length: 32 })
  type!: string;

  @Column({ type: 'char', length: 36, nullable: true })
  accountId!: string | null;

  @Column({ type: 'bigint', nullable: true })
  amount!: string | null;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency!: string | null;

  @Column({ type: 'text', nullable: true })
  payload!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
