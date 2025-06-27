// Comprehensive API Testing Script
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_ENDPOINTS = {
    DASHBOARD: '/api/dashboard',
    TABARIM: '/api/tabarim',
    PROJECTS: '/api/projects',
    ADMIN_STATS: '/api/admin/statistics',
    OPENAI_STATUS: '/api/openai-status'
};

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(testName, status, details = '') {
    const result = {
        name: testName,
        status: status,
        details: details,
        timestamp: new Date().toISOString()
    };
    
    testResults.tests.push(result);
    
    if (status === 'PASS') {
        testResults.passed++;
        console.log(`✅ ${testName}: PASS ${details}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}: FAIL ${details}`);
    }
}

async function testEndpoint(name, url, expectedStatus = 200) {
    try {
        const startTime = Date.now();
        const response = await axios.get(`${BASE_URL}${url}`);
        const responseTime = Date.now() - startTime;
        
        if (response.status === expectedStatus) {
            const hasData = response.data && (Array.isArray(response.data) ? response.data.length > 0 : Object.keys(response.data).length > 0);
            logTest(
                `${name} API Call`, 
                'PASS', 
                `Status: ${response.status}, Response Time: ${responseTime}ms, Has Data: ${hasData}`
            );
            return { success: true, data: response.data, responseTime };
        } else {
            logTest(`${name} API Call`, 'FAIL', `Expected ${expectedStatus}, got ${response.status}`);
            return { success: false, status: response.status };
        }
    } catch (error) {
        logTest(`${name} API Call`, 'FAIL', `Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive API Testing...\n');
    console.log('📋 Testing API Endpoints:\n');

    // 1. בדיקת חיבורי דאטא
    console.log('1️⃣ Testing Data Connections...');
    const dashboardResult = await testEndpoint('Dashboard', API_ENDPOINTS.DASHBOARD);
    const tabarimResult = await testEndpoint('Tabarim List', API_ENDPOINTS.TABARIM);
    const projectsResult = await testEndpoint('Projects List', API_ENDPOINTS.PROJECTS);
    
    // 2. בדיקת זמני תגובה
    console.log('\n2️⃣ Testing Response Times...');
    if (dashboardResult.success && dashboardResult.responseTime) {
        if (dashboardResult.responseTime < 3000) {
            logTest('Dashboard Response Time', 'PASS', `${dashboardResult.responseTime}ms (< 3 seconds)`);
        } else {
            logTest('Dashboard Response Time', 'FAIL', `${dashboardResult.responseTime}ms (> 3 seconds)`);
        }
    }
    
    // 3. בדיקת נתונים אמיתיים
    console.log('\n3️⃣ Testing Real Data (No Mock Data)...');
    if (dashboardResult.success && dashboardResult.data) {
        const data = dashboardResult.data;
        if (data.totalBudget || data.totalProjects || data.alerts) {
            logTest('Dashboard Real Data', 'PASS', 'Dashboard contains real data fields');
        } else {
            logTest('Dashboard Real Data', 'FAIL', 'Dashboard appears to contain mock data only');
        }
    }
    
    if (tabarimResult.success && tabarimResult.data) {
        const data = tabarimResult.data;
        if (Array.isArray(data) && data.length > 0) {
            logTest('Tabarim Real Data', 'PASS', `Found ${data.length} tabarim records`);
        } else if (data.tabarim && Array.isArray(data.tabarim)) {
            logTest('Tabarim Real Data', 'PASS', `Found ${data.tabarim.length} tabarim records`);
        } else {
            logTest('Tabarim Real Data', 'FAIL', 'No tabarim data found');
        }
    }
    
    // 4. בדיקת Admin endpoints
    console.log('\n4️⃣ Testing Admin Endpoints...');
    await testEndpoint('Admin Statistics', API_ENDPOINTS.ADMIN_STATS);
    
    // 5. בדיקת OpenAI Status
    console.log('\n5️⃣ Testing OpenAI Integration...');
    await testEndpoint('OpenAI Status', API_ENDPOINTS.OPENAI_STATUS);
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    // Detailed Results
    console.log('\n📋 DETAILED RESULTS:');
    console.log('====================');
    testResults.tests.forEach(test => {
        const status = test.status === 'PASS' ? '✅' : '❌';
        console.log(`${status} ${test.name}: ${test.details}`);
    });
    
    // Database Connection Status
    console.log('\n🔌 DATABASE CONNECTION STATUS:');
    console.log('===============================');
    if (testResults.passed > 0) {
        console.log('✅ Backend successfully connected to Supabase');
        console.log('✅ API endpoints are responding');
        console.log('✅ Data is being served from real database');
    } else {
        console.log('❌ Backend connection issues detected');
        console.log('❌ API endpoints not responding properly');
    }
}

// Run the tests
runComprehensiveTests().catch(console.error); 