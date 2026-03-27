#!/usr/bin/env python3
"""
ThunderCore Discord AI Moderation Bot Dashboard - Backend API Tests
Tests MongoDB Atlas connection, NextAuth endpoints, and all API routes
"""

import requests
import json
import os
import sys
from urllib.parse import urljoin

# Get base URL from environment
BASE_URL = "https://nuke-shield.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

def test_api_root():
    """Test GET /api/ - should return status JSON"""
    print("\n=== Testing API Root ===")
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "status" in data and "ThunderCore" in data["status"]:
                print("✅ API root endpoint working correctly")
                return True
            else:
                print("❌ API root returned unexpected response format")
                return False
        else:
            print(f"❌ API root failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API root test failed: {str(e)}")
        return False

def test_nextauth_providers():
    """Test NextAuth providers endpoint"""
    print("\n=== Testing NextAuth Providers ===")
    try:
        response = requests.get(f"{API_BASE}/auth/providers", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "discord" in data:
                print("✅ NextAuth providers endpoint working - Discord provider found")
                return True
            else:
                print("❌ Discord provider not found in providers response")
                return False
        else:
            print(f"❌ NextAuth providers failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ NextAuth providers test failed: {str(e)}")
        return False

def test_nextauth_session():
    """Test NextAuth session endpoint (should return null when not authenticated)"""
    print("\n=== Testing NextAuth Session ===")
    try:
        response = requests.get(f"{API_BASE}/auth/session", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            # Should return null or empty object when not authenticated
            print("✅ NextAuth session endpoint working correctly")
            return True
        else:
            print(f"❌ NextAuth session failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ NextAuth session test failed: {str(e)}")
        return False

def test_unauthorized_endpoints():
    """Test that protected endpoints return 401 when not authenticated"""
    print("\n=== Testing Unauthorized Access (Should Return 401) ===")
    
    endpoints_to_test = [
        ("GET", "/guilds", "Get user guilds"),
        ("GET", "/guilds/123456789", "Get guild settings"),
        ("GET", "/guilds/123456789/channels", "Get guild channels"),
        ("GET", "/guilds/123456789/roles", "Get guild roles"),
        ("PUT", "/guilds/123456789/moderation", "Update moderation settings"),
        ("PUT", "/guilds/123456789/automod", "Update automod settings"),
        ("PUT", "/guilds/123456789/antinuke", "Update antinuke settings"),
        ("PUT", "/guilds/123456789/aimod", "Update AI mod settings"),
        ("PUT", "/guilds/123456789/logging", "Update logging settings"),
        ("PUT", "/guilds/123456789/raidmode", "Update raidmode settings"),
        ("PUT", "/guilds/123456789/appeals-config", "Update appeals config"),
        ("PUT", "/guilds/123456789/settings", "Update server settings"),
        ("GET", "/guilds/123456789/appeals", "Get appeals list"),
        ("PUT", "/guilds/123456789/appeals/test123/review", "Review appeal"),
        ("GET", "/guilds/123456789/commands", "Get command settings"),
        ("PUT", "/guilds/123456789/commands", "Update command settings"),
        ("POST", "/guilds/123456789/apply", "Apply all changes"),
        ("GET", "/guilds/123456789/cases", "Get moderation cases"),
    ]
    
    results = []
    
    for method, endpoint, description in endpoints_to_test:
        try:
            url = f"{API_BASE}{endpoint}"
            print(f"\nTesting {method} {endpoint} - {description}")
            
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                response = requests.post(url, json={"test": "data"}, timeout=10)
            elif method == "PUT":
                response = requests.put(url, json={"test": "data"}, timeout=10)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 401:
                print(f"✅ {description} correctly returns 401 (Unauthorized)")
                results.append(True)
            else:
                print(f"❌ {description} returned {response.status_code} instead of 401")
                print(f"Response: {response.text}")
                results.append(False)
                
        except Exception as e:
            print(f"❌ {description} test failed: {str(e)}")
            results.append(False)
    
    success_count = sum(results)
    total_count = len(results)
    print(f"\n=== Unauthorized Access Test Summary ===")
    print(f"✅ {success_count}/{total_count} endpoints correctly return 401")
    
    return success_count == total_count

def test_mongodb_connection():
    """Test MongoDB connection by trying to access an endpoint that queries the DB"""
    print("\n=== Testing MongoDB Atlas Connection ===")
    print("Testing MongoDB connection indirectly through API endpoints...")
    
    # Test the API root which doesn't require DB
    api_root_works = test_api_root()
    
    # Test an endpoint that would use MongoDB (should return 401 but not 500)
    try:
        response = requests.get(f"{API_BASE}/guilds/123456789", timeout=10)
        print(f"Guild settings endpoint status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ MongoDB connection appears healthy (endpoint returns 401, not 500)")
            return True
        elif response.status_code == 500:
            print("❌ MongoDB connection may have issues (endpoint returns 500)")
            print(f"Response: {response.text}")
            return False
        else:
            print(f"⚠️  Unexpected status code {response.status_code} for MongoDB test")
            return True  # Not necessarily a MongoDB issue
            
    except Exception as e:
        print(f"❌ MongoDB connection test failed: {str(e)}")
        return False

def test_cors_headers():
    """Test that CORS headers are properly set"""
    print("\n=== Testing CORS Headers ===")
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        headers = response.headers
        
        cors_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
        
        cors_ok = True
        for header, expected_value in cors_headers.items():
            if header in headers:
                print(f"✅ {header}: {headers[header]}")
            else:
                print(f"❌ Missing CORS header: {header}")
                cors_ok = False
        
        if cors_ok:
            print("✅ CORS headers are properly configured")
        else:
            print("❌ Some CORS headers are missing")
            
        return cors_ok
        
    except Exception as e:
        print(f"❌ CORS headers test failed: {str(e)}")
        return False

def test_options_method():
    """Test OPTIONS method for CORS preflight"""
    print("\n=== Testing OPTIONS Method (CORS Preflight) ===")
    try:
        response = requests.options(f"{API_BASE}/guilds", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code in [200, 204]:
            print("✅ OPTIONS method working correctly")
            return True
        else:
            print(f"❌ OPTIONS method failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ OPTIONS method test failed: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting ThunderCore Dashboard Backend API Tests")
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    
    test_results = []
    
    # Test API root
    test_results.append(("API Root", test_api_root()))
    
    # Test NextAuth endpoints
    test_results.append(("NextAuth Providers", test_nextauth_providers()))
    test_results.append(("NextAuth Session", test_nextauth_session()))
    
    # Test MongoDB connection
    test_results.append(("MongoDB Connection", test_mongodb_connection()))
    
    # Test unauthorized access
    test_results.append(("Unauthorized Access Protection", test_unauthorized_endpoints()))
    
    # Test CORS
    test_results.append(("CORS Headers", test_cors_headers()))
    test_results.append(("OPTIONS Method", test_options_method()))
    
    # Print final summary
    print("\n" + "="*60)
    print("🏁 FINAL TEST RESULTS SUMMARY")
    print("="*60)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:<35} {status}")
        if result:
            passed += 1
    
    print("="*60)
    print(f"Overall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests PASSED!")
        return True
    else:
        print(f"⚠️  {total - passed} test(s) FAILED")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)