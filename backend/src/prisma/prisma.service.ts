import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  async onModuleInit() {
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      return;
    }

    await this.$connect();
    this.logger.log('Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async checkHealth(timeoutMs: number) {
    const startedAt = Date.now();

    try {
      await Promise.race([
        this.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => {
          const timeout = setTimeout(() => {
            reject(
              new Error(`Database health check timed out after ${timeoutMs}ms`),
            );
          }, timeoutMs);

          timeout.unref?.();
        }),
      ]);

      return {
        status: 'up' as const,
        responseTimeMs: Date.now() - startedAt,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Database is unavailable';

      return {
        status: 'down' as const,
        responseTimeMs: Date.now() - startedAt,
        message,
      };
    }
  }
}
