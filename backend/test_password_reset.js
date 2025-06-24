import fetch from 'node-fetch';

async function testPasswordReset() {
  try {
    console.log('🔄 Testing password reset API...');
    
    const response = await fetch('http://localhost:3000/api/admin/users/7/reset-password', {
      method: 'POST',
      headers: {
        'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ newPassword: 'test123' })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);
    
    if (!response.ok) {
      console.log('❌ Request failed with status:', response.status);
    } else {
      console.log('✅ Request successful');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPasswordReset(); 