import fetch from 'node-fetch';

async function testApiSync() {
  try {
    console.log('🧪 TESTING API SYNCHRONIZATION\n');
    
    // Test tabarim endpoint
    console.log('📋 Testing /api/tabarim endpoint:');
    const tabarimResponse = await fetch('http://localhost:3000/api/tabarim');
    const tabarimData = await tabarimResponse.json();
    
    console.log('First tabar from API:');
    console.log(`- Tabar Number: ${tabarimData[0]?.tabar_number}`);
    console.log(`- Name: ${tabarimData[0]?.name}`);
    console.log(`- Total Authorized: ${tabarimData[0]?.total_authorized}`);
    console.log(`- Utilized: ${tabarimData[0]?.utilized}`);
    console.log(`- Utilization %: ${tabarimData[0]?.utilization_percentage}%`);
    
    // Test projects endpoint
    console.log('\n📊 Testing /api/projects endpoint:');
    const projectsResponse = await fetch('http://localhost:3000/api/projects');
    const projectsData = await projectsResponse.json();
    
    console.log('First project from API:');
    console.log(`- Tabar Number: ${projectsData[0]?.tabar_number}`);
    console.log(`- Name: ${projectsData[0]?.name}`);
    console.log(`- Total Authorized: ${projectsData[0]?.total_authorized}`);
    console.log(`- Utilized: ${projectsData[0]?.utilized_amount}`);
    console.log(`- Utilization %: ${projectsData[0]?.utilization_percentage_calculated}%`);
    
    // Check synchronization
    console.log('\n🔄 SYNCHRONIZATION CHECK:');
    const tabar101 = tabarimData.find(t => t.tabar_number === '101');
    const project101 = projectsData.find(p => p.tabar_number === '101');
    
    if (tabar101 && project101) {
      console.log(`✅ Tabar 101 - Utilized: ${tabar101.utilized} (${tabar101.utilization_percentage}%)`);
      console.log(`✅ Project 101 - Utilized: ${project101.utilized_amount} (${project101.utilization_percentage_calculated}%)`);
      
      if (tabar101.utilized === project101.utilized_amount && 
          tabar101.utilization_percentage === project101.utilization_percentage_calculated) {
        console.log('🎉 PERFECT SYNCHRONIZATION!');
      } else {
        console.log('❌ SYNCHRONIZATION MISMATCH!');
      }
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testApiSync(); 