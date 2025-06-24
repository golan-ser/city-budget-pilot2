// 🔐 RBAC: Mapping של Routes ל-Page IDs
// כל route במערכת חייב להיות מוצמד ל-page_id מטבלת system_pages

export const PAGE_IDS = {
  // Dashboard & Home
  DASHBOARD: 1,
  HOME: 2,
  
  // Reports & Analytics
  REPORTS: 3,
  BUDGET_REPORTS: 4,
  EXECUTION_REPORTS: 5,
  ANALYTICS: 6,
  
  // Projects Management
  PROJECTS: 7,
  PROJECT_DETAILS: 8,
  PROJECT_DOCUMENTS: 9,
  
  // Tabarim Management
  TABARIM: 10,
  TABAR_DETAILS: 11,
  TABAR_DOCUMENTS: 12,
  
  // Financial Management
  BUDGET_ITEMS: 13,
  TRANSACTIONS: 14,
  FUNDING_SOURCES: 15,
  
  // System Administration
  USER_MANAGEMENT: 16,
  ROLE_MANAGEMENT: 17,
  PERMISSIONS: 18,
  SYSTEM_SETTINGS: 19,
  
  // Documents & Files
  DOCUMENT_MANAGEMENT: 20,
  FILE_UPLOADS: 21,
  
  // Advanced Features
  SMART_QUERY: 22,
  OCR_PROCESSING: 23,
  PDF_EXPORTS: 24,
  
  // System Administration (Admin)
  ADMIN_DASHBOARD: 25,
  TENANT_MANAGEMENT: 26,
  SYSTEM_MANAGEMENT: 27,
  ADMIN_USER_MANAGEMENT: 28,
  ADMIN_ROLE_MANAGEMENT: 29,
  ADMIN_PERMISSIONS: 30,
  AUDIT_LOG: 31
};

// מיפוי Routes ל-Page IDs
export const ROUTE_TO_PAGE = {
  // Dashboard Routes
  '/api/dashboard': PAGE_IDS.DASHBOARD,
  '/api/dashboard/enhanced': PAGE_IDS.DASHBOARD,
  
  // Reports Routes
  '/api/reports': PAGE_IDS.REPORTS,
  '/api/reports/budget-items': PAGE_IDS.BUDGET_REPORTS,
  '/api/reports/execution': PAGE_IDS.EXECUTION_REPORTS,
  '/api/reports/budget-execution': PAGE_IDS.BUDGET_REPORTS,
  '/api/reports/invoices': PAGE_IDS.REPORTS,
  '/api/reports/ministry': PAGE_IDS.REPORTS,
  '/api/reports/cash-flow': PAGE_IDS.REPORTS,
  '/api/reports/full-tabar/export-pdf': PAGE_IDS.REPORTS,
  '/api/reports/tabar-budget/export-pdf': PAGE_IDS.BUDGET_REPORTS,
  
  // Analytics Routes
  '/api/analytics': PAGE_IDS.ANALYTICS,
  
  // Projects Routes
  '/api/projects': PAGE_IDS.PROJECTS,
  '/api/projects/:id': PAGE_IDS.PROJECT_DETAILS,
  '/api/projects/:id/documents': PAGE_IDS.PROJECT_DOCUMENTS,
  '/api/projects/:id/analytics': PAGE_IDS.ANALYTICS,
  '/api/projects/:id/export-pdf': PAGE_IDS.PROJECTS,
  
  // Tabarim Routes
  '/api/tabarim': PAGE_IDS.TABARIM,
  '/api/tabarim/:id': PAGE_IDS.TABAR_DETAILS,
  '/api/tabarim/:id/documents': PAGE_IDS.TABAR_DOCUMENTS,
  '/api/tabarim/:id/items': PAGE_IDS.BUDGET_ITEMS,
  '/api/tabarim/:id/transactions': PAGE_IDS.TRANSACTIONS,
  '/api/tabarim/:id/funding': PAGE_IDS.FUNDING_SOURCES,
  '/api/tabarim/export-pdf': PAGE_IDS.TABARIM,
  '/api/tabarim/ocr': PAGE_IDS.OCR_PROCESSING,
  
  // Documents Routes
  '/api/documents': PAGE_IDS.DOCUMENT_MANAGEMENT,
  
  // Smart Query Routes
  '/api/smart-query': PAGE_IDS.SMART_QUERY,
  
  // Admin Routes (System Administration)
  '/api/admin': PAGE_IDS.ADMIN_DASHBOARD,
  '/api/admin/stats': PAGE_IDS.ADMIN_DASHBOARD,
  '/api/admin/health': PAGE_IDS.ADMIN_DASHBOARD,
  '/api/admin/tenants': PAGE_IDS.TENANT_MANAGEMENT,
  '/api/admin/tenants/:id': PAGE_IDS.TENANT_MANAGEMENT,
  '/api/admin/systems': PAGE_IDS.SYSTEM_MANAGEMENT,
  '/api/admin/tenants/:tenantId/systems': PAGE_IDS.SYSTEM_MANAGEMENT,
  '/api/admin/tenants/:tenantId/systems/:systemId': PAGE_IDS.SYSTEM_MANAGEMENT,
  '/api/admin/systems/:systemId/pages': PAGE_IDS.SYSTEM_MANAGEMENT,
  '/api/admin/tenants/:tenantId/roles': PAGE_IDS.ADMIN_ROLE_MANAGEMENT,
  '/api/admin/roles': PAGE_IDS.ADMIN_ROLE_MANAGEMENT,
  '/api/admin/roles/:id': PAGE_IDS.ADMIN_ROLE_MANAGEMENT,
  '/api/admin/tenants/:tenantId/users': PAGE_IDS.ADMIN_USER_MANAGEMENT,
  '/api/admin/users/:userId/role': PAGE_IDS.ADMIN_USER_MANAGEMENT,
  '/api/admin/permissions': PAGE_IDS.ADMIN_PERMISSIONS,
  '/api/admin/permissions/matrix': PAGE_IDS.ADMIN_PERMISSIONS,
  '/api/admin/audit': PAGE_IDS.AUDIT_LOG,
  
  // Other Routes
  '/api/permissions': PAGE_IDS.PERMISSIONS,
  '/api/departments': PAGE_IDS.SYSTEM_SETTINGS
};

// פונקציה להחזרת page_id לפי route
export const getPageIdFromRoute = (route) => {
  // נורמליזציה של הroute - החלפת IDs עם :id
  const normalizedRoute = route.replace(/\/\d+/g, '/:id');
  
  return ROUTE_TO_PAGE[normalizedRoute] || null;
};

// פונקציה לבדיקה אם route דורש אימות
export const requiresAuthentication = (route) => {
  // Routes שלא דורשים אימות
  const publicRoutes = [
    '/health',
    '/api/auth/login',
    '/api/auth/register',
    '/api/admin/health',
    '/api/admin/stats'
  ];
  
  return !publicRoutes.includes(route);
}; 