import { describe, it } from 'node:test';
import strictAssert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();

function readRepo(rel: string): string {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

function migrationDirs(): string[] {
  return readdirSync(resolve(ROOT, 'prisma/migrations')).filter((d) =>
    /^\d{14}_/.test(d),
  );
}

describe('Prisma production datasource (PostgreSQL migration)', () => {
  it('declares the postgresql provider', () => {
    const schema = readRepo('prisma/schema.prisma');
    strictAssert.ok(schema.includes('provider  = "postgresql"'));
  });

  it('binds the runtime URL to env("DATABASE_URL")', () => {
    const schema = readRepo('prisma/schema.prisma');
    strictAssert.ok(schema.includes('url       = env("DATABASE_URL")'));
  });

  it('binds the migration URL to env("DIRECT_URL")', () => {
    const schema = readRepo('prisma/schema.prisma');
    strictAssert.ok(schema.includes('directUrl = env("DIRECT_URL")'));
  });

  it('leaves no SQLite production datasource behind', () => {
    const schema = readRepo('prisma/schema.prisma');
    strictAssert.ok(!schema.includes('provider = "sqlite"'));
    strictAssert.ok(!schema.includes('file:./prisma'));
  });

  it('ships an initial PostgreSQL migration with a lock file', () => {
    const lock = readRepo('prisma/migrations/migration_lock.toml');
    strictAssert.ok(lock.includes('provider = "postgresql"'));

    const dirs = migrationDirs();
    strictAssert.ok(dirs.length > 0, 'expected at least one migration directory');

    const sql = readRepo(`prisma/migrations/${dirs[0]}/migration.sql`);
    strictAssert.ok(sql.includes('CREATE TABLE'));
    strictAssert.ok(sql.includes('"VideoTask"'));
    strictAssert.ok(sql.includes('"ImageTask"'));
    strictAssert.ok(sql.includes('BOOLEAN NOT NULL'));
    strictAssert.ok(sql.includes('TIMESTAMP(3)'));
  });

  it('commits no real credentials in migration SQL', () => {
    const dirs = migrationDirs();
    const sql = readRepo(`prisma/migrations/${dirs[0]}/migration.sql`);
    strictAssert.ok(!sql.includes('postgresql://'));
    strictAssert.ok(!sql.toLowerCase().includes('password'));
  });

  it('tracks no secret env file in git', () => {
    const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n');
    const envFiles = tracked.filter(
      (f) => /^\.env(\..+)?$/.test(f) && f !== '.env.example',
    );
    strictAssert.deepEqual(envFiles, []);
  });

  it('defines the database npm scripts', () => {
    const pkg = JSON.parse(readRepo('package.json')) as {
      scripts: Record<string, string>;
    };
    strictAssert.equal(pkg.scripts['db:generate'], 'prisma generate');
    strictAssert.equal(pkg.scripts['db:migrate:deploy'], 'prisma migrate deploy');
    strictAssert.equal(pkg.scripts['db:migrate:status'], 'prisma migrate status');
  });

  it('documents DATABASE_URL (runtime) and DIRECT_URL (migration) safely', () => {
    const readme = readRepo('README.md');
    strictAssert.ok(readme.includes('DATABASE_URL'));
    strictAssert.ok(readme.includes('DIRECT_URL'));
    strictAssert.ok(readme.includes('migrate deploy'));
    strictAssert.ok(readme.includes('pooled'));
  });

  it('keeps the PrismaClient singleton pattern', () => {
    const db = readRepo('src/lib/db.ts');
    strictAssert.ok(db.includes('globalThis'));
    strictAssert.ok(db.includes('new PrismaClient'));
  });
});
