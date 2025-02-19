import { config } from 'dotenv';
config();
import { main } from './pipeline/index.js';
import { content } from './config/content.js';

type Database = keyof typeof content;

(async () => {
  const dbName = process.argv[2] as Database;
  
  if (!dbName || !(dbName in content)) {
    console.error(`Please provide a valid database name: ${Object.keys(content).join(', ')}`);
    process.exit(1);
  }

  const result = await main(dbName);
  process.exit(result.success ? 0 : 1);
})();