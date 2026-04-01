import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import {
  productImagesDir,
  uploadsDir,
} from '../../common/uploads/uploads.util';

type LoadedImageSource = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

@Injectable()
export class ProductImageAiService {
  private readonly logger = new Logger(ProductImageAiService.name);
  private readonly endpoint = 'https://api.openai.com/v1/images/edits';
  private readonly model = process.env.OPENAI_IMAGE_MODEL?.trim() || 'gpt-image-1.5';

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  }

  async enhanceProductImage(
    source: LoadedImageSource,
    productName?: string,
  ) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!apiKey) {
      throw new BadRequestException(
        'La mejora de imagen con IA no esta configurada. Agrega OPENAI_API_KEY en el backend.',
      );
    }

    const formData = new FormData();
    formData.append('model', this.model);
    formData.append(
      'prompt',
      this.buildEnhancementPrompt(productName),
    );
    formData.append(
      'image',
      new Blob([new Uint8Array(source.buffer)], { type: source.mimeType }),
      source.filename,
    );
    formData.append('input_fidelity', 'high');
    formData.append('background', 'opaque');
    formData.append('output_format', 'png');

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          data?: Array<{
            b64_json?: string;
            url?: string;
          }>;
          error?: {
            message?: string;
          };
        }
      | null;

    if (!response.ok) {
      const message =
        payload?.error?.message ??
        'No se pudo mejorar la imagen con IA en este momento.';
      this.logger.warn(`OpenAI image edit failed: ${message}`);
      throw new BadRequestException(message);
    }

    const result = payload?.data?.[0];

    if (!result) {
      throw new BadRequestException(
        'La IA no devolvio una imagen mejorada para este producto.',
      );
    }

    let outputBuffer: Buffer;

    if (result.b64_json) {
      outputBuffer = Buffer.from(result.b64_json, 'base64');
    } else if (result.url) {
      const downloadedImage = await fetch(result.url);

      if (!downloadedImage.ok) {
        throw new BadRequestException(
          'La imagen mejorada se genero, pero no se pudo descargar.',
        );
      }

      outputBuffer = Buffer.from(await downloadedImage.arrayBuffer());
    } else {
      throw new BadRequestException(
        'La IA no devolvio datos de imagen utilizables.',
      );
    }

    const filename = this.buildOutputFilename('.png');
    const absolutePath = join(productImagesDir, filename);
    await writeFile(absolutePath, outputBuffer);

    return `/uploads/product-images/${filename}`;
  }

  async loadSourceImage(imagePath: string) {
    const normalizedPath = imagePath.trim();

    if (!normalizedPath) {
      throw new BadRequestException(
        'Debes seleccionar o guardar una imagen antes de mejorarla con IA.',
      );
    }

    if (normalizedPath.startsWith('/uploads/')) {
      return this.loadLocalUpload(normalizedPath);
    }

    if (/^https?:\/\//i.test(normalizedPath)) {
      return this.loadRemoteImage(normalizedPath);
    }

    throw new BadRequestException(
      'La imagen actual no tiene un formato compatible para la mejora con IA.',
    );
  }

  private async loadLocalUpload(publicPath: string): Promise<LoadedImageSource> {
    const relativePath = publicPath.replace(/^\/uploads\//, '');
    const absolutePath = normalize(join(uploadsDir, relativePath));

    if (!absolutePath.startsWith(normalize(uploadsDir))) {
      throw new BadRequestException(
        'La imagen local seleccionada no es valida para la mejora con IA.',
      );
    }

    const buffer = await readFile(absolutePath);
    const extension = extname(absolutePath) || '.png';

    return {
      buffer,
      filename: `source${extension}`,
      mimeType: this.resolveMimeType(extension),
    };
  }

  private async loadRemoteImage(imageUrl: string): Promise<LoadedImageSource> {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new BadRequestException(
        'No se pudo descargar la imagen actual para mejorarla con IA.',
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const url = new URL(imageUrl);
    const extension = extname(url.pathname) || '.png';

    return {
      buffer,
      filename: `source${extension}`,
      mimeType:
        response.headers.get('content-type') || this.resolveMimeType(extension),
    };
  }

  private buildEnhancementPrompt(productName?: string) {
    const productContext = productName?.trim()
      ? `Producto: ${productName.trim()}. `
      : '';

    return `${productContext}Mejora esta foto para un ecommerce real de suplementos e implementos deportivos. Conserva el producto real, su empaque, colores y proporciones. Mejora la iluminacion, nitidez y limpieza visual. Usa fondo de estudio claro, encuadre centrado y acabado premium de catalogo. No agregues texto, marcas nuevas, manos, personas ni productos extra.`;
  }

  private buildOutputFilename(extension: string) {
    const safeTimestamp = Date.now().toString(36);
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    return `product-ai-${safeTimestamp}-${randomSuffix}${extension}`;
  }

  private resolveMimeType(extension: string) {
    switch (extension.toLowerCase()) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      default:
        return 'image/png';
    }
  }
}
