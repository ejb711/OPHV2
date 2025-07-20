#!/bin/bash

# OPHV2 Admin Panel User Fix Script
# Fixes the issue where users don't appear in the admin panel

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🔧 OPHV2 Admin Panel User Fix"
echo "=============================="
echo ""
echo "This script fixes the issue where users don't appear in the admin panel"
echo "after the functions update. It will:"
echo ""
echo "1. 📄 Update the UserManagement.vue component (fixed query)"
echo "2. 🗃️  Add status field to existing users"
echo "3. 📊 Deploy new Firestore indexes"
echo "4. 🧪 Test that everything works"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "client/package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Change to client directory if we're in root
if [ -f "client/package.json" ]; then
    cd client
    print_status "Changed to client directory"
fi

# Step 1: Check if UserManagement.vue needs updating
print_status "Checking UserManagement.vue..."

if [ -f "src/components/admin/UserManagement.vue" ]; then
    # Check if the file contains the problematic query
    if grep -q "where('status', '!=', 'deleted')" src/components/admin/UserManagement.vue; then
        print_warning "UserManagement.vue contains the problematic query"
        echo "   Please update it with the fixed version provided"
        echo "   The fixed version uses an OR query to include users without status field"
    else
        print_success "UserManagement.vue appears to be updated"
    fi
else
    print_error "UserManagement.vue not found"
    exit 1
fi

# Step 2: Run user migration script
print_status "Running user status migration..."

if [ -f "../scripts/migrate-user-status.js" ]; then
    cd ..
    if command -v node &> /dev/null; then
        # Check if we're in functions directory or need to be
        if [ -d "functions" ]; then
            cd functions
            print_status "Installing dependencies in functions directory..."
            npm install --silent
            cd ..
        fi
        
        print_status "Running migration script..."
        node scripts/migrate-user-status.js
    else
        print_error "Node.js not found. Please install Node.js to run the migration"
        print_status "Alternative: Manually add status field to users in Firestore Console"
    fi
    cd client
else
    print_warning "Migration script not found at ../scripts/migrate-user-status.js"
    print_status "You may need to manually add status field to existing users"
fi

# Step 3: Deploy Firestore indexes
print_status "Deploying Firestore indexes..."

cd ..

# Check if firestore.indexes.json exists and is updated
if [ -f "firestore.indexes.json" ]; then
    if grep -q '"collectionGroup": "users"' firestore.indexes.json; then
        print_success "firestore.indexes.json contains user indexes"
    else
        print_warning "firestore.indexes.json may need updating"
        echo "   Please ensure it includes the user collection indexes"
    fi
else
    print_warning "firestore.indexes.json not found"
    echo "   Please create it with the provided indexes configuration"
fi

# Deploy indexes if Firebase CLI is available
if command -v firebase &> /dev/null; then
    print_status "Deploying indexes with Firebase CLI..."
    
    # Check if user is logged in
    if firebase projects:list &> /dev/null 2>&1; then
        firebase deploy --only firestore:indexes
        print_success "Indexes deployed successfully"
        print_warning "Indexes may take 5-30 minutes to build"
    else
        print_warning "Not logged in to Firebase CLI"
        echo "   Run: firebase login"
        echo "   Then: firebase deploy --only firestore:indexes"
    fi
else
    print_warning "Firebase CLI not found"
    echo "   Install it with: npm install -g firebase-tools"
    echo "   Then run: firebase deploy --only firestore:indexes"
fi

# Step 4: Provide testing instructions
echo ""
print_status "Testing Instructions:"
echo ""
echo "1. 🌐 Open your admin panel in a browser"
echo "2. 👥 Navigate to User Management section" 
echo "3. ✅ Verify that all users are now visible"
echo "4. 🔧 If users still don't appear:"
echo "   - Check browser console for errors"
echo "   - Wait for Firestore indexes to finish building (5-30 min)"
echo "   - Verify the migration script ran successfully"

echo ""
print_status "If you continue to have issues:"
echo ""
echo "📋 Manual steps:"
echo "1. In Firestore Console, add 'status: active' field to users without it"
echo "2. Update UserManagement.vue with the fixed query (provided above)"
echo "3. Create composite indexes for users collection"
echo ""
echo "🔗 Firestore Console: https://console.firebase.google.com/project/$(firebase projects:list --json 2>/dev/null | jq -r '.[0].projectId' 2>/dev/null || echo 'your-project-id')/firestore/data"

echo ""
print_success "Fix script completed!"
echo ""

# Final status check
cd client
if [ -f "src/components/admin/UserManagement.vue" ]; then
    if ! grep -q "where('status', '!=', 'deleted')" src/components/admin/UserManagement.vue; then
        print_success "✅ UserManagement.vue query appears to be fixed"
    else
        print_error "❌ UserManagement.vue still contains problematic query"
    fi
fi

echo "🎉 Users should now appear in your admin panel!"
echo "   If not, check the Firestore index build status in Firebase Console"