import { clearAuthSession, getAuthToken } from './auth'
import { translateApiMessage } from './errorMessages'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  statusCode: number
  error: string

  constructor(message: string, statusCode: number, error: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.error = error
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const token = getAuthToken()
  const isFormData =
    typeof FormData !== 'undefined' && init?.body instanceof FormData
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
      ...init,
    })
  } catch (error) {
    throw new ApiError(
      'No se pudo conectar con el backend. Revisa si el servidor esta levantado en el puerto 3000.',
      0,
      error instanceof Error ? error.name : 'Network Error',
    )
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession('session_expired')
    }

    let message = 'No se pudo completar la solicitud.'
    let errorLabel = 'Request Failed'
    let statusCode = response.status

    try {
      const errorData = (await response.json()) as {
        message?: string | string[]
        error?: string
        statusCode?: number
      }
      message = translateApiMessage(errorData.message, message)
      errorLabel = errorData.error ?? errorLabel
      statusCode = errorData.statusCode ?? statusCode
    } catch {
      message = translateApiMessage(response.statusText || message, message)
    }

    throw new ApiError(message, statusCode, errorLabel)
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  postForm: <T>(path: string, body: FormData) =>
    request<T>(path, {
      method: 'POST',
      body,
    }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  patchForm: <T>(path: string, body: FormData) =>
    request<T>(path, {
      method: 'PATCH',
      body,
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: 'DELETE',
    }),
}

export { API_BASE_URL }
