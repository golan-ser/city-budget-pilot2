// API Configuration - Use Railway deployment URL
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'https://impartial-luck-production.up.railway.app';

console.log('🔗 API_BASE_URL configured as:', API_BASE_URL);

// Test server connectivity (only in development)
if (import.meta.env.MODE === 'development') {
  console.log('🧪 Development mode - testing API connectivity...');
}

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
    COMBINED: '/api/dashboard',
    ANALYTICS: '/api/dashboard/analytics',
    EXPORT_PDF: '/api/dashboard/export/pdf',
  },
  
  // OpenAI Status
  OPENAI_STATUS: '/api/openai-status',

  // Smart Query
  SMART_QUERY: '/api/smart-query',

  // Reports
  REPORTS: {
    BASE: '/api/reports',
    DASHBOARD: '/api/reports/reports-dashboard',
    BUDGET_ITEMS: '/api/reports/budget-items',
    BUDGET_ITEMS_EXPORT_PDF: '/api/reports/budget-items/export-pdf',
    FULL_TABAR: '/api/reports/full-tabar',
    FULL_TABAR_EXPORT_PDF: '/api/reports/full-tabar/export-pdf',
    TABAR_BUDGET: '/api/reports/tabar-budget',
    TABAR_BUDGET_EXPORT_PDF: '/api/reports/tabar-budget/export-pdf',
    INVOICES: '/api/reports/invoices',
    MINISTRY: '/api/reports/ministry',
    CASH_FLOW: '/api/reports/cash-flow',
    BUDGET_EXECUTION: '/api/reports/budget-execution',
    EXECUTION: '/api/reports/execution',
    EXPORT: '/api/reports/export'
  },

  // Admin
  ADMIN: {
    PERMISSIONS: '/api/admin/permissions',
    USERS: '/api/admin/users',
    STATISTICS: '/api/admin/statistics',
    RECENT_ACTIVITY: '/api/admin/recent-activity',
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