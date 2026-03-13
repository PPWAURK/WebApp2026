import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parsePositiveInt } from '../config/env.utils';
import { PrismaService } from '../prisma/prisma.service';

type HealthCheckStatus = 'up' | 'down';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getHealthStatus() {
    const databaseTimeoutMs = parsePositiveInt(
      this.configService.get<string>('HEALTHCHECK_DATABASE_TIMEOUT_MS'),
      1500,
    );
    const database = await this.prisma.checkHealth(databaseTimeoutMs);
    const status: HealthCheckStatus = database.status === 'up' ? 'up' : 'down';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      checks: {
        database,
      },
    };
  }

  async assertHealthy() {
    const health = await this.getHealthStatus();

    if (health.status !== 'up') {
      throw new ServiceUnavailableException(health);
    }

    return health;
  }
}
