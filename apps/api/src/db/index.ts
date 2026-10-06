import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionUri = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/myarsip_nikah';

export const poolConnection = mysql.createPool(connectionUri);

export const db = drizzle(poolConnection, { schema, mode: 'default' });
