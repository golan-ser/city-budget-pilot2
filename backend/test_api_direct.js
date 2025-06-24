import adminController from './controllers/adminController.js';

// Mock request and response objects
const mockReq = {
  query: { tenantId: 1, systemId: 1 },
  user: { role: 'demo', user_id: 1, tenant_id: 1 }
};

const mockRes = {
  json: (data) => {
    console.log('Success response:', data);
  },
  status: (code) => ({
    json: (data) => {
      console.log(`Error ${code}:`, data);
    }
  })
};

async function testPermissionsMatrixAPI() {
  try {
    console.log('Testing permissions matrix API directly...');
    await adminController.getPermissionsMatrix(mockReq, mockRes);
  } catch (error) {
    console.error('Direct API test error:', error);
  }
}

testPermissionsMatrixAPI(); 