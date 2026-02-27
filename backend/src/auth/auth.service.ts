import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly restaurantsService: RestaurantsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException('Account pending manager approval');
    }

    const authenticatedUser = await this.usersService.findById(user.id);

    if (!authenticatedUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(authenticatedUser);
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    await this.restaurantsService.ensureRestaurantExists(registerDto.restaurantId);

    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const createdUser = await this.usersService.createEmployee({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
      restaurantId: registerDto.restaurantId,
      isApproved: false,
    });

    return {
      pendingApproval: true,
      userId: createdUser.id,
      message: 'Account created. Waiting manager approval before first login.',
    };
  }

  private async buildAuthResponse(user: {
    id: number;
    email: string;
    name: string | null;
    profilePhoto: string | null;
    role: string;
    isOnProbation: boolean;
    workplaceRole: string;
    trainingAccess: Prisma.JsonValue | null;
    restaurantId: number | null;
    restaurant: { id: number; name: string; address: string } | null;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      workplaceRole: user.workplaceRole,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRES_IN',
          '15m',
        ) as StringValue,
      }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePhoto: user.profilePhoto,
        role: user.role,
        isOnProbation: user.isOnProbation,
        workplaceRole: user.workplaceRole,
        trainingAccess: this.usersService.normalizeTrainingAccess(
          user.trainingAccess,
        ),
        restaurant: user.restaurant,
      },
    };
  }

  async validateUserById(userId: number) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!user.isApproved) {
      throw new UnauthorizedException('Account pending manager approval');
    }

    return {
      ...user,
      trainingAccess: this.usersService.normalizeTrainingAccess(user.trainingAccess),
    };
  }
}
