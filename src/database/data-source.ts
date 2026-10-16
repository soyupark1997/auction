import { DataSource } from 'typeorm';
import { User } from '../users/user.entity.js';

// CLI는 Nest 밖에서 돌아서 .env를 직접 읽어야 한다 (Node 내장 기능)
try {
  process.loadEnvFile();
} catch {
  // .env가 없으면 이미 설정된 환경변수를 쓴다
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
