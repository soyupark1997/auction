import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type UserRole = 'USER' | 'ADMIN';

@Entity({ name: 'users' })
export class User {
  // BIGINT는 JS 숫자로 안전하게 못 담아서 문자열로 받는다
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  // 소문자로 바꿔서 저장할 예정 (T4)
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  nickname!: string;

  @Column({ type: 'varchar', length: 10, default: 'USER' })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
