const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BASE_URL = 'http://localhost:5000/api/v1';

// Helper function to make authenticated requests
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`\n📡 ${method} ${endpoint}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return null;
  }
}

// Function to get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function testDisbursementMigration() {
  console.log('🚀 Disbursement Roll Migration Tester\n');

  try {
    // Step 1: Test server health
    console.log('1️⃣ Testing server health...');
    const health = await makeRequest('/health');
    if (!health || health.response.status !== 200) {
      console.log('❌ Server is not responding. Make sure the server is running on port 5000.');
      return;
    }
    console.log('✅ Server is healthy!');

    // Step 2: Get login credentials
    console.log('\n2️⃣ Please provide login credentials:');
    const email = await askQuestion('📧 Email: ');
    const password = await askQuestion('🔑 Password: ');

    // Step 3: Login to get token
    console.log('\n3️⃣ Logging in...');
    const loginResult = await makeRequest('/auth/login', 'POST', { email, password });
    
    if (!loginResult || !loginResult.data.success) {
      console.log('❌ Login failed. Please check your credentials.');
      return;
    }

    const token = loginResult.data.data.token;
    console.log('✅ Login successful!');

    // Step 4: Get branch ID (optional)
    console.log('\n4️⃣ Branch Information:');
    let branchId = await askQuestion('🏢 Branch ID (optional, press Enter to skip): ');
    if (!branchId.trim()) {
      branchId = null;
    }

    // Step 5: Get current disbursement roll before migration
    console.log('\n5️⃣ Getting current disbursement roll...');
    const currentRoll = await makeRequest(
      `/disbursement-roll${branchId ? `?branchId=${branchId}` : ''}`, 
      'GET', 
      null, 
      token
    );

    // Step 6: Run migration
    console.log('\n6️⃣ Running migration...');
    const migrationResult = await makeRequest('/disbursement-roll/migrate', 'POST', {}, token);
    
    if (migrationResult && migrationResult.data.success) {
      console.log('✅ Migration completed successfully!');
      console.log(`📈 Updated ${migrationResult.data.data.updatedRecords} out of ${migrationResult.data.data.totalRecords} records`);
    } else {
      console.log('❌ Migration failed');
    }

    // Step 7: Get disbursement roll after migration
    console.log('\n7️⃣ Getting disbursement roll after migration...');
    const updatedRoll = await makeRequest(
      `/disbursement-roll${branchId ? `?branchId=${branchId}` : ''}`, 
      'GET', 
      null, 
      token
    );

    // Step 8: Show comparison
    if (currentRoll && updatedRoll) {
      console.log('\n📊 COMPARISON:');
      console.log('Before Migration:');
      if (currentRoll.data.success) {
        const before = currentRoll.data.data.disbursementRoll;
        console.log(`  - disbursementRoll: ${before.disbursementRoll}`);
        console.log(`  - disNo: ${before.disNo}`);
        console.log(`  - dailyDisNo: ${before.dailyDisNo || 'N/A'}`);
        console.log(`  - currentDisbursementNo: ${before.currentDisbursementNo || 'N/A'}`);
        console.log(`  - cumulativeDisNo: ${before.cumulativeDisNo || 'N/A'}`);
      }
      
      console.log('\nAfter Migration:');
      if (updatedRoll.data.success) {
        const after = updatedRoll.data.data.disbursementRoll;
        console.log(`  - disbursementRoll: ${after.disbursementRoll}`);
        console.log(`  - disNo: ${after.disNo}`);
        console.log(`  - dailyDisNo: ${after.dailyDisNo || 'N/A'}`);
        console.log(`  - currentDisbursementNo: ${after.currentDisbursementNo || 'N/A'}`);
        console.log(`  - cumulativeDisNo: ${after.cumulativeDisNo || 'N/A'}`);
      }
    }

    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run the test
testDisbursementMigration();