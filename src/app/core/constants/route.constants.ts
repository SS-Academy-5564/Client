export const ROUTES = {
  OVERVIEW: '/overview',
  MONITORS: '/monitors',
  MEMBERS: '/members',

  LOGIN: '/login',
  REGISTER: '/register',
  CHECK_EMAIL: '/check-email',
  VERIFY_EMAIL: '/verify-email',

  CREATE_ORGANIZATION: '/create-organization',

  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_CODE: '/verify-code',
  RESET_PASSWORD: '/reset-password',
  RESET_SUCCESS: '/reset-success',

  ERROR: (code: string | number) => `/error/${code}`,
} as const;
