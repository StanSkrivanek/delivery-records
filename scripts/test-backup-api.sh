#!/bin/bash

# Test script for backup system
# Run this after starting the server (pnpm dev)

echo "🧪 Testing Database Backup System"
echo "=================================="
echo ""

BASE_URL="http://localhost:5173"

# Test 1: List backups
echo "📋 Test 1: List all backups"
echo "GET $BASE_URL/api/backup"
curl -s "$BASE_URL/api/backup" | jq '.' || echo "❌ Failed or jq not installed"
echo ""
echo ""

# Test 2: Create backup via GET
echo "📦 Test 2: Create backup via GET"
echo "GET $BASE_URL/api/backup?action=create"
curl -s "$BASE_URL/api/backup?action=create" | jq '.' || echo "❌ Failed or jq not installed"
echo ""
echo ""

# Test 3: Create backup via POST
echo "📦 Test 3: Create backup via POST"
echo "POST $BASE_URL/api/backup"
curl -s -X POST "$BASE_URL/api/backup" \
  -H "Content-Type: application/json" \
  -d '{"action":"create"}' | jq '.' || echo "❌ Failed or jq not installed"
echo ""
echo ""

# Test 4: List backups again (should show new backups)
echo "📋 Test 4: List backups again"
echo "GET $BASE_URL/api/backup"
curl -s "$BASE_URL/api/backup" | jq '.count' || echo "❌ Failed or jq not installed"
echo ""
echo ""

echo "✅ Tests complete!"
echo ""
echo "Note: If you see 'Failed to connect', make sure the server is running:"
echo "  pnpm dev"
echo ""
echo "Note: For pretty JSON output, install jq:"
echo "  brew install jq"
