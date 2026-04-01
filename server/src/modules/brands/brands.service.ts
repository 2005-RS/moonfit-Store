import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RECORD_STATUSES } from '../../common/domain/domain.constants';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.brand.findMany({
      include: {
        products: {
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${id} not found.`);
    }

    return brand;
  }

  async create(body: CreateBrandDto) {
    this.validateRequiredFields(body);

    try {
      return await this.prisma.brand.create({
        data: this.buildCreateData(body),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: string, body: UpdateBrandDto) {
    await this.ensureBrandExists(id);

    try {
      return await this.prisma.brand.update({
        where: { id },
        data: this.buildUpdateData(body),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${id} not found.`);
    }

    if (brand.products.length > 0) {
      throw new BadRequestException(
        'This brand cannot be deleted because it still has products assigned.',
      );
    }

    await this.prisma.brand.delete({
      where: { id },
    });

    return {
      message: `Brand ${id} deleted successfully.`,
    };
  }

  private validateRequiredFields(body: CreateBrandDto) {
    if (!body.name?.trim()) {
      throw new BadRequestException('Brand name is required.');
    }

    if (!body.slug?.trim()) {
      throw new BadRequestException('Brand slug is required.');
    }
  }

  private buildCreateData(body: CreateBrandDto): Prisma.BrandCreateInput {
    return {
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: this.normalizeOptionalText(body.description),
      status: body.status ?? RECORD_STATUSES[0],
    };
  }

  private buildUpdateData(body: UpdateBrandDto): Prisma.BrandUpdateInput {
    return {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.slug !== undefined ? { slug: body.slug.trim() } : {}),
      ...(body.description !== undefined
        ? { description: this.normalizeOptionalText(body.description) }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    };
  }

  private normalizeOptionalText(value?: string | null) {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private async ensureBrandExists(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${id} not found.`);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'A brand with that unique value already exists.',
      );
    }

    throw error;
  }
}
