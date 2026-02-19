import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64 })
  userId!: string;

  @Column({ length: 255 })
  userName!: string;

  @Column({ length: 64, unique: true })
  accountNumber!: string;

  @Column({ type: 'bigint', default: 0 })
  balance!: string;

  @Column({ type: 'varchar', length: 3, default: 'UGX' })
  currency!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
