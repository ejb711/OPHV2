# 🔧 Firestore Index Troubleshooting Guide

## Quick Fix Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `fix-firestore-indexes.sh` | Complete index management | `./fix-firestore-indexes.sh` |
| `create-firestore-indexes.js` | Programmatic testing & creation | `node create-firestore-indexes.js` |
| `quick-index-fix.sh` | One-click Console access | `./quick-index-fix.sh` |

## Common Error Messages

### Error: "The query requires an index"
```
FAILED_PRECONDITION: The query requires an index. 
You can create it here: https://console.firebase.google.com/v1/r/project/ophv2-98d15/...
```

**Fix:** Run `./fix-firestore-indexes.sh` and choose option 1 (Automatic deployment)

### Error: "Missing or insufficient permissions"
```
Missing or insufficient permissions for collection 'audit_logs'
```

**Fix:** Check your Firestore security rules in `firestore.rules`

### Error: "Index is still building"
```
The index for this query is still building and cannot be used yet
```

**Fix:** Wait 5-30 minutes. Use `node create-firestore-indexes.js` and choose option 4 to monitor progress.

## Manual Index Creation Steps

### Via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (ophv2-98d15)
3. Navigate to **Firestore Database** → **Indexes**
4. Click **Create Index**
5. Configure:
   - **Collection Group:** `audit_logs`
   - **Fields:**
     - `compressed` (Ascending)
     - `timestamp` (Ascending)
6. Click **Create**
7. Wait 5-30 minutes for building

### Via Firebase CLI
```bash
# Create firestore.indexes.json (done by script)
firebase deploy --only firestore:indexes

# Monitor deployment
firebase firestore:indexes

# Check specific project
firebase use ophv2-98d15
firebase firestore:indexes
```

## Required Indexes for OPHV2

| Collection | Fields | Purpose |
|------------|--------|---------|
| `audit_logs` | `compressed` (ASC), `timestamp` (ASC) | Audit log compression |
| `audit_logs` | `timestamp` (DESC), `action` (ASC) | Log filtering |
| `audit_logs` | `userId` (ASC), `timestamp` (DESC) | User activity |
| `users` | `role` (ASC), `createdAt` (DESC) | User management |

## Testing Index Status

### Quick Test (JavaScript)
```javascript
// Test in Firebase Functions shell or Node.js
const query = db.collection('audit_logs')
  .where('compressed', '==', false)
  .where('timestamp', '<', new Date())
  .limit(1);

const snapshot = await query.get();
console.log('Index working:', snapshot.size >= 0);
```

### Using Scripts
```bash
# Test all indexes
node create-firestore-indexes.js
# Choose option 1 (Diagnose)

# Monitor progress
node create-firestore-indexes.js  
# Choose option 4 (Monitor)
```

## Index Building Times

| Collection Size | Typical Build Time |
|----------------|-------------------|
| < 1,000 docs   | 2-5 minutes      |
| 1K - 10K docs  | 5-15 minutes     |
| 10K - 100K docs| 15-30 minutes    |
| > 100K docs    | 30+ minutes      |

## Troubleshooting Checklist

- [ ] **Firebase CLI installed:** `npm install -g firebase-tools`
- [ ] **Logged into Firebase:** `firebase login`
- [ ] **Correct project selected:** `firebase use ophv2-98d15`
- [ ] **firestore.indexes.json exists** (created by script)
- [ ] **Indexes deployed:** `firebase deploy --only firestore:indexes`
- [ ] **Wait for build completion** (5-30 minutes)
- [ ] **Test queries work** (use diagnostic script)

## Emergency Workarounds

### If indexes won't build:
1. **Use optimized functions** (already implemented in revised `functions/index.js`)
2. **Smaller batch sizes** (set `CLEANUP_BATCH_SIZE = 50`)
3. **Simple queries only** (avoid compound WHERE clauses)

### If console access fails:
```bash
# Direct URL construction
PROJECT_ID="ophv2-98d15"
open "https://console.firebase.google.com/project/${PROJECT_ID}/firestore/indexes"
```

### If CLI deployment fails:
```bash
# Re-authenticate
firebase logout
firebase login

# Check project
firebase projects:list
firebase use ophv2-98d15

# Force re-deploy
rm -f .firebase/hosting.* 
firebase deploy --only firestore:indexes --force
```

## Getting Help

### Check Index Status
- **Firebase Console:** Firestore → Indexes
- **CLI:** `firebase firestore:indexes`
- **Script:** `node create-firestore-indexes.js` (option 1)

### Logs to Check
- **Functions logs:** Firebase Console → Functions → Logs
- **Browser console:** F12 → Console tab
- **Terminal output:** From scripts above

### Contact Points
- **Firebase Support:** Firebase Console → Help
- **Stack Overflow:** Tag with `firebase` + `firestore-indexes`
- **GitHub Issues:** Check OPHV2 repository

---

## Quick Commands Reference

```bash
# Run complete fix
./fix-firestore-indexes.sh

# Open console quickly  
./quick-index-fix.sh

# Test and monitor
node create-firestore-indexes.js

# Deploy via CLI
firebase deploy --only firestore:indexes

# Check status
firebase firestore:indexes
```

**📌 Pro Tip:** Bookmark this guide and the Firebase Console indexes page for quick access during development!