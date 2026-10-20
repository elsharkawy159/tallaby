import type { SectionDefinition } from '@/components/sections/registry.types'
import { authLoginSection } from '@/components/sections/auth/auth-login'
import { authRegisterSection } from '@/components/sections/auth/auth-register'
import { authForgotPasswordSection } from '@/components/sections/auth/auth-forgot-password'
import { authResetPasswordSection } from '@/components/sections/auth/auth-reset-password'
import { authProfileSection } from '@/components/sections/auth/auth-profile'
import { authAccountSection } from '@/components/sections/auth/auth-account'
import {
  authLoginButtonSection,
  authLogoutButtonSection,
} from '@/components/sections/auth/auth-buttons'
import { authProtectedContentSection } from '@/components/sections/auth/auth-protected-content'

/**
 * Website authentication blocks. Every one of them reads the site's
 * Authentication settings at render time, so switching a provider off in the
 * dashboard removes it from these blocks without touching the page.
 */
export const AUTH_SECTION_DEFINITIONS: SectionDefinition[] = [
  authLoginSection,
  authRegisterSection,
  authForgotPasswordSection,
  authResetPasswordSection,
  authAccountSection,
  authProfileSection,
  authProtectedContentSection,
  authLoginButtonSection,
  authLogoutButtonSection,
]

export {
  authLoginSection,
  authRegisterSection,
  authForgotPasswordSection,
  authResetPasswordSection,
  authAccountSection,
  authProfileSection,
  authProtectedContentSection,
  authLoginButtonSection,
  authLogoutButtonSection,
}
