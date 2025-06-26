// API Configuration
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || '/api';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },

  // Projects
  PROJECTS: '/projects',
  
  // Tabarim
  TABARIM: '/tabarim',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // OpenAI Status
  OPENAI_STATUS: '/openai-status',

  // Smart Query
  SMART_QUERY: '/smart-query',

  // Reports
  REPORTS: {
    DASHBOARD: '/reports/dashboard',
    PROJECTS: '/reports/projects',
    BUDGET_ITEMS: '/budget-items',
    BUDGET_ITEMS_REPORT: '/reports/budget-items',
    FULL_TABAR: '/reports/full-tabar',
    EXPORT_PDF: '/reports/export/pdf',
    EXPORT_EXCEL: '/reports/export/excel',
  },

  // Admin
  ADMIN: {
    PERMISSIONS: '/admin/permissions',
    USERS: '/admin/users',
    STATISTICS: '/admin/statistics',
    TENANTS: '/admin/tenants',
    SYSTEMS: '/admin/systems',
    ROLES: '/admin/roles',
    AUDIT_LOG: '/admin/audit-log',
  },

  // Milestones
  MILESTONES: '/milestones',

  // Documents
  DOCUMENTS: '/documents',

  // Comments
  COMMENTS: '/comments',
} as const; 