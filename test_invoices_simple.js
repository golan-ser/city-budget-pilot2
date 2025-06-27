const http = require('http');

console.log('🧪 Testing Invoices Endpoint...');

const options = {
  method: 'GET',
  headers: { 'x-demo-token': 'DEMO_SECURE_TOKEN_2024' }
};

const req = http.request('http://localhost:3000/api/reports/invoices', options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode === 200) {
      const parsed = JSON.parse(data);
      console.log('✅ SUCCESS! Data:', parsed.data?.length || 0, 'items');
      console.log('✅ Message:', parsed.message || 'No message');
    } else {
      console.log('❌ Error:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request Error:', error.message);
});

req.end(); 