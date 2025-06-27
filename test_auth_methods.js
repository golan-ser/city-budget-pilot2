const http = require('http');

// 🔐 AUTH METHODS TEST
console.log('🔐 Testing Different Authentication Methods...\n');

const DEMO_TOKEN = 'DEMO_SECURE_TOKEN_2024';
const BASE_URL = 'http://localhost:3000';

// Test different auth methods
const authMethods = [
  {
    name: 'Bearer Token',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` }
  },
  {
    name: 'x-demo-token Header',
    headers: { 'x-demo-token': DEMO_TOKEN }
  },
  {
    name: 'Both Headers',
    headers: { 
      'Authorization': `Bearer ${DEMO_TOKEN}`,
      'x-demo-token': DEMO_TOKEN 
    }
  }
];

const testEndpoints = [
  '/api/tabarim',
  '/api/dashboard',
  '/api/reports/dashboard',
  '/api/admin/statistics'
];

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: null, rawData: data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

async function testAuthMethod(authMethod, endpoint) {
  try {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authMethod.headers
      }
    };
    
    const response = await makeRequest(`${BASE_URL}${endpoint}`, options);
    return {
      method: authMethod.name,
      endpoint,
      status: response.statusCode,
      success: response.statusCode >= 200 && response.statusCode < 300,
      error: response.data?.error || null
    };
  } catch (error) {
    return {
      method: authMethod.name,
      endpoint,
      status: 'ERROR',
      success: false,
      error: error.message
    };
  }
}

async function runAuthTests() {
  console.log('🌐 Testing connection to localhost:3000...');
  try {
    await makeRequest(`${BASE_URL}/api/health`, { method: 'GET' });
    console.log('✅ Local server connection successful\n');
  } catch (error) {
    console.log('❌ Cannot connect to local server\n');
    return;
  }

  console.log('🔐 Testing Authentication Methods:');
  console.log('=' .repeat(50));

  for (const authMethod of authMethods) {
    console.log(`\n🔑 Testing: ${authMethod.name}`);
    console.log('   Headers:', JSON.stringify(authMethod.headers, null, 2));
    
    for (const endpoint of testEndpoints) {
      const result = await testAuthMethod(authMethod, endpoint);
      const statusIcon = result.success ? '✅' : '❌';
      console.log(`   ${statusIcon} ${endpoint}: ${result.status} ${result.error ? '(' + result.error + ')' : ''}`);
    }
  }

  console.log('\n🏁 Auth testing complete!');
}

runAuthTests().catch(console.error); 