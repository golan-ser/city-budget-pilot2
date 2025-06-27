const http = require('http');

// 🧪 LOCAL API TEST SUITE - All Fixes Verification
console.log('🔧 Testing ALL FIXES on Local Server...\n');

const DEMO_TOKEN = 'DEMO_SECURE_TOKEN_2024';
const BASE_URL = 'http://localhost:3000';

let successCount = 0;
let totalCount = 0;
const results = [];

// Priority Tests - The fixes I implemented
const tests = [
  // 🔧 FIX 1: Dashboard API - Added root route
  {
    name: '🔧 Dashboard Root API (NEW FIX)',
    method: 'GET',
    endpoint: '/api/dashboard',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    priority: 'HIGH'
  },
  
  // 🔧 FIX 2: Reports Dashboard - Added new endpoint
  {
    name: '🔧 Reports Dashboard API (NEW FIX)',
    method: 'GET',
    endpoint: '/api/reports/dashboard',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    priority: 'HIGH'
  },
  
  // 🔧 FIX 3: Smart Query System
  {
    name: '🔧 Smart Query OpenAI Status (WORKING)',
    method: 'GET',
    endpoint: '/api/smart-query/openai-status',
    headers: { 'x-demo-token': DEMO_TOKEN },
    priority: 'HIGH'
  },
  
  {
    name: '🔧 Smart Query Process (RULE-BASED)',
    method: 'POST', 
    endpoint: '/api/smart-query/process',
    headers: { 'Content-Type': 'application/json' },
    body: { 
      query: 'הצג את כל התברים',
      options: { minConfidence: 0.3 }
    },
    priority: 'HIGH'
  },
  
  // 🔧 FIX 4: Reports Module with auth
  {
    name: '🔧 Report Schemas Run (AUTH FIXED)',
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
    priority: 'HIGH'
  },
  
  // 🔧 FIX 5: ReportsCenter endpoints with auth
  {
    name: '🔧 Budget Execution Report (AUTH FIXED)',
    method: 'GET',
    endpoint: '/api/reports/budget-execution',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    priority: 'HIGH'
  },
  
  // Working endpoints for comparison
  {
    name: '✅ Tabarim List (Should Work)',
    method: 'GET',
    endpoint: '/api/tabarim',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    priority: 'NORMAL'
  },
  
  {
    name: '✅ Admin Statistics (Should Work)',
    method: 'GET',
    endpoint: '/api/admin/statistics',
    headers: { 'Authorization': `Bearer ${DEMO_TOKEN}` },
    priority: 'NORMAL'
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
async function runTest(test) {
  totalCount++;
  const url = `${BASE_URL}${test.endpoint}`;
  
  try {
    console.log(`🧪 ${test.name}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    
    const options = {
      method: test.method,
      headers: {
        'User-Agent': 'Local-Fix-Test/1.0',
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
      
      // Show data details
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          console.log(`   📊 Data: ${response.data.length} items`);
          if (response.data.length > 0) {
            const firstItem = response.data[0];
            const keys = Object.keys(firstItem).slice(0, 3);
            console.log(`   📋 Fields: ${keys.join(', ')}`);
          }
        } else {
          if (response.data.success !== undefined) {
            console.log(`   📊 Success: ${response.data.success}`);
          }
          if (response.data.statistics) {
            console.log(`   📊 Statistics available`);
          }
          if (response.data.openaiConfigured !== undefined) {
            console.log(`   🤖 OpenAI: ${response.data.openaiConfigured ? 'Configured' : 'Rule-based only'}`);
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
      priority: test.priority,
      status: response.statusCode,
      responseTime,
      success: isSuccess,
      error: response.data?.error || null
    });
    
    console.log('');
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    results.push({
      name: test.name,
      priority: test.priority,
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
  console.log('🌐 Testing connection to localhost:3000...');
  try {
    await makeRequest(`${BASE_URL}/api/health`, { method: 'GET' });
    console.log('✅ Local server connection successful\n');
  } catch (error) {
    console.log('❌ Cannot connect to local server. Make sure it\'s running on port 3000\n');
    return;
  }
  
  console.log(`📋 Running ${tests.length} local fix verification tests...\n`);
  
  // Run high priority tests first
  const highPriorityTests = tests.filter(t => t.priority === 'HIGH');
  const normalPriorityTests = tests.filter(t => t.priority === 'NORMAL');
  
  console.log('🔥 HIGH PRIORITY - NEW FIXES:');
  console.log('=' .repeat(40));
  for (const test of highPriorityTests) {
    await runTest(test);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('✅ NORMAL PRIORITY - REGRESSION TESTS:');
  console.log('=' .repeat(40));
  for (const test of normalPriorityTests) {
    await runTest(test);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Final report
  console.log('📊 LOCAL FIX VERIFICATION RESULTS');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${totalCount}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${totalCount - successCount}`);
  console.log(`Success Rate: ${Math.round((successCount / totalCount) * 100)}%`);
  console.log('');
  
  // Priority breakdown
  const highPriorityResults = results.filter(r => r.priority === 'HIGH');
  const highPrioritySuccess = highPriorityResults.filter(r => r.success).length;
  
  console.log('🔥 NEW FIXES STATUS:');
  console.log(`High Priority (New Fixes): ${highPrioritySuccess}/${highPriorityResults.length} (${Math.round((highPrioritySuccess / highPriorityResults.length) * 100)}%)`);
  
  const normalResults = results.filter(r => r.priority === 'NORMAL');
  const normalSuccess = normalResults.filter(r => r.success).length;
  console.log(`Normal Priority (Regression): ${normalSuccess}/${normalResults.length} (${Math.round((normalSuccess / normalResults.length) * 100)}%)`);
  
  console.log('');
  
  // Failed tests details
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('❌ FAILED TESTS:');
    failedTests.forEach(test => {
      const priorityIcon = test.priority === 'HIGH' ? '🔥' : '📝';
      console.log(`${priorityIcon} ${test.name}: ${test.status} ${test.error ? '(' + test.error + ')' : ''}`);
    });
  } else {
    console.log('🎉 ALL FIXES WORKING PERFECTLY! 🎉');
  }
  
  console.log('\n🏁 Local fix verification complete!');
}

runAllTests().catch(console.error); 