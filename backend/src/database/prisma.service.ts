import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Use runtime require to avoid TypeScript import issues across Prisma versions
const { PrismaClient } = require('@prisma/client');

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  [key: string]: any;

  private client: any;
  private readonly enabled: boolean;

  constructor() {
    const url = process.env.DATABASE_URL;
    this.enabled = Boolean(url && url.trim());

    if (!this.enabled) {
      this.client = this.createMockClient();
      Object.assign(this, this.client);
      return;
    }

    try {
      const databaseUrl = new URL(url!);
      const isLocalDatabase = ['localhost', '127.0.0.1'].includes(databaseUrl.hostname);
      const adapter = new PrismaMariaDb({
        host: databaseUrl.hostname,
        port: Number(databaseUrl.port) || 3306,
        user: decodeURIComponent(databaseUrl.username),
        password: decodeURIComponent(databaseUrl.password),
        database: databaseUrl.pathname.replace(/^\//, ''),
        connectionLimit: 5,
        allowPublicKeyRetrieval: isLocalDatabase,
      });
      this.client = new PrismaClient({ adapter });
      Object.assign(this, this.client);
    } catch (error) {
      console.warn('Prisma client initialization failed, falling back to mock client:', error);
      this.client = this.createMockClient();
      Object.assign(this, this.client);
    }
  }

  async onModuleInit() {
    if (!this.enabled) return;
    try {
      if (typeof this['$connect'] === 'function') await this['$connect']();
    } catch (error) {
      console.warn('Prisma database connection failed, using the local fallback client:', error);
      this.client = this.createMockClient();
      Object.assign(this, this.client);
    }
  }

  async onModuleDestroy() {
    if (!this.enabled) return;
    if (typeof this['$disconnect'] === 'function') await this['$disconnect']();
  }

  private createMockClient() {
    return {
      $connect: async () => undefined,
      $disconnect: async () => undefined,
      $queryRawUnsafe: async () => [],
      $executeRawUnsafe: async () => undefined,
      user: {
        create: async () => null,
        findUnique: async () => null,
        findMany: async () => [],
      },
      data: {},
    };
  }
}
