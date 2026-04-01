import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RECORD_STATUSES } from '../../common/domain/domain.constants';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
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
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found.`);
    }

    return category;
  }

  async create(body: CreateCategoryDto) {
    this.validateRequiredFields(body);

    try {
      return await this.prisma.category.create({
        data: this.buildCreateData(body),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: string, body: UpdateCategoryDto) {
    await this.ensureCategoryExists(id);

    try {
      return await this.prisma.category.update({
        where: { id },
        data: this.buildUpdateData(body),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found.`);
    }

    if (category.products.length > 0) {
      throw new BadRequestException(
        'This category cannot be deleted because it still has products assigned.',
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return {
      message: `Category ${id} deleted successfully.`,
    };
  }

  private validateRequiredFields(body: CreateCategoryDto) {
    if (!body.name?.trim()) {
      throw new BadRequestException('Category name is required.');
    }

    if (!body.slug?.trim()) {
      throw new BadRequestException('Category slug is required.');
    }
  }

  private buildCreateData(body: CreateCategoryDto): Prisma.CategoryCreateInput {
    return {
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: this.normalizeOptionalText(body.description),
      status: body.status ?? RECORD_STATUSES[0],
    };
  }

  private buildUpdateData(body: UpdateCategoryDto): Prisma.CategoryUpdateInput {
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

  private async ensureCategoryExists(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found.`);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'A category with that name or slug already exists.',
      );
    }

    throw error;
  }
}
