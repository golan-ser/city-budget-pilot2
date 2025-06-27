// API Configuration - Use Railway deployment URL
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'https://impartial-luck-production.up.railway.app';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },

  // Projects
  PROJECTS: '/api/projects',
  
  // Tabarim
  TABARIM: {
    LIST: '/api/tabarim',
    DETAILS: '/api/tabarim',
    CREATE: '/api/tabarim',
    UPDATE: '/api/tabarim',
    DELETE: '/api/tabarim',
  },
  
  // Dashboard
  DASHBOARD: {
    MAIN: '/api/dashboard/data',
    COMBINED: '/api/dashboard/combined',
    ANALYTICS: '/api/dashboard/analytics',
    EXPORT_PDF: '/api/dashboard/export/pdf',
  },
  
  // OpenAI Status
  OPENAI_STATUS: '/api/openai-status',

  // Smart Query
  SMART_QUERY: '/api/smart-query',

  // Reports
  REPORTS: {
    DASHBOARD: '/api/reports/reports-dashboard',
    PROJECTS: '/api/reports/projects',
    BUDGET_ITEMS: '/api/budget-items',
    BUDGET_ITEMS_REPORT: '/api/reports/budget-items',
    FULL_TABAR: '/api/reports/full-tabar',
    EXPORT_PDF: '/api/reports/export/pdf',
    EXPORT_EXCEL: '/api/reports/export/excel',
  },

  // Admin
  ADMIN: {
    PERMISSIONS: '/api/admin/permissions',
    USERS: '/api/admin/users',
    STATISTICS: '/api/admin/statistics',
    TENANTS: '/api/admin/tenants',
    SYSTEMS: '/api/admin/systems',
    ROLES: '/api/admin/roles',
    AUDIT_LOG: '/api/admin/audit',
    LOCKED_USERS: '/api/admin/locked-users',
    UNLOCK_USER: '/api/admin/unlock-user',
    UNLOCK_HISTORY: '/api/admin/unlock-history',
    RESET_PASSWORD: '/api/admin/reset-password',
    GENERATE_PASSWORD: '/api/admin/generate-password',
    PASSWORD_HISTORY: '/api/admin/password-history',
    PROFILE: '/api/admin/profile',
    EXPORT_PERMISSIONS_EXCEL: '/api/admin/export/permissions/excel',
    EXPORT_PERMISSIONS_PDF: '/api/admin/export/permissions/pdf',
    EXPORT_SYSTEM_OVERVIEW: '/api/admin/export/system-overview',
  },

  // Milestones
  MILESTONES: '/api/milestones',

  // Documents
  DOCUMENTS: '/api/documents',

  // Comments
  COMMENTS: '/api/comments',
} as const; 