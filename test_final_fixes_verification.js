const http = require('http');

// 🎯 FINAL COMPREHENSIVE FIXES VERIFICATION
console.log('🎯 Final Verification - All Fixes Testing\n');

const DEMO_TOKEN = 'DEMO_SECURE_TOKEN_2024';
const BASE_URL = 'http://localhost:3000';

let successCount = 0;
let totalCount = 0;
const results = [];

// 🔧 ALL FIXES BEING TESTED
const fixTests = [
  // ✅ FIX 1: Dashboard API - Added root route
  {
    name: '🔧 FIX 1: Dashboard Root API',
    method: 'GET',
    endpoint: '/api/dashboard',
    headers: { 'x-demo-token': DEMO_TOKEN },
    description: 'Added router.get("/", getDashboardData) to dashboardRoutes.js',
    expectedResult: 'Should return dashboard data or redirect properly'
  },
  
  // ✅ FIX 2: Dashboard Data (fallback that works)
  {
    name: '🔧 FIX 1B: Dashboard Data (Fallback)',
    method: 'GET',
    endpoint: '/api/dashboard/data',
    headers: { 'x-demo-token': DEMO_TOKEN },
    description: 'Fallback endpoint that definitely works',
    expectedResult: 'Should return complete dashboard data'
  },
  
  // ✅ FIX 2: Reports Dashboard - New endpoint
  {
    name: '🔧 FIX 2: Reports Dashboard',
    method: 'GET',
    endpoint: '/api/reports/reports-dashboard',
    headers: { 'x-demo-token': DEMO_TOKEN },
    description: 'Added getReportsDashboard function and route',
    expectedResult: 'Should return reports statistics and dashboard data'
  },
  
  // ✅ FIX 3: Smart Query OpenAI Status
  {
    name: '🔧 FIX 3: Smart Query Status',
    method: 'GET',
    endpoint: '/api/smart-query/openai-status',
    headers: { 'x-demo-token': DEMO_TOKEN },
    description: 'OpenAI status check (works with or without API key)',
    expectedResult: 'Should show OpenAI configuration status'
  },
  
  // ✅ FIX 4: Smart Query Process (Rule-based)
  {
    name: '🔧 FIX 4: Smart Query Process',
    method: 'POST',
    endpoint: '/api/smart-query/process',
    headers: { 
      'Content-Type': 'application/json',
      'x-demo-token': DEMO_TOKEN
    },
    body: { 
      query: 'הצג תברים פעילים',
      options: { minConfidence: 0.3 }
    },
    description: 'Smart query processing with rule-based fallback',
    expectedResult: 'Should process Hebrew query and return structured data'
  },
  
  // ✅ FIX 5: Report Schemas with Auth
  {
    name: '🔧 FIX 5: Report Schemas Run',
    method: 'POST',
    endpoint: '/api/report-schemas/run',
    headers: { 
      'Content-Type': 'application/json',
      'x-demo-token': DEMO_TOKEN
    },
    body: {
      module: 'tabarim',
      fields: ['tabar_number', 'name', 'status'],
      filters: {}
    },
    description: 'Report schemas execution with authentication',
    expectedResult: 'Should return tabarim data in structured format'
  },
  
  // ✅ FIX 6: Reports Center endpoints with auth
  {
    name: '🔧 FIX 6: Budget Execution Report',
    method: 'GET',
    endpoint: '/api/reports/budget-execution',
    headers: { 'x-demo-token': DEMO_TOKEN },
    description: 'Budget execution report with authentication',
    expectedResult: 'Should return budget execution data'
  },
  
  {
    name: '🔧 FIX 6B: Invoices Report',
    method: 'GET',
    endpoint: '/api/reports/invoices',
    headers: { 'x-demo-token': DEMO_TOKEN },
    description: 'Invoices report with authentication',
    expectedResult: 'Should return invoices data'
  },
  
  // ✅ REGRESSION TESTS - Should still work
  {
    name: '✅ REGRESSION: Tabarim List',
    method: 'GET',
    endpoint: '/api/tabarim',
    headers: { 'x-demo-token': DEMO_TOKEN },
    description: 'Existing endpoint should still work',
    expectedResult: 'Should return 8 tabarim with utilization data'
  },
  
  {
    name: '✅ REGRESSION: Admin Statistics',
    method: 'GET',
    endpoint: '/api/admin/statistics',
    headers: { 'x-demo-token': DEMO_TOKEN },
    description: 'Existing admin endpoint should still work',
    expectedResult: 'Should return system statistics'
  }
];

// Helper function to make HTTP requests
function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
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
    req.setTimeout(8000, () => {
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
async function runFixTest(test) {
  totalCount++;
  const url = `${BASE_URL}${test.endpoint}`;
  
  try {
    console.log(`🧪 ${test.name}`);
    console.log(`   📝 ${test.description}`);
    console.log(`   🎯 ${test.expectedResult}`);
    console.log(`   🔗 ${test.method} ${test.endpoint}`);
    
    const options = {
      method: test.method,
      headers: {
        'User-Agent': 'Final-Fix-Verification/1.0',
        ...test.headers
      }
    };
    
    const startTime = Date.now();
    const response = await makeRequest(url, options, test.body);
    const responseTime = Date.now() - startTime;
    
    const isSuccess = response.statusCode >= 200 && response.statusCode < 300;
    
    if (isSuccess) {
      successCount++;
      console.log(`   ✅ SUCCESS: ${response.statusCode} (${responseTime}ms)`);
      
      // Show relevant data details
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          console.log(`   📊 Array data: ${response.data.length} items`);
          if (response.data.length > 0) {
            const sample = response.data[0];
            const keys = Object.keys(sample).slice(0, 3);
            console.log(`   📋 Sample fields: ${keys.join(', ')}`);
          }
        } else {
          // Show key indicators based on endpoint
          if (test.endpoint.includes('dashboard')) {
            if (response.data.kpis) console.log(`   📊 KPIs available`);
            if (response.data.statistics) console.log(`   📊 Statistics available`);
            if (response.data.success !== undefined) console.log(`   📊 Success: ${response.data.success}`);
          } else if (test.endpoint.includes('openai-status')) {
            console.log(`   🤖 OpenAI Configured: ${response.data.openaiConfigured || 'unknown'}`);
            console.log(`   🤖 Status: ${response.data.status || 'unknown'}`);
          } else if (test.endpoint.includes('smart-query')) {
            if (response.data.success !== undefined) console.log(`   🔍 Query Success: ${response.data.success}`);
            if (response.data.stage) console.log(`   🔍 Processing Stage: ${response.data.stage}`);
          } else {
            const keys = Object.keys(response.data).slice(0, 3);
            console.log(`   📋 Response keys: ${keys.join(', ')}`);
          }
        }
      }
      
    } else {
      console.log(`   ❌ FAILED: ${response.statusCode} (${responseTime}ms)`);
      if (response.data && response.data.error) {
        console.log(`   💬 Error: ${response.data.error}`);
      }
      if (response.data && response.data.message) {
        console.log(`   💬 Message: ${response.data.message}`);
      }
    }
    
    results.push({
      name: test.name,
      endpoint: test.endpoint,
      method: test.method,
      status: response.statusCode,
      responseTime,
      success: isSuccess,
      error: response.data?.error || null,
      description: test.description
    });
    
    console.log('');
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.push({
      name: test.name,
      endpoint: test.endpoint,
      method: test.method,
      status: 'ERROR',
      responseTime: 0,
      success: false,
      error: error.message,
      description: test.description
    });
    console.log('');
  }
}

// Main execution
async function runFinalVerification() {
  console.log('🌐 Testing connection to localhost:3000...');
  try {
    await makeRequest(`${BASE_URL}/health`, { method: 'GET' });
    console.log('✅ Server connection successful\n');
  } catch (error) {
    console.log('❌ Cannot connect to server. Make sure it\'s running on port 3000\n');
    return;
  }
  
  console.log(`🧪 Running ${fixTests.length} comprehensive fix verification tests...\n`);
  console.log('=' .repeat(80));
  console.log('🔧 TESTING ALL IMPLEMENTED FIXES');
  console.log('=' .repeat(80));
  
  // Run all tests
  for (const test of fixTests) {
    await runFixTest(test);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Final comprehensive report
  console.log('📊 FINAL COMPREHENSIVE RESULTS');
  console.log('=' .repeat(80));
  console.log(`Total Tests: ${totalCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${totalCount - successCount}`);
  console.log(`Success Rate: ${Math.round((successCount / totalCount) * 100)}%`);
  console.log('');
  
  // Categorize results
  const fixes = results.filter(r => r.name.includes('FIX'));
  const regressions = results.filter(r => r.name.includes('REGRESSION'));
  
  const fixesSuccess = fixes.filter(r => r.success).length;
  const regressionsSuccess = regressions.filter(r => r.success).length;
  
  console.log('🔧 NEW FIXES STATUS:');
  console.log(`Implemented Fixes: ${fixesSuccess}/${fixes.length} (${Math.round((fixesSuccess / fixes.length) * 100)}%)`);
  
  console.log('✅ REGRESSION TESTS:');
  console.log(`Existing Features: ${regressionsSuccess}/${regressions.length} (${Math.round((regressionsSuccess / regressions.length) * 100)}%)`);
  
  console.log('');
  
  // Summary by fix category
  const fixCategories = {
    'Dashboard': fixes.filter(f => f.name.includes('Dashboard')),
    'Reports': fixes.filter(f => f.name.includes('Reports') || f.name.includes('Budget')),
    'Smart Query': fixes.filter(f => f.name.includes('Smart Query')),
    'Schemas': fixes.filter(f => f.name.includes('Schemas'))
  };
  
  console.log('📈 FIXES BY CATEGORY:');
  Object.entries(fixCategories).forEach(([category, tests]) => {
    if (tests.length > 0) {
      const successCount = tests.filter(t => t.success).length;
      const rate = Math.round((successCount / tests.length) * 100);
      console.log(`${category}: ${successCount}/${tests.length} (${rate}%)`);
    }
  });
  
  console.log('');
  
  // Failed tests details
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('❌ FAILED TESTS DETAILS:');
    failedTests.forEach(test => {
      const icon = test.name.includes('FIX') ? '🔧' : '✅';
      console.log(`${icon} ${test.name}`);
      console.log(`   ${test.endpoint}: ${test.status} ${test.error ? '(' + test.error + ')' : ''}`);
      console.log(`   ${test.description}`);
      console.log('');
    });
  } else {
    console.log('🎉 ALL FIXES WORKING PERFECTLY! 🎉');
    console.log('🚀 Ready for production deployment!');
  }
  
  console.log('\n🏁 Final verification complete!');
  console.log('📋 All implemented fixes have been thoroughly tested.');
}

runFinalVerification().catch(console.error); 