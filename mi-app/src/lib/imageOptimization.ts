const DEFAULT_MAX_DIMENSION = 1200
const DEFAULT_OUTPUT_TYPE = 'image/jpeg'
const DEFAULT_QUALITY = 0.88

type OptimizationResult = {
  file: File
  width: number
  height: number
  beforeSize: number
  afterSize: number
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No se pudo generar la imagen optimizada.'))
        return
      }

      resolve(blob)
    }, type, quality)
  })
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(
        new Error(
          'No se pudo cargar la imagen para optimizarla. Prueba subiendola de nuevo desde tu computadora.',
        ),
      )
    image.src = source
  })
}

function buildOptimizedName(originalName: string) {
  const cleanBaseName = originalName.replace(/\.[^.]+$/, '') || 'producto'
  return `${cleanBaseName}-optimizada.jpg`
}

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${bytes} B`
}

export async function optimizeProductImageFile(file: File): Promise<OptimizationResult> {
  const sourceUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(sourceUrl)
    const sourceSide = Math.min(image.width, image.height)
    const sourceX = Math.max(0, (image.width - sourceSide) / 2)
    const sourceY = Math.max(0, (image.height - sourceSide) / 2)
    const targetSide = Math.max(600, Math.min(DEFAULT_MAX_DIMENSION, sourceSide))
    const canvas = document.createElement('canvas')
    canvas.width = targetSide
    canvas.height = targetSide

    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Tu navegador no pudo preparar la optimizacion de la imagen.')
    }

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, targetSide, targetSide)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.filter = 'brightness(1.02) contrast(1.06) saturate(1.05)'
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceSide,
      sourceSide,
      0,
      0,
      targetSide,
      targetSide,
    )

    const blob = await toBlob(canvas, DEFAULT_OUTPUT_TYPE, DEFAULT_QUALITY)
    const optimizedFile = new File([blob], buildOptimizedName(file.name), {
      type: DEFAULT_OUTPUT_TYPE,
      lastModified: Date.now(),
    })

    return {
      file: optimizedFile,
      width: targetSide,
      height: targetSide,
      beforeSize: file.size,
      afterSize: optimizedFile.size,
    }
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

export async function optimizeProductImageFromUrl(
  imageUrl: string,
  suggestedName = 'producto.jpg',
) {
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error('No se pudo descargar la imagen actual para optimizarla.')
  }

  const blob = await response.blob()
  const sourceFile = new File([blob], suggestedName, {
    type: blob.type || 'image/jpeg',
    lastModified: Date.now(),
  })

  return optimizeProductImageFile(sourceFile)
}
