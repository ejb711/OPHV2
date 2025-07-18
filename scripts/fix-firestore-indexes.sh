#!/bin/bash

# OPHV2 Firestore Index Fix Script
# Automatically creates the required composite indexes for audit log cleanup

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

# Get Firebase project ID
get_project_id() {
    if [ -f ".firebaserc" ]; then
        PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)
    elif [ -f "firebase.json" ]; then
        # Try to extract from firebase.json if available
        PROJECT_ID=$(grep -o '"projectId": "[^"]*"' firebase.json | cut -d'"' -f4 2>/dev/null || echo "")
    fi
    
    if [ -z "$PROJECT_ID" ]; then
        read -p "Enter your Firebase project ID (e.g., ophv2-98d15): " PROJECT_ID
    fi
    
    echo "$PROJECT_ID"
}

# Create firestore.indexes.json with required indexes
create_indexes_file() {
    print_status "Creating firestore.indexes.json with required composite indexes..."
    
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
    },
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "action",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "role",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF
    
    print_success "Created firestore.indexes.json"
}

# Deploy indexes using Firebase CLI
deploy_indexes() {
    print_status "Deploying Firestore indexes using Firebase CLI..."
    
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI not found. Installing..."
        npm install -g firebase-tools
    fi
    
    # Check if user is logged in
    if ! firebase projects:list &> /dev/null; then
        print_warning "Not logged in to Firebase. Please login..."
        firebase login
    fi
    
    # Deploy indexes
    print_status "Deploying indexes to Firebase..."
    firebase deploy --only firestore:indexes
    
    if [ $? -eq 0 ]; then
        print_success "Indexes deployed successfully!"
        print_status "Indexes are being built in the background. This may take several minutes."
    else
        print_error "Failed to deploy indexes via CLI"
        return 1
    fi
}

# Generate URLs for manual creation
generate_console_urls() {
    local project_id=$1
    
    print_status "Generating Firebase Console URLs for manual index creation..."
    
    echo ""
    echo "🔗 Firebase Console URLs:"
    echo ""
    echo "1. Main Firestore Indexes page:"
    echo "   https://console.firebase.google.com/project/${project_id}/firestore/indexes"
    echo ""
    echo "2. Create Index page:"
    echo "   https://console.firebase.google.com/project/${project_id}/firestore/indexes?create_composite=Ck5wcm9qZWN0cy8ke3Byb2plY3RJZH0vZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2F1ZGl0X2xvZ3MvaW5kZXhlcy9fEAEaEAoKY29tcHJlc3NlZBABGg0KCXRpbWVzdGFtcBABGgwKCF9fbmFtZV9fEAE"
    echo ""
    echo "📋 Manual Steps:"
    echo "   1. Click the 'Create Index' URL above"
    echo "   2. Or go to Firestore > Indexes > Create Index"
    echo "   3. Collection: audit_logs"
    echo "   4. Fields:"
    echo "      - compressed (Ascending)"
    echo "      - timestamp (Ascending)"
    echo "      - __name__ (Ascending) [auto-added]"
    echo ""
}

# Open URLs in browser (if supported)
open_browser() {
    local project_id=$1
    local main_url="https://console.firebase.google.com/project/${project_id}/firestore/indexes"
    
    print_status "Attempting to open Firebase Console in browser..."
    
    # Try different commands based on OS
    if command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "$main_url" 2>/dev/null &
    elif command -v open &> /dev/null; then
        # macOS
        open "$main_url" 2>/dev/null &
    elif command -v start &> /dev/null; then
        # Windows (Git Bash)
        start "$main_url" 2>/dev/null &
    else
        print_warning "Could not auto-open browser. Please manually visit the URLs above."
        return 1
    fi
    
    print_success "Opened Firebase Console in browser"
}

# Test index creation status
test_indexes() {
    local project_id=$1
    
    print_status "Testing index status..."
    
    # Create a simple Node.js script to test the indexes
    cat > test-indexes.js << 'EOF'
const admin = require('firebase-admin');

// Initialize with project ID from command line
const projectId = process.argv[2];
admin.initializeApp({ projectId });

const db = admin.firestore();

async function testIndexes() {
    try {
        console.log('🔍 Testing audit_logs indexes...');
        
        // Test the problematic query that was causing issues
        const testQuery = db.collection('audit_logs')
            .where('compressed', '==', false)
            .where('timestamp', '<', new Date())
            .limit(1);
        
        const snapshot = await testQuery.get();
        console.log('✅ Composite index working! Query executed successfully.');
        console.log(`📊 Found ${snapshot.size} documents (limit 1 for testing)`);
        
    } catch (error) {
        if (error.code === 9 || error.message.includes('index')) {
            console.log('❌ Index still building or missing. Error:', error.message);
            console.log('🕐 Please wait for index creation to complete (5-30 minutes)');
        } else {
            console.log('❌ Other error:', error.message);
        }
    }
    
    process.exit(0);
}

testIndexes();
EOF
    
    # Run the test if Node.js is available
    if command -v node &> /dev/null && [ -d "functions" ]; then
        print_status "Running index test..."
        cd functions && node ../test-indexes.js "$project_id" && cd ..
        rm -f test-indexes.js
    else
        print_warning "Cannot test indexes (Node.js not available or functions folder missing)"
        rm -f test-indexes.js
    fi
}

# Main script execution
main() {
    echo "🔧 OPHV2 Firestore Index Fix Script"
    echo "===================================="
    echo ""
    
    # Get project ID
    PROJECT_ID=$(get_project_id)
    print_status "Using Firebase project: $PROJECT_ID"
    echo ""
    
    # Ask user for preferred method
    echo "Choose how to create the required Firestore indexes:"
    echo ""
    echo "1) 🚀 Automatic: Deploy via Firebase CLI (Recommended)"
    echo "2) 🌐 Manual: Open Firebase Console in browser"
    echo "3) 📋 URLs: Show console URLs only"
    echo "4) 🧪 Test: Check if indexes already exist"
    echo "5) 📄 File: Just create firestore.indexes.json file"
    echo ""
    
    read -p "Select option [1-5]: " choice
    
    case $choice in
        1)
            create_indexes_file
            deploy_indexes
            echo ""
            print_status "Index deployment initiated. Testing in 30 seconds..."
            sleep 30
            test_indexes "$PROJECT_ID"
            ;;
        2)
            generate_console_urls "$PROJECT_ID"
            open_browser "$PROJECT_ID"
            ;;
        3)
            generate_console_urls "$PROJECT_ID"
            ;;
        4)
            test_indexes "$PROJECT_ID"
            ;;
        5)
            create_indexes_file
            print_success "firestore.indexes.json created. Run 'firebase deploy --only firestore:indexes' to deploy."
            ;;
        *)
            print_error "Invalid option. Please run the script again."
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Index fix script completed!"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Wait for indexes to build (5-30 minutes)"
    echo "   2. Test manual cleanup in your RetentionMonitor component"
    echo "   3. Monitor Firebase Console for index build status"
    echo ""
}

# Run main function
main "$@"