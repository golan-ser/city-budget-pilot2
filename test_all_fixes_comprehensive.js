const https = require('https');
const http = require('http');

// ⚡ COMPREHENSIVE API TEST SUITE - All Fixes Verification
console.log('🧪 Starting Comprehensive Fixes Verification...\n');

const DEMO_TOKEN = 'DEMO_SECURE_TOKEN_2024';
const BASE_URL = 'https://impartial-luck-production.up.railway.app';
// Fallback to localhost if Railway is down
const FALLBACK_URL = 'http://localhost:3000';

let successCount = 0;
let totalCount = 0;
const results = [];

// Test configurations
const tests = [
  // 🔧 FIX 1: Dashboard API - Added root route
  {
    name: 'Dashboard Root API',
    method: 'GET',
    endpoint: '/api/dashboard',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    expectedStatusRange: [200, 299],
    category: 'FIXED_ISSUES'
  },
  
  // 🔧 FIX 2: Reports Dashboard - Added new endpoint
  {
    name: 'Reports Dashboard API',
    method: 'GET',
    endpoint: '/api/reports/dashboard',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    expectedStatusRange: [200, 299],
    category: 'FIXED_ISSUES'
  },
  
  // 🔧 FIX 3: ReportsCenter endpoints with auth
  {
    name: 'Budget Execution Report (with auth)',
    method: 'GET',
    endpoint: '/api/reports/budget-execution',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    expectedStatusRange: [200, 299],
    category: 'FIXED_ISSUES'
  },
  
  {
    name: 'Invoices Report (with auth)',
    method: 'GET',
    endpoint: '/api/reports/invoices',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    expectedStatusRange: [200, 299],
    category: 'FIXED_ISSUES'
  },
  
  {
    name: 'Ministry Report (with auth)',
    method: 'GET',
    endpoint: '/api/reports/ministry',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    expectedStatusRange: [200, 299],
    category: 'FIXED_ISSUES'
  },
  
  {
    name: 'Cash Flow Report (with auth)',
    method: 'GET',
    endpoint: '/api/reports/cash-flow',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    expectedStatusRange: [200, 299],
    category: 'FIXED_ISSUES'
  },
  
  // 🔧 FIX 4: Smart Query System (Rule-based fallback)
  {
    name: 'Smart Query OpenAI Status',
    method: 'GET',
    endpoint: '/api/smart-query/openai-status',
    headers: { 'x-demo-token': DEMO_TOKEN },
    expectedStatusRange: [200, 299],
    category: 'FIXED_ISSUES'
  },
  
  {
    name: 'Smart Query Process (Rule-based)',
    method: 'POST',
    endpoint: '/api/smart-query/process',
    headers: { 'Content-Type': 'application/json' },
    body: { 
      query: 'הצג את כל התברים פעילים',
      options: { minConfidence: 0.3 }
    },
    expectedStatusRange: [200, 299],
    category: 'FIXED_ISSUES'
  },
  
  // 🔧 FIX 5: Reports Module with auth
  {
    name: 'Report Schemas Run (with auth)',
    method: 'POST',
    endpoint: '/api/report-schemas/run',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEMO_TOKEN}`
    },
    body: {
      module: 'tabarim',
      fields: ['tabar_number', 'name', 'status'],
      filters: {}
    },
    expectedStatusRange: [200, 299],
    category: 'FIXED_ISSUES'
  },
  
  // ✅ EXISTING WORKING ENDPOINTS (Regression Test)
  {
    name: 'Tabarim List (regression test)',
    method: 'GET',
    endpoint: '/api/tabarim',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    expectedStatusRange: [200, 299],
    category: 'REGRESSION_TEST'
  },
  
  {
    name: 'Projects List (regression test)',
    method: 'GET',
    endpoint: '/api/projects',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    expectedStatusRange: [200, 299],
    category: 'REGRESSION_TEST'
  },
  
  {
    name: 'Admin Statistics (regression test)',
    method: 'GET',
    endpoint: '/api/admin/statistics',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    expectedStatusRange: [200, 299],
    category: 'REGRESSION_TEST'
  }
];

// Helper function to make HTTP requests
function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const httpModule = isHttps ? https : http;
    
    const req = httpModule.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({ 
            statusCode: res.statusCode, 
            data: parsedData,
            rawData: data
          });
        } catch (e) {
          resolve({ 
            statusCode: res.statusCode, 
            data: null,
            rawData: data,
            parseError: e.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

// Test runner function
async function runTest(test, baseUrl) {
  totalCount++;
  const url = `${baseUrl}${test.endpoint}`;
  
  try {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   ${test.method} ${url}`);
    
    const options = {
      method: test.method,
      headers: {
        'User-Agent': 'Comprehensive-Test-Suite/1.0',
        ...test.headers
      }
    };
    
    const startTime = Date.now();
    const response = await makeRequest(url, options, test.body);
    const responseTime = Date.now() - startTime;
    
    const isSuccess = response.statusCode >= test.expectedStatusRange[0] && 
                     response.statusCode <= test.expectedStatusRange[1];
    
    if (isSuccess) {
      successCount++;
      console.log(`   ✅ SUCCESS: ${response.statusCode} (${responseTime}ms)`);
      
      // Log some data details for verification
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          console.log(`   📊 Data: ${response.data.length} items`);
        } else if (response.data.success !== undefined) {
          console.log(`   📊 Success: ${response.data.success}`);
        } else {
          console.log(`   📊 Data keys: ${Object.keys(response.data).slice(0, 3).join(', ')}`);
        }
      }
    } else {
      console.log(`   ❌ FAILED: ${response.statusCode} (${responseTime}ms)`);
      if (response.data && response.data.error) {
        console.log(`   💬 Error: ${response.data.error}`);
      }
    }
    
    results.push({
      name: test.name,
      category: test.category,
      url: url,
      method: test.method,
      status: response.statusCode,
      responseTime,
      success: isSuccess,
      dataSize: response.rawData ? response.rawData.length : 0,
      error: response.data?.error || null
    });
    
    console.log(''); // Empty line for readability
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.push({
      name: test.name,
      category: test.category,
      url: url,
      method: test.method,
      status: 'ERROR',
      responseTime: 0,
      success: false,
      error: error.message
    });
    console.log('');
  }
}

// Main execution
async function runAllTests() {
  console.log(`📋 Running ${tests.length} comprehensive tests...\n`);
  
  // Try Railway first, fallback to localhost
  let selectedUrl = BASE_URL;
  try {
    console.log('🌐 Testing connection to Railway...');
    await makeRequest(`${BASE_URL}/api/health`, { method: 'GET' });
    console.log('✅ Railway connection successful\n');
  } catch (error) {
    console.log('⚠️ Railway connection failed, using localhost fallback\n');
    selectedUrl = FALLBACK_URL;
  }
  
  // Run all tests
  for (const test of tests) {
    await runTest(test, selectedUrl);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Final report
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${totalCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${totalCount - successCount}`);
  console.log(`Success Rate: ${Math.round((successCount / totalCount) * 100)}%`);
  console.log('');
  
  // Category breakdown
  const categories = {};
  results.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = { total: 0, success: 0 };
    }
    categories[result.category].total++;
    if (result.success) categories[result.category].success++;
  });
  
  console.log('📈 RESULTS BY CATEGORY:');
  Object.entries(categories).forEach(([category, stats]) => {
    const rate = Math.round((stats.success / stats.total) * 100);
    console.log(`${category}: ${stats.success}/${stats.total} (${rate}%)`);
  });
  
  console.log('');
  
  // Failed tests details
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('❌ FAILED TESTS DETAILS:');
    failedTests.forEach(test => {
      console.log(`- ${test.name}: ${test.status} ${test.error ? '(' + test.error + ')' : ''}`);
    });
  } else {
    console.log('🎉 ALL TESTS PASSED! 🎉');
  }
  
  console.log('\n🏁 Comprehensive verification complete!');
}

// Run the tests
runAllTests().catch(console.error); 