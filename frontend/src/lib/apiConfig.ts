// API Configuration - Force production URL for Vercel deployment
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')
    ? 'https://impartial-luck-production.up.railway.app'
    : import.meta.env.MODE === 'production' 
      ? 'https://impartial-luck-production.up.railway.app'
      : 'http://localhost:3000');

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
  TABARIM: '/api/tabarim',
  
  // Dashboard
  DASHBOARD: '/api/dashboard',
  
  // OpenAI Status
  OPENAI_STATUS: '/api/openai-status',

  // Smart Query
  SMART_QUERY: '/api/smart-query',

  // Reports
  REPORTS: {
    DASHBOARD: '/api/reports/dashboard',
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
  },

  // Milestones
  MILESTONES: '/api/milestones',

  // Documents
  DOCUMENTS: '/api/documents',

  // Comments
  COMMENTS: '/api/comments',
} as const; 