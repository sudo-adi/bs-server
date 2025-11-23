#!/bin/bash

echo "Testing superadmin login..."
curl -s -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@buildsewa.com", "password": "SuperAdmin@123"}' | jq '.'
