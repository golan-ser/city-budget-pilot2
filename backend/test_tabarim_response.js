import fetch from 'node-fetch';

async function testTabarimResponse() {
  try {
    console.log('🧪 TESTING TABARIM API RESPONSE\n');
    
    const response = await fetch('http://localhost:3000/api/tabarim');
    const data = await response.json();
    
    console.log('📊 Total tabarim returned:', data.length);
    console.log('\n📋 FIRST TABAR DETAILS:');
    console.log(JSON.stringify(data[0], null, 2));
    
    console.log('\n🔍 CHECKING UTILIZATION FIELDS:');
    data.forEach((tabar, index) => {
      console.log(`${index + 1}. Tabar ${tabar.tabar_number}:`);
      console.log(`   - utilized: ${tabar.utilized} (type: ${typeof tabar.utilized})`);
      console.log(`   - utilization_percentage: ${tabar.utilization_percentage} (type: ${typeof tabar.utilization_percentage})`);
      console.log(`   - total_authorized: ${tabar.total_authorized} (type: ${typeof tabar.total_authorized})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTabarimResponse(); 