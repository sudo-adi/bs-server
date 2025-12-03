#!/bin/bash

# Test notification API with superadmin token

echo "🔍 Testing Notification API..."
echo ""

# First, login to get token
echo "1. Logging in as superadmin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "Admin@123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Test notifications endpoint
echo "2. Fetching notifications..."
NOTIF_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/v1/notifications?limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "✅ Response received:"
echo $NOTIF_RESPONSE | jq '.'
echo ""

# Count notifications
COUNT=$(echo $NOTIF_RESPONSE | jq '.data.notifications | length')
echo "📊 Found $COUNT notifications"
echo ""

# Test unread count
echo "3. Fetching unread count..."
UNREAD_RESPONSE=$(curl -s -X GET "http://localhost:3000/api/v1/notifications/unread/count" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "✅ Unread count response:"
echo $UNREAD_RESPONSE | jq '.'
