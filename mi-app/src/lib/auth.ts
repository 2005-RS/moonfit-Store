import { translateApiMessage } from './errorMessages'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const AUTH_STORAGE_KEY = 'moonfit_session'
const AUTH_EVENT_NAME = 'moonfit-auth-changed'
const AUTH_NOTICE_STORAGE_KEY = 'moonfit_auth_notice'

const AUTH_NOTICES = {
  session_expired:
    'Tu sesion expiro o el token ya no es valido. Vuelve a iniciar sesion para continuar.',
  admin_required:
    'Necesitas una cuenta ADMIN para entrar al panel administrativo.',
} as const

export type AuthUser = {
  id: string
  email: string
  role: string
  customer?: {
    id: string
    name: string
    email: string
    phone?: string | null
    city?: string | null
    status: string
    creditApproved?: boolean
    creditLimit?: number
    creditDays?: number
  } | null
}

export type AuthSession = {
  accessToken: string
  user: AuthUser
}

export type AuthProfile = {
  id: string
  email: string
  role: string
  customer?: AuthUser['customer']
}

type AuthSessionPreviewResponse = {
  authenticated: boolean
  user: AuthProfile
}

type LoginPayload = {
  email: string
  password: string
}

export function getStoredAuthSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AuthSession
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function getAuthToken() {
  return getStoredAuthSession()?.accessToken ?? null
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  window.sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT_NAME))
}

export function clearAuthSession(reason?: keyof typeof AUTH_NOTICES) {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  if (reason) {
    window.sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, AUTH_NOTICES[reason])
  }
  window.dispatchEvent(new Event(AUTH_EVENT_NAME))
}

export function readAndClearAuthNotice() {
  if (typeof window === 'undefined') {
    return ''
  }

  const notice = window.sessionStorage.getItem(AUTH_NOTICE_STORAGE_KEY) ?? ''
  if (notice) {
    window.sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY)
  }

  return notice
}

export async function loginUser(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
    }),
  })

  if (!response.ok) {
    let message = 'No se pudo iniciar sesion.'

    try {
      const errorData = (await response.json()) as { message?: string | string[] }
      message = translateApiMessage(errorData.message, message)
    } catch {
      message = translateApiMessage(response.statusText || message, message)
    }

    throw new Error(message)
  }

  return (await response.json()) as AuthSession
}

export async function registerCustomer(payload: {
  name: string
  email: string
  password: string
  phone?: string
  city?: string
}) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      email: payload.email.trim(),
      password: payload.password,
      phone: payload.phone?.trim() || undefined,
      city: payload.city?.trim() || undefined,
    }),
  })

  if (!response.ok) {
    let message = 'No se pudo crear la cuenta.'

    try {
      const errorData = (await response.json()) as { message?: string | string[] }
      message = translateApiMessage(errorData.message, message)
    } catch {
      message = translateApiMessage(response.statusText || message, message)
    }

    throw new Error(message)
  }

  return (await response.json()) as AuthSession
}

export async function fetchCurrentUserProfile() {
  const token = getAuthToken()

  if (!token) {
    return null
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession('session_expired')
    }

    let message = 'No se pudo validar la sesion actual.'

    try {
      const errorData = (await response.json()) as { message?: string | string[] }
      message = translateApiMessage(errorData.message, message)
    } catch {
      message = translateApiMessage(response.statusText || message, message)
    }

    throw new Error(message)
  }

  const payload = (await response.json()) as AuthSessionPreviewResponse
  return payload.user
}
