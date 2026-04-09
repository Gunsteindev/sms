// Quick test for immediate validation
import { getAccessToken } from '../auth';
import { getStudents } from '../students';

async function quickTest() {
  console.log("🚀 Quick Test - Dataverse Integration\n");
  
  try {
    // Test 1: Authentication
    console.log("Testing authentication...");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const token = await getAccessToken();
    console.log("✅ Authentication successful\n");
    
    // Test 2: Fetch students
    console.log("Testing student fetch...");
    const students = await getStudents({ pageSize: 3 });
    console.log(`✅ Retrieved ${students.items.length} students\n`);
    
    if (students.items.length > 0) {
      console.log("Sample student data:");
      console.log(JSON.stringify(students.items[0], null, 2));
    }
    
    console.log("\n✅ All quick tests passed!");
    
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("\n❌ Test failed:", error.message);
    if (error.response?.data) {
      console.error("Details:", error.response.data);
    }
    process.exit(1);
  }
}

quickTest();