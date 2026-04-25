#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================="
echo "🚀 Tabylga App Setup & Start Script 🚀"
echo "========================================="

echo "\n📦 Step 1: Installing dependencies..."
npm install

echo "\n🧹 Step 2: Clearing Metro bundler cache to prevent errors..."
# This helps resolve issues like "Cannot find module 'babel-preset-expo'" 
# or remote update downloading failures.

echo "\n📲 Step 3: Starting Expo development server..."
echo "💡 TIP: Once it starts, press 'w' to open in browser (Laptop)."
echo "💡 TIP: Scan the QR code with the Expo Go app to open on Phone."
echo "=========================================\n"

# Run expo start with cache clear
npm run start -- -c
