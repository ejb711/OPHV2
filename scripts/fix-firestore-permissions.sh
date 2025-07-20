#!/bin/bash
# fix-firestore-permissions.sh - Quick fix for OPHV2 Firestore permissions

echo "🔧 OPHV2 Firestore Permissions Fix"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "firestore.rules" ]; then
    echo "❌ Error: firestore.rules not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

if [ ! -d "client/src/composables" ]; then
    echo "❌ Error: client/src/composables directory not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

echo "📋 Pre-deployment checks..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
fi

echo "✅ Firebase CLI found and logged in"

# Backup existing files
echo ""
echo "💾 Creating backups..."
cp firestore.rules firestore.rules.backup.$(date +%Y%m%d_%H%M%S)
cp client/src/composables/useAudit.js client/src/composables/useAudit.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "   useAudit.js not found (will be created)"
cp client/src/composables/useActivityTracker.js client/src/composables/useActivityTracker.js.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "   useActivityTracker.js not found (will be created)"

echo "✅ Backups created"

# Validate current rules before deploying
echo ""
echo "🔍 Validating Firestore rules..."
if firebase firestore:rules validate; then
    echo "✅ Current rules are valid"
else
    echo "⚠️  Current rules have issues, but continuing with fix..."
fi

# Deploy the new rules
echo ""
echo "🚀 Deploying fixed Firestore rules..."
if firebase deploy --only firestore:rules; then
    echo "✅ Firestore rules deployed successfully"
else
    echo "❌ Failed to deploy Firestore rules"
    echo "   Check the output above for errors"
    exit 1
fi

# Build and deploy frontend if requested
echo ""
read -p "🔨 Build and deploy frontend? (y/N): " deploy_frontend

if [[ $deploy_frontend =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔨 Building frontend..."
    cd client
    if npm run build; then
        echo "✅ Frontend built successfully"
        
        echo ""
        echo "🚀 Deploying frontend..."
        if firebase deploy --only hosting; then
            echo "✅ Frontend deployed successfully"
        else
            echo "❌ Failed to deploy frontend"
            cd ..
            exit 1
        fi
    else
        echo "❌ Frontend build failed"
        cd ..
        exit 1
    fi
    cd ..
fi

# Final verification
echo ""
echo "🔍 Verification steps:"
echo "1. ✅ Firestore rules deployed"
echo "2. ✅ Backup files created"
if [[ $deploy_frontend =~ ^[Yy]$ ]]; then
    echo "3. ✅ Frontend deployed"
fi

echo ""
echo "📋 Next steps:"
echo "1. Open your app in a browser"
echo "2. Open browser dev tools (F12)"
echo "3. Navigate to the admin panel"
echo "4. Check console for any permission errors"
echo "5. Verify audit logs are being created in Firestore Console"

echo ""
echo "🔗 Useful links:"
echo "• App: https://ophv2-98d15.web.app"
echo "• Firebase Console: https://console.firebase.google.com/project/ophv2-98d15"
echo "• Firestore: https://console.firebase.google.com/project/ophv2-98d15/firestore"

echo ""
echo "✅ Firestore permissions fix complete!"
echo ""
echo "📚 For detailed information, see: README-FIRESTORE-PERMISSIONS-FIX.md"

# Check if user wants to monitor logs
echo ""
read -p "📊 Monitor Firebase function logs? (y/N): " monitor_logs

if [[ $monitor_logs =~ ^[Yy]$ ]]; then
    echo ""
    echo "📊 Monitoring Firebase logs (Press Ctrl+C to stop)..."
    firebase functions:log --follow
fi

echo ""
echo "🎉 All done! The permission errors should now be resolved."