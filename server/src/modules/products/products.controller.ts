import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { File as MulterFile } from 'multer';
import { productImageStorage } from '../../common/uploads/uploads.util';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AdminProductListQueryDto } from './dto/admin-product-list-query.dto';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { EnhanceProductImageDto } from './dto/enhance-product-image.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List products with admin filters and pagination' })
  findAdminList(@Query() query: AdminProductListQueryDto) {
    return this.productsService.findAdminList(query);
  }

  @Get('admin/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="products.csv"')
  @ApiOperation({ summary: 'Export products as CSV (admin only)' })
  exportCsv() {
    return this.productsService.exportCsv();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('imageFile', {
      storage: productImageStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a product (admin only)' })
  create(
    @Body() body: CreateProductDto,
    @UploadedFile() imageFile: MulterFile | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const imagePath = imageFile?.filename
      ? `/uploads/product-images/${imageFile.filename}`
      : undefined;

    return this.productsService.create(body, user, imagePath);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('imageFile', {
      storage: productImageStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a product (admin only)' })
  update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @UploadedFile() imageFile: MulterFile | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const imagePath = imageFile?.filename
      ? `/uploads/product-images/${imageFile.filename}`
      : undefined;

    return this.productsService.update(id, body, user, imagePath);
  }

  @Post('admin/enhance-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileInterceptor('imageFile', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiBearerAuth('bearer')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enhance a product image with AI (admin only)' })
  enhanceImage(
    @Body() body: EnhanceProductImageDto,
    @UploadedFile() imageFile: MulterFile | undefined,
  ) {
    return this.productsService.enhanceImage(body, imageFile);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete a product (admin only)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.productsService.remove(id, user);
  }
}
