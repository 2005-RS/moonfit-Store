import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import {
  isManagedUploadPath,
  removeLocalUploadFile,
} from '../../common/uploads/uploads.util';
import { toCsv } from '../../common/utils/csv.util';
import { PrismaService } from '../../prisma/prisma.service';
import { RECORD_STATUSES } from '../../common/domain/domain.constants';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AdminProductListQueryDto } from './dto/admin-product-list-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { EnhanceProductImageDto } from './dto/enhance-product-image.dto';
import { ProductImageAiService } from './product-image-ai.service';
import { UpdateProductDto } from './dto/update-product.dto';
import type { File as MulterFile } from 'multer';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly productImageAiService: ProductImageAiService,
  ) {}

  findAll() {
    return this.prisma.product.findMany({
      where: {
        status: RECORD_STATUSES[0],
      },
      include: {
        brand: true,
        category: true,
        goals: {
          orderBy: {
            goal: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAdminList(
    query: AdminProductListQueryDto,
  ): Promise<
    PaginatedResponse<
      Awaited<ReturnType<typeof this.prisma.product.findMany>>[number]
    >
  > {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const search = query.search?.trim();
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDirection = query.sortDirection ?? 'desc';

    const where: Prisma.ProductWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.brandId ? { brandId: query.brandId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { slug: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          brand: true,
          category: true,
          goals: {
            orderBy: {
              goal: 'asc',
            },
          },
        },
        orderBy: {
          [sortBy]: sortDirection,
        },
        skip,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, status: RECORD_STATUSES[0] },
      include: {
        brand: true,
        category: true,
        goals: {
          orderBy: {
            goal: 'asc',
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found.`);
    }

    return product;
  }

  async exportCsv() {
    const products = await this.prisma.product.findMany({
      include: {
        brand: true,
        category: true,
        goals: {
          orderBy: {
            goal: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return toCsv(
      [
        'id',
        'name',
        'slug',
        'brand',
        'category',
        'price',
        'stock',
        'expirationDate',
        'status',
      ],
      products.map((product) => [
        product.id,
        product.name,
        product.slug,
        product.brand?.name ?? '',
        product.category?.name ?? '',
        product.price,
        product.stock,
        product.expirationDate ?? '',
        product.status,
      ]),
    );
  }

  async create(
    body: CreateProductDto,
    actor?: AuthenticatedUser,
    uploadedImagePath?: string,
  ) {
    this.validateRequiredFields(body);
    await this.ensureRelationsExist(body.brandId, body.categoryId);

    try {
      const product = await this.prisma.product.create({
        data: this.buildCreateData(body, uploadedImagePath),
        include: {
          brand: true,
          category: true,
          goals: {
            orderBy: {
              goal: 'asc',
            },
          },
        },
      });

      await this.auditService.log({
        entityType: 'PRODUCT',
        entityId: product.id,
        action: 'PRODUCT_CREATED',
        summary: `Product ${product.name} was created.`,
        actor,
      });

      return product;
    } catch (error) {
      removeLocalUploadFile(uploadedImagePath ?? body.image);
      this.handlePrismaError(error);
    }
  }

  async update(
    id: string,
    body: UpdateProductDto,
    actor?: AuthenticatedUser,
    uploadedImagePath?: string,
  ) {
    const existingProduct = await this.ensureProductExists(id);
    await this.ensureRelationsExist(body.brandId, body.categoryId);
    const nextImagePath = this.resolveNextImagePath(
      existingProduct.image,
      body.image,
      uploadedImagePath,
    );

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: this.buildUpdateData(body, uploadedImagePath),
        include: {
          brand: true,
          category: true,
          goals: {
            orderBy: {
              goal: 'asc',
            },
          },
        },
      });

      await this.auditService.log({
        entityType: 'PRODUCT',
        entityId: product.id,
        action: 'PRODUCT_UPDATED',
        summary: `Product ${product.name} was updated.`,
        actor,
      });

      if (
        existingProduct.image &&
        nextImagePath &&
        existingProduct.image !== nextImagePath
      ) {
        removeLocalUploadFile(existingProduct.image);
      }

      return product;
    } catch (error) {
      if (
        nextImagePath &&
        nextImagePath !== existingProduct.image
      ) {
        removeLocalUploadFile(nextImagePath);
      }
      this.handlePrismaError(error);
    }
  }

  async enhanceImage(body: EnhanceProductImageDto, imageFile?: MulterFile) {
    const source =
      imageFile?.buffer && imageFile.originalname
        ? {
            buffer: imageFile.buffer,
            filename: imageFile.originalname,
            mimeType: imageFile.mimetype || 'image/png',
          }
        : await this.productImageAiService.loadSourceImage(body.imagePath ?? '');

    const image = await this.productImageAiService.enhanceProductImage(
      source,
      body.productName,
    );

    return {
      image,
      message:
        'Imagen mejorada con IA. Revisa la vista previa y luego guarda el producto para dejarla fija.',
    };
  }

  async remove(id: string, actor?: AuthenticatedUser) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: {
          select: { id: true },
          take: 1,
        },
        movements: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found.`);
    }

    if (product.orderItems.length > 0) {
      throw new BadRequestException(
        'This product cannot be deleted because it is already linked to one or more orders.',
      );
    }

    if (product.movements.length > 0) {
      throw new BadRequestException(
        'This product cannot be deleted because it still has inventory movements.',
      );
    }

    try {
      await this.prisma.product.delete({
        where: { id },
      });

      await this.auditService.log({
        entityType: 'PRODUCT',
        entityId: id,
        action: 'PRODUCT_DELETED',
        summary: `Product ${product.name} was deleted.`,
        actor,
      });

      removeLocalUploadFile(product.image);

      return {
        message: `Product ${id} deleted successfully.`,
      };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private validateRequiredFields(body: CreateProductDto) {
    if (!body.name?.trim()) {
      throw new BadRequestException('Product name is required.');
    }

    if (!body.slug?.trim()) {
      throw new BadRequestException('Product slug is required.');
    }

    if (
      body.price === undefined ||
      body.price === null ||
      Number.isNaN(body.price)
    ) {
      throw new BadRequestException('Product price is required.');
    }
  }

  private buildCreateData(
    body: CreateProductDto,
    uploadedImagePath?: string,
  ): Prisma.ProductCreateInput {
    return {
      name: body.name.trim(),
      slug: body.slug.trim(),
      description: this.normalizeOptionalText(body.description),
      price: body.price,
      previousPrice: body.previousPrice ?? null,
      stock: body.stock ?? 0,
      expirationDate: this.normalizeOptionalDate(body.expirationDate),
      badge: this.normalizeOptionalText(body.badge),
      image: this.normalizeImageReference(uploadedImagePath ?? body.image),
      status: body.status ?? RECORD_STATUSES[0],
      brand: body.brandId ? { connect: { id: body.brandId } } : undefined,
      category: body.categoryId
        ? { connect: { id: body.categoryId } }
        : undefined,
      goals: body.goals?.length
        ? {
            create: this.normalizeGoals(body.goals).map((goal) => ({ goal })),
          }
        : undefined,
    };
  }

  private buildUpdateData(
    body: UpdateProductDto,
    uploadedImagePath?: string,
  ): Prisma.ProductUpdateInput {
    return {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.slug !== undefined ? { slug: body.slug.trim() } : {}),
      ...(body.description !== undefined
        ? { description: this.normalizeOptionalText(body.description) }
        : {}),
      ...(body.price !== undefined ? { price: body.price } : {}),
      ...(body.previousPrice !== undefined
        ? { previousPrice: body.previousPrice }
        : {}),
      ...(body.stock !== undefined ? { stock: body.stock } : {}),
      ...(body.expirationDate !== undefined
        ? { expirationDate: this.normalizeOptionalDate(body.expirationDate) }
        : {}),
      ...(body.badge !== undefined
        ? { badge: this.normalizeOptionalText(body.badge) }
        : {}),
      ...(uploadedImagePath !== undefined
        ? { image: uploadedImagePath }
        : body.image !== undefined
          ? { image: this.normalizeImageReference(body.image) }
          : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.brandId !== undefined
        ? body.brandId
          ? { brand: { connect: { id: body.brandId } } }
          : { brand: { disconnect: true } }
        : {}),
      ...(body.categoryId !== undefined
        ? body.categoryId
          ? { category: { connect: { id: body.categoryId } } }
          : { category: { disconnect: true } }
        : {}),
      ...(body.goals !== undefined
        ? {
            goals: {
              deleteMany: {},
              create: this.normalizeGoals(body.goals).map((goal) => ({ goal })),
            },
          }
        : {}),
    };
  }

  private normalizeOptionalText(value?: string | null) {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private normalizeOptionalDate(value?: string | null) {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private normalizeImageReference(value?: string | null) {
    const normalizedValue = this.normalizeOptionalText(value);

    if (!normalizedValue) {
      return null;
    }

    try {
      const url = new URL(normalizedValue);
      return isManagedUploadPath(url.pathname) ? url.pathname : normalizedValue;
    } catch {
      return normalizedValue;
    }
  }

  private resolveNextImagePath(
    currentImage: string | null | undefined,
    bodyImage?: string | null,
    uploadedImagePath?: string,
  ) {
    if (uploadedImagePath) {
      return uploadedImagePath;
    }

    if (bodyImage !== undefined) {
      return this.normalizeImageReference(bodyImage);
    }

    return currentImage ?? null;
  }

  private normalizeGoals(goals: string[]) {
    return Array.from(
      new Set(
        goals.map((goal) => goal.trim()).filter((goal) => goal.length > 0),
      ),
    );
  }

  private async ensureProductExists(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, image: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found.`);
    }

    return product;
  }

  private async ensureRelationsExist(
    brandId?: string | null,
    categoryId?: string | null,
  ) {
    if (brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { id: true },
      });

      if (!brand) {
        throw new BadRequestException(`Brand ${brandId} does not exist.`);
      }
    }

    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      });

      if (!category) {
        throw new BadRequestException(`Category ${categoryId} does not exist.`);
      }
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'A product with that unique value already exists.',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new BadRequestException(
        'This product cannot be deleted because it is still linked to other records.',
      );
    }

    throw error;
  }
}
