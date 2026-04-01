import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  type UserRole,
  RECORD_STATUSES,
} from '../../common/domain/domain.constants';
import { RegisterDto } from './dto/register.dto';
import { hashPassword, verifyPassword } from './utils/password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async getSessionPreview(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Authenticated user not found.');
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        customer: user.customer,
      },
    };
  }

  async register(body: RegisterDto) {
    if (!body.name?.trim()) {
      throw new BadRequestException('Name is required.');
    }

    if (!body.email?.trim()) {
      throw new BadRequestException('Email is required.');
    }

    if (!body.password?.trim() || body.password.trim().length < 6) {
      throw new BadRequestException(
        'Password is required and must contain at least 6 characters.',
      );
    }

    const email = body.email.trim().toLowerCase();
    const role: UserRole = 'CUSTOMER';

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashPassword(body.password.trim()),
          role,
          customer:
            role === 'CUSTOMER'
              ? {
                  create: {
                    name: body.name.trim(),
                    email,
                    phone: this.normalizeOptionalText(body.phone),
                    city: this.normalizeOptionalText(body.city),
                    status: RECORD_STATUSES[0],
                  },
                }
              : undefined,
        },
        include: {
          customer: true,
        },
      });

      return this.buildAuthResponse(
        user.id,
        user.email,
        user.role,
        user.customer,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('A user with that email already exists.');
      }

      throw error;
    }
  }

  async login(email: string, password: string) {
    if (!email.trim() || !password.trim()) {
      throw new BadRequestException('Email and password are required.');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase(),
      },
      include: {
        customer: true,
      },
    });

    if (!user || !verifyPassword(password.trim(), user.password)) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.buildAuthResponse(
      user.id,
      user.email,
      user.role,
      user.customer,
    );
  }

  private buildAuthResponse(
    id: string,
    email: string,
    role: string,
    customer?: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      city: string | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string | null;
    } | null,
  ) {
    return {
      accessToken: this.jwtService.sign({
        sub: id,
        email,
        role,
      }),
      user: {
        id,
        email,
        role,
        customer,
      },
      message: 'Authentication completed successfully.',
    };
  }

  private normalizeOptionalText(value?: string | null) {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }
}
