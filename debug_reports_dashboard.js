const http = require('http');

console.log('🔍 Debug Reports Dashboard Issue...\n');

const DEMO_TOKEN = 'DEMO_SECURE_TOKEN_2024';
const BASE_URL = 'http://localhost:3000';

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ 
          statusCode: res.statusCode, 
          data: data,
          headers: res.headers
        });
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

async function debugReportsDashboard() {
  try {
    console.log('🧪 Testing Reports Dashboard...');
    
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-token': DEMO_TOKEN
      }
    };
    
    const response = await makeRequest(`${BASE_URL}/api/reports/dashboard`, options);
    
    console.log('Status Code:', response.statusCode);
    console.log('Headers:', response.headers);
    console.log('Raw Response:', response.data);
    
    try {
      const parsed = JSON.parse(response.data);
      console.log('Parsed Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
    
  } catch (error) {
    console.error('Request Error:', error.message);
  }
  
  // Also test if the route exists at all
  console.log('\n🔍 Testing if route is registered...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/reports`, {
      method: 'GET',
      headers: { 'x-demo-token': DEMO_TOKEN }
    });
    console.log('Base reports route status:', response.statusCode);
  } catch (error) {
    console.error('Base reports route error:', error.message);
  }
}

debugReportsDashboard(); 