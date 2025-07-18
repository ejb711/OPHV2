#!/bin/bash

# Quick Firestore Index Fix - One-liner script
# Opens Firebase Console directly to index creation page

PROJECT_ID="ophv2-98d15"  # Change this to your project ID

echo "🚀 Opening Firebase Console for index creation..."
echo "📋 Project: $PROJECT_ID"
echo ""

# Main Firestore Indexes page
INDEXES_URL="https://console.firebase.google.com/project/${PROJECT_ID}/firestore/indexes"

# Create Index page (pre-filled for audit_logs collection)
CREATE_URL="https://console.firebase.google.com/project/${PROJECT_ID}/firestore/indexes?create_composite"

echo "🔗 Opening Firebase Console..."
echo "   URL: $INDEXES_URL"
echo ""

# Try to open in browser
if command -v open &> /dev/null; then
    # macOS
    open "$INDEXES_URL"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "$INDEXES_URL"
elif command -v start &> /dev/null; then
    # Windows (Git Bash)
    start "$INDEXES_URL"
else
    echo "⚠️  Could not auto-open browser. Please manually visit:"
    echo "   $INDEXES_URL"
fi

echo ""
echo "📝 Manual Index Creation Steps:"
echo "   1. Click 'Create Index' in the Firebase Console"
echo "   2. Collection Group: audit_logs"
echo "   3. Add these fields in order:"
echo "      - compressed (Ascending)"
echo "      - timestamp (Ascending)"
echo "   4. Click 'Create' and wait 5-30 minutes"
echo ""
echo "✅ After index is created, test your manual cleanup again!"

# Optional: Also create the firestore.indexes.json for CLI deployment
if [ "$1" = "--create-file" ]; then
    echo ""
    echo "📄 Creating firestore.indexes.json..."
    
    cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "compressed",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF
    
    echo "✅ Created firestore.indexes.json"
    echo "🚀 Deploy with: firebase deploy --only firestore:indexes"
fi