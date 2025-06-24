import fetch from 'node-fetch';

async function testUsersList() {
  try {
    console.log('🔄 Testing users list API...');
    
    // Test different tenant IDs to see which users exist
    for (let tenantId = 1; tenantId <= 3; tenantId++) {
      console.log(`\n📋 Checking tenant ${tenantId}:`);
      
      const response = await fetch(`http://localhost:3000/api/admin/tenants/${tenantId}/users`, {
        method: 'GET',
        headers: {
          'x-demo-token': 'DEMO_SECURE_TOKEN_2024',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Tenant ${tenantId} users:`, result.data?.length || 0);
        if (result.data && result.data.length > 0) {
          result.data.forEach(user => {
            console.log(`  - ID: ${user.id}, Name: ${user.full_name}, Email: ${user.email}`);
          });
        }
      } else {
        console.log(`❌ Tenant ${tenantId}: ${response.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testUsersList(); 