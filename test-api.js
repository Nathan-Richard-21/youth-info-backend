const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test configuration
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testAdmin = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123'
};

let userToken = '';
let adminToken = '';
let opportunityId = '';

// Helper function for API calls
const api = axios.create({
  baseURL: BASE_URL
});

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Test functions
async function testHealthCheck() {
  log('\n=== Testing Health Check ===', 'cyan');
  try {
    const res = await api.get('/health');
    log(`✓ Health check passed: ${res.data.message}`, 'green');
    return true;
  } catch (err) {
    log(`✗ Health check failed: ${err.message}`, 'red');
    return false;
  }
}

async function testUserRegistration() {
  log('\n=== Testing User Registration ===', 'cyan');
  try {
    const res = await api.post('/auth/register', testUser);
    userToken = res.data.token;
    log(`✓ User registered successfully`, 'green');
    log(`  Token: ${userToken.substring(0, 20)}...`, 'yellow');
    return true;
  } catch (err) {
    log(`✗ User registration failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testAdminRegistration() {
  log('\n=== Testing Admin Registration ===', 'cyan');
  try {
    const res = await api.post('/auth/register', testAdmin);
    adminToken = res.data.token;
    log(`✓ Admin registered successfully`, 'green');
    log(`  Token: ${adminToken.substring(0, 20)}...`, 'yellow');
    
    // Manually set role to admin (in real scenario, this would be done in database)
    log(`  Note: Manually set role to 'admin' in database for this user`, 'yellow');
    return true;
  } catch (err) {
    log(`✗ Admin registration failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testUserLogin() {
  log('\n=== Testing User Login ===', 'cyan');
  try {
    const res = await api.post('/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    userToken = res.data.token;
    log(`✓ User login successful`, 'green');
    return true;
  } catch (err) {
    log(`✗ User login failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testGetUserProfile() {
  log('\n=== Testing Get User Profile ===', 'cyan');
  try {
    const res = await api.get('/users/me', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    log(`✓ User profile retrieved`, 'green');
    log(`  Name: ${res.data.name}`, 'yellow');
    log(`  Email: ${res.data.email}`, 'yellow');
    return true;
  } catch (err) {
    log(`✗ Get user profile failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testUpdateUserProfile() {
  log('\n=== Testing Update User Profile ===', 'cyan');
  try {
    const res = await api.put('/users/me', {
      location: 'Eastern Cape',
      educationLevel: 'undergraduate',
      bio: 'Test user bio'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    log(`✓ User profile updated`, 'green');
    log(`  Location: ${res.data.location}`, 'yellow');
    return true;
  } catch (err) {
    log(`✗ Update user profile failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testCreateOpportunity() {
  log('\n=== Testing Create Opportunity (Admin) ===', 'cyan');
  try {
    const oppData = {
      title: 'Test Bursary Application 2026',
      description: 'This is a test bursary opportunity for undergraduate students in Eastern Cape.',
      category: 'bursary',
      subcategory: 'Undergraduate',
      organization: 'Test Foundation',
      location: 'Eastern Cape',
      deadline: '2026-12-31',
      amount: 'R50,000',
      fundingType: 'Full',
      eligibility: 'South African citizens',
      requirements: ['Matric certificate', 'Proof of residence', 'ID document'],
      tags: ['bursary', 'undergraduate', 'eastern-cape']
    };
    
    const res = await api.post('/admin/opportunities', oppData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    opportunityId = res.data.opportunity._id;
    log(`✓ Opportunity created successfully`, 'green');
    log(`  ID: ${opportunityId}`, 'yellow');
    log(`  Title: ${res.data.opportunity.title}`, 'yellow');
    return true;
  } catch (err) {
    log(`✗ Create opportunity failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testGetOpportunities() {
  log('\n=== Testing Get Opportunities (Public) ===', 'cyan');
  try {
    const res = await api.get('/opportunities?category=bursary');
    log(`✓ Retrieved ${res.data.opportunities?.length || res.data.length} opportunities`, 'green');
    return true;
  } catch (err) {
    log(`✗ Get opportunities failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testApplyToOpportunity() {
  log('\n=== Testing Apply to Opportunity ===', 'cyan');
  try {
    const res = await api.post(`/opportunities/${opportunityId}/apply`, {
      coverLetter: 'I am very interested in this opportunity...',
      answers: [
        { question: 'Why do you want this bursary?', answer: 'To pursue my studies' }
      ]
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    log(`✓ Application submitted successfully`, 'green');
    return true;
  } catch (err) {
    log(`✗ Apply to opportunity failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testGetUserApplications() {
  log('\n=== Testing Get User Applications ===', 'cyan');
  try {
    const res = await api.get('/users/me/applications', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    log(`✓ Retrieved ${res.data.length} applications`, 'green');
    return true;
  } catch (err) {
    log(`✗ Get user applications failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testAdminGetStats() {
  log('\n=== Testing Admin Get Stats ===', 'cyan');
  try {
    const res = await api.get('/admin/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    log(`✓ Admin stats retrieved`, 'green');
    log(`  Total Users: ${res.data.totalUsers}`, 'yellow');
    log(`  Total Opportunities: ${res.data.totalOpportunities}`, 'yellow');
    return true;
  } catch (err) {
    log(`✗ Get admin stats failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testAdminGetUsers() {
  log('\n=== Testing Admin Get Users ===', 'cyan');
  try {
    const res = await api.get('/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    log(`✓ Retrieved ${res.data.users?.length || res.data.length} users`, 'green');
    return true;
  } catch (err) {
    log(`✗ Get admin users failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

async function testAdminGetOpportunities() {
  log('\n=== Testing Admin Get Opportunities ===', 'cyan');
  try {
    const res = await api.get('/admin/opportunities', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    log(`✓ Retrieved ${res.data.opportunities?.length || res.data.length} opportunities`, 'green');
    return true;
  } catch (err) {
    log(`✗ Get admin opportunities failed: ${err.response?.data?.message || err.message}`, 'red');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  log('\n╔══════════════════════════════════════════╗', 'cyan');
  log('║   YouthPortal Backend API Test Suite   ║', 'cyan');
  log('╚══════════════════════════════════════════╝', 'cyan');
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  const tests = [
    testHealthCheck,
    testUserRegistration,
    testAdminRegistration,
    testUserLogin,
    testGetUserProfile,
    testUpdateUserProfile,
    testCreateOpportunity,
    testGetOpportunities,
    testApplyToOpportunity,
    testGetUserApplications,
    testAdminGetStats,
    testAdminGetUsers,
    testAdminGetOpportunities
  ];
  
  for (const test of tests) {
    const passed = await test();
    if (passed) results.passed++;
    else results.failed++;
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between tests
  }
  
  log('\n╔══════════════════════════════════════════╗', 'cyan');
  log(`║  Test Summary: ${results.passed} passed, ${results.failed} failed         ║`, 
    results.failed === 0 ? 'green' : 'yellow');
  log('╚══════════════════════════════════════════╝', 'cyan');
  
  if (results.failed === 0) {
    log('\n✓ All tests passed! Backend is fully functional.', 'green');
  } else {
    log(`\n⚠ ${results.failed} test(s) failed. Check the output above.`, 'yellow');
  }
}

// Run the tests
runAllTests().catch(err => {
  log(`\n✗ Test suite failed: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
