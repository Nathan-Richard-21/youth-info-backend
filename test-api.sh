#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5001/api"
PASSED=0
FAILED=0

# Test counter
test_count=0

# Function to run test
run_test() {
    test_count=$((test_count + 1))
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local headers="$5"
    
    echo -e "\n${CYAN}=== Test $test_count: $name ===${NC}"
    
    if [ -n "$data" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "$headers" \
                -d "$data" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" 2>&1)
        fi
    else
        if [ -n "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
                -H "$headers" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" 2>&1)
        fi
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" =~ ^2[0-9]{2}$ ]]; then
        echo -e "${GREEN}✓ PASSED (HTTP $http_code)${NC}"
        PASSED=$((PASSED + 1))
        if [ -n "$body" ]; then
            echo -e "${YELLOW}Response: $(echo "$body" | head -c 100)...${NC}"
        fi
        return 0
    else
        echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
        FAILED=$((FAILED + 1))
        if [ -n "$body" ]; then
            echo -e "${RED}Error: $body${NC}"
        fi
        return 1
    fi
}

echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   YouthPortal Backend API Test Suite   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"

# Test 1: Health Check
run_test "Health Check" "GET" "/health"

# Test 2: User Registration
echo -e "\n${CYAN}Registering test user...${NC}"
user_response=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test User",
        "email": "testuser'$(date +%s)'@example.com",
        "password": "password123"
    }')

USER_TOKEN=$(echo "$user_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$USER_TOKEN" ]; then
    echo -e "${GREEN}✓ User registered successfully${NC}"
    echo -e "${YELLOW}Token: ${USER_TOKEN:0:20}...${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ User registration failed${NC}"
    echo -e "${RED}Response: $user_response${NC}"
    FAILED=$((FAILED + 1))
fi

# Test 3: Get User Profile
if [ -n "$USER_TOKEN" ]; then
    run_test "Get User Profile" "GET" "/users/me" "" "Authorization: Bearer $USER_TOKEN"
fi

# Test 4: Update User Profile
if [ -n "$USER_TOKEN" ]; then
    run_test "Update User Profile" "PUT" "/users/me" \
        '{"location": "Eastern Cape", "educationLevel": "undergraduate", "bio": "Test user bio"}' \
        "Authorization: Bearer $USER_TOKEN"
fi

# Test 5: Update User Preferences
if [ -n "$USER_TOKEN" ]; then
    run_test "Update User Preferences" "PUT" "/users/me/preferences" \
        '{"emailNotifications": true, "bursaryAlerts": true, "preferredCategories": ["bursary", "career"]}' \
        "Authorization: Bearer $USER_TOKEN"
fi

# Test 6: Create Opportunity (as user - should be pending)
if [ -n "$USER_TOKEN" ]; then
    opp_response=$(curl -s -X POST "$BASE_URL/opportunities" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d '{
            "title": "Test Career Opportunity",
            "description": "This is a test career opportunity for software developers.",
            "category": "career",
            "subcategory": "IT & Technology",
            "organization": "Tech Company",
            "location": "Port Elizabeth",
            "deadline": "2026-12-31",
            "employmentType": "Full-time",
            "salary": "R15,000 - R25,000",
            "requirements": ["Matric", "Relevant qualification"],
            "tags": ["career", "it", "software"]
        }')
    
    OPP_ID=$(echo "$opp_response" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$OPP_ID" ]; then
        echo -e "${GREEN}✓ Opportunity created (ID: $OPP_ID)${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ Create opportunity failed${NC}"
        echo -e "${RED}Response: $opp_response${NC}"
        FAILED=$((FAILED + 1))
    fi
fi

# Test 7: Get Opportunities (Public)
run_test "Get All Opportunities" "GET" "/opportunities"

# Test 8: Get Opportunities by Category
run_test "Get Bursary Opportunities" "GET" "/opportunities?category=bursary"

# Test 9: Get Opportunities by Location (URL encode spaces)
run_test "Get Opportunities in Eastern Cape" "GET" "/opportunities?location=Eastern%20Cape"

# Test 10: Search Opportunities
run_test "Search Opportunities" "GET" "/opportunities?search=bursary"

# Test 11: Get Single Opportunity
if [ -n "$OPP_ID" ]; then
    run_test "Get Single Opportunity" "GET" "/opportunities/$OPP_ID"
fi

# Test 12: Save Opportunity
if [ -n "$USER_TOKEN" ] && [ -n "$OPP_ID" ]; then
    run_test "Save Opportunity" "POST" "/opportunities/$OPP_ID/save" "" "Authorization: Bearer $USER_TOKEN"
fi

# Test 13: Get Saved Opportunities
if [ -n "$USER_TOKEN" ]; then
    run_test "Get Saved Opportunities" "GET" "/users/me/saved" "" "Authorization: Bearer $USER_TOKEN"
fi

# Test 14: Apply to Opportunity
if [ -n "$USER_TOKEN" ] && [ -n "$OPP_ID" ]; then
    run_test "Apply to Opportunity" "POST" "/opportunities/$OPP_ID/apply" \
        '{"coverLetter": "I am very interested in this opportunity", "answers": []}' \
        "Authorization: Bearer $USER_TOKEN"
fi

# Test 15: Get User Applications
if [ -n "$USER_TOKEN" ]; then
    run_test "Get User Applications" "GET" "/users/me/applications" "" "Authorization: Bearer $USER_TOKEN"
fi

# Test 16: Get User's Posted Opportunities
if [ -n "$USER_TOKEN" ]; then
    run_test "Get User's Posted Opportunities" "GET" "/users/me/opportunities" "" "Authorization: Bearer $USER_TOKEN"
fi

# Summary
echo -e "\n${CYAN}╔══════════════════════════════════════════╗${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}║  Test Summary: $PASSED passed, $FAILED failed         ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
    echo -e "\n${GREEN}✓ All tests passed! Backend is functional.${NC}"
else
    echo -e "${YELLOW}║  Test Summary: $PASSED passed, $FAILED failed         ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
    echo -e "\n${YELLOW}⚠ $FAILED test(s) failed. Check the output above.${NC}"
fi

echo -e "\n${CYAN}Note: Admin routes require an admin user. Create one manually in MongoDB:${NC}"
echo -e "${YELLOW}db.users.updateOne({email: 'youremail@example.com'}, {\$set: {role: 'admin'}})${NC}"
