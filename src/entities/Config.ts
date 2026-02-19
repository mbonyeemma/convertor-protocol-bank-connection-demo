import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bank_config')
export class BankConfig {
  @PrimaryColumn({ length: 64 })
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
