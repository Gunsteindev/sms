// Simple connection test to verify basic connectivity
import { getAccessToken, dataverseClient } from '..';

async function testConnection() {
  console.log("🔌 Testing Dataverse Connection...\n");
  
  try {
    // Test 1: Get Access Token
    console.log("1. Testing Authentication...");
    const token = await getAccessToken();
    console.log(`   ✅ Token obtained (${token.length} characters)`);
    
    // Test 2: Simple API Call
    console.log("\n2. Testing API Call...");
    const response = await dataverseClient.getWithFilter(
      "students",
      ["studentid"],
      undefined,
      undefined,
      1
    );
    console.log(`   ✅ API call successful`);
    console.log(`   Response: ${JSON.stringify(response).substring(0, 200)}...`);
    
    // Test 3: Environment Validation
    console.log("\n3. Environment Check...");
    const requiredVars = [
      'DATAVERSE_URL',
      'AZURE_TENANT_ID', 
      'AZURE_CLIENT_ID',
      'AZURE_CLIENT_SECRET'
    ];
    
    requiredVars.forEach(varName => {
      const isSet = !!process.env[varName];
      console.log(`   ${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'Set' : 'Missing'}`);
    });
    
    console.log("\n🎉 Connection test passed! Dataverse is accessible.");
    
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("\n❌ Connection test failed!");
    console.error(`Error: ${error.message}`);
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();