import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const { default: app } = await import('./app.js');
import { PORT } from './config/constants.js';
import { migrate } from './migrate.js';
import { UserModel } from './models/User.js';
import { setPublicUrl } from './config/publicUrl.js';

async function start() {
  try {
    await migrate();
    await UserModel.ensureAdmin();
    console.log('PostgreSQL ready');
  } catch (err) {
    console.error('Database migration failed:', err.message);
    process.exit(1);
  }

  async function startNgrok() {
    try {
      const ngrok = await import('@ngrok/ngrok');
      const listener = await ngrok.forward({ addr: PORT, authtoken_from_env: true });
      const url = listener.url();
      setPublicUrl(url);
      console.log(`ngrok tunnel: ${url}`);
    } catch (err) {
      console.warn('ngrok failed (set NGROK_AUTHTOKEN env var):', err.message);
    }
  }

  startNgrok();

  app.listen(PORT, () => {
    console.log(`EASTER Stream API running on http://localhost:${PORT}`);
  });
}

start();
