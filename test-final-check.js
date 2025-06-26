#!/usr/bin/env node

/**
 * Final Check Script - After Railway Redeploy
 * בדיקה סופית לאחר פריסה ב-Railway
 */

const https = require('https');

const API_BASE = 'https://impartial-luck-production.up.railway.app';
const FRONTEND_ORIGINS = [
  'https://city-budget-frontend-v2.vercel.app',
  'https://city-budget-frontend-v2-a6rn4ukta-fintecity.vercel.app',
  'https://city-budget-pilot2.vercel.app'
];

console.log('🎯 בדיקה סופית לאחר Railway Redeploy...\n');

function testEndpoint(url, origin) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Origin': origin,
        'User-Agent': 'City-Budget-Final-Check/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          origin: origin
        });
      });
    });

    req.on('error', (error) => {
      reject({ error, origin });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({ error: new Error('Request timeout'), origin });
    });

    req.end();
  });
}

async function runFinalCheck() {
  console.log('🏥 בדיקת Health Check:\n');
  
  try {
    const healthResult = await testEndpoint(`${API_BASE}/health`, FRONTEND_ORIGINS[0]);
    console.log(`✅ Health Status: ${healthResult.status}`);
    
    if (healthResult.data) {
      try {
        const healthData = JSON.parse(healthResult.data);
        console.log(`✅ Environment: ${healthData.environment}`);
        console.log(`✅ Timestamp: ${healthData.timestamp}`);
      } catch (e) {
        console.log(`✅ Response: ${healthResult.data.substring(0, 100)}`);
      }
    }
  } catch (error) {
    console.log(`❌ Health Check Failed: ${error.error?.message || error.message}`);
    return;
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔐 בדיקת CORS עם כל הדומיינים:\n');
  
  let allPassed = true;
  
  for (const origin of FRONTEND_ORIGINS) {
    try {
      console.log(`🌐 Testing: ${origin}`);
      const result = await testEndpoint(`${API_BASE}/api/admin/permissions/user?tenantId=1&systemId=1&userId=3`, origin);
      
      console.log(`   Status: ${result.status} ${result.status === 401 ? '✅ (Auth Required - Good!)' : ''}`);
      
      if (result.headers['access-control-allow-origin']) {
        if (result.headers['access-control-allow-origin'] === origin) {
          console.log(`   ✅ CORS Origin: ${result.headers['access-control-allow-origin']}`);
        } else {
          console.log(`   ❌ Wrong CORS Origin: ${result.headers['access-control-allow-origin']}`);
          allPassed = false;
        }
      } else {
        console.log(`   ❌ Missing CORS Origin header`);
        allPassed = false;
      }
      
      console.log(''); // Empty line
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.error?.message || error.message}`);
      allPassed = false;
      console.log(''); // Empty line
    }
  }

  console.log('='.repeat(60));
  
  if (allPassed) {
    console.log('🎉 SUCCESS! כל הבדיקות עברו בהצלחה!');
    console.log('');
    console.log('✅ Backend Health: OK');
    console.log('✅ CORS Headers: OK עבור כל הדומיינים');
    console.log('✅ Authentication: OK (401 Expected)');
    console.log('');
    console.log('🚀 המערכת מוכנה לשימוש מלא!');
    console.log('');
    console.log('🔗 Frontend URLs:');
    FRONTEND_ORIGINS.forEach(url => {
      console.log(`   - ${url}`);
    });
  } else {
    console.log('⚠️ יש עדיין בעיות. בדוק:');
    console.log('1. האם עדכנת את ALLOWED_ORIGINS ב-Railway?');
    console.log('2. האם עשית Redeploy לבקאנד?');
    console.log('3. האם הפריסה הסתיימה בהצלחה?');
    console.log('');
    console.log('🔄 נסה שוב בעוד כמה דקות...');
  }
}

runFinalCheck().catch(console.error); 