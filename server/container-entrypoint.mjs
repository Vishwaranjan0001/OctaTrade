import { randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Generate a secret on first start and keep it with the Docker volume.
// Existing logins remain valid after a container rebuild or restart.
if (!process.env.JWT_SECRET) {
  const directory = new URL('./runtime/', import.meta.url);
  const secretFile = new URL('jwt-secret', directory);
  await mkdir(directory, { recursive: true });
  try {
    process.env.JWT_SECRET = (await readFile(secretFile, 'utf8')).trim();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    process.env.JWT_SECRET = randomBytes(48).toString('hex');
    await writeFile(secretFile, process.env.JWT_SECRET, { mode: 0o600, flag: 'wx' });
  }
  if (!process.env.JWT_SECRET) throw new Error('The stored JWT secret is empty.');
}

process.env.JWT_EXPIRES_IN ||= '7d';
await import('./index.js');
