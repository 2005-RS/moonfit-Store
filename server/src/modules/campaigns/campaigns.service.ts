import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RECORD_STATUSES } from '../../common/domain/domain.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.campaign.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findActive() {
    return this.prisma.campaign.findMany({
      where: {
        status: RECORD_STATUSES[0],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(body: CreateCampaignDto) {
    this.validateRequiredFields(body);

    try {
      return await this.prisma.campaign.create({
        data: this.buildCreateData(body),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: string, body: UpdateCampaignDto) {
    await this.ensureCampaignExists(id);

    try {
      return await this.prisma.campaign.update({
        where: { id },
        data: this.buildUpdateData(body),
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await this.ensureCampaignExists(id);

    await this.prisma.campaign.delete({
      where: { id },
    });

    return {
      message: `Campaign ${id} deleted successfully.`,
    };
  }

  private validateRequiredFields(body: CreateCampaignDto) {
    if (!body.title?.trim()) {
      throw new BadRequestException('Campaign title is required.');
    }

    if (!body.subtitle?.trim()) {
      throw new BadRequestException('Campaign subtitle is required.');
    }

    if (!body.ctaLabel?.trim()) {
      throw new BadRequestException('Campaign CTA label is required.');
    }

    if (!body.ctaHref?.trim()) {
      throw new BadRequestException('Campaign CTA href is required.');
    }

    if (!body.image?.trim()) {
      throw new BadRequestException('Campaign image is required.');
    }
  }

  private buildCreateData(body: CreateCampaignDto): Prisma.CampaignCreateInput {
    return {
      title: body.title.trim(),
      subtitle: body.subtitle.trim(),
      ctaLabel: body.ctaLabel.trim(),
      ctaHref: body.ctaHref.trim(),
      image: body.image.trim(),
      placement: body.placement,
      discountTag: this.normalizeOptionalText(body.discountTag),
      status: body.status ?? RECORD_STATUSES[0],
    };
  }

  private buildUpdateData(body: UpdateCampaignDto): Prisma.CampaignUpdateInput {
    return {
      ...(body.title !== undefined ? { title: body.title.trim() } : {}),
      ...(body.subtitle !== undefined
        ? { subtitle: body.subtitle.trim() }
        : {}),
      ...(body.ctaLabel !== undefined
        ? { ctaLabel: body.ctaLabel.trim() }
        : {}),
      ...(body.ctaHref !== undefined ? { ctaHref: body.ctaHref.trim() } : {}),
      ...(body.image !== undefined ? { image: body.image.trim() } : {}),
      ...(body.placement !== undefined ? { placement: body.placement } : {}),
      ...(body.discountTag !== undefined
        ? { discountTag: this.normalizeOptionalText(body.discountTag) }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    };
  }

  private normalizeOptionalText(value?: string | null) {
    const trimmedValue = value?.trim();
    return trimmedValue ? trimmedValue : null;
  }

  private async ensureCampaignExists(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found.`);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'A campaign with that unique value already exists.',
      );
    }

    throw error;
  }
}
