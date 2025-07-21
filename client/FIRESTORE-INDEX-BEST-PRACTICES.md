# Firestore Index Best Practices for OPHV2

## 🎯 Core Principles

### 1. Only Index What You Query
- Don't create indexes for queries you don't use
- Client-side filtering doesn't need indexes
- Simple queries often don't need composite indexes

### 2. Current OPHV2 Query Patterns

#### ✅ Queries That Need Indexes:
```javascript
// Audit log compression (REQUIRED)
db.collection('audit_logs')
  .where('compressed', '==', false)
  .where('timestamp', '<', cutoffDate)

// User-specific audit logs (REQUIRED)
db.collection('audit_logs')
  .where('userId', '==', userId)
  .orderBy('timestamp', 'desc')

// Retention tier queries (REQUIRED)
db.collection('audit_logs')
  .where('retentionTier', '==', 'full')
  .where('timestamp', '<', cutoffDate)
```

#### ❌ Queries That DON'T Need Indexes:
```javascript
// UserManagement.vue - loads all users
collection(db, 'users')  // No where/orderBy = no index needed

// Client-side filtering
users.value.filter(user => user.role === roleFilter)  // JavaScript, not Firestore
```

## 🛠️ Development Workflow

### Before Creating New Queries:

1. **Check if filtering can be client-side**
   - For small collections (<1000 docs), client-side is often better
   - UserManagement loads all users anyway

2. **Use existing patterns**
   - Reuse existing indexed fields when possible
   - Avoid creating similar but slightly different queries

3. **Test locally first**
   - Firestore emulator helps catch missing indexes
   - Don't let auto-created indexes accumulate

## 📋 Index Management Checklist

### When Adding New Features:
- [ ] Document required queries in code comments
- [ ] Update firestore.indexes.json manually
- [ ] Test with emulator before deploying
- [ ] Review existing indexes for overlap

### Periodic Maintenance (Monthly):
- [ ] Run the cleanup script to analyze usage
- [ ] Remove indexes for deleted features
- [ ] Consolidate similar query patterns
- [ ] Update this documentation

## 🚫 Common Mistakes to Avoid

### 1. Auto-Creating Indexes in Console
```javascript
// ❌ BAD: Clicking "Create Index" for every failed query
// Results in duplicate/unnecessary indexes

// ✅ GOOD: Analyze if the query is really needed first
```

### 2. Over-Indexing for Future Use
```javascript
// ❌ BAD: Creating indexes "just in case"
{
  fields: ["status", "role", "createdAt", "email"]  // Too specific
}

// ✅ GOOD: Only index what you query now
{
  fields: ["compressed", "timestamp"]  // Actual query pattern
}
```

### 3. Not Cleaning Up After Refactoring
```javascript
// If you change from:
where('status', '==', 'active').where('role', '==', 'admin')

// To client-side filtering:
users.filter(u => u.status === 'active' && u.role === 'admin')

// Remember to remove the now-unused index!
```

## 🔍 How to Identify Redundant Indexes

### Signs of Redundancy:
1. Multiple indexes with same fields in different orders
2. Indexes for queries that don't exist in code
3. Very specific multi-field indexes with low usage
4. Indexes that overlap with simpler ones

### Example:
```json
// These are redundant:
{
  "fields": [
    { "fieldPath": "role", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
},
{
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "role", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
// If you only query by status+role+createdAt, you don't need the first index
```

## 📊 Current OPHV2 Index Requirements

### Essential Indexes (Keep These):
```json
{
  "indexes": [
    {
      "collectionGroup": "audit_logs",
      "fields": [
        { "fieldPath": "compressed", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "audit_logs",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "audit_logs",
      "fields": [
        { "fieldPath": "retentionTier", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Why Users Collection Doesn't Need Indexes:
- UserManagement.vue loads all users: `collection(db, 'users')`
- Filtering happens in computed properties (client-side)
- No complex queries in current implementation

## 🔧 Maintenance Scripts

### Monthly Cleanup:
```bash
# 1. Analyze current usage
node scripts/cleanup-firestore-indexes.js

# 2. Review and update firestore.indexes.json

# 3. Deploy changes
firebase deploy --only firestore:indexes

# 4. Monitor in Firebase Console
```

### After Major Refactoring:
```bash
# Search for Firestore queries in codebase
grep -r "where(" --include="*.js" --include="*.vue" client/src/
grep -r "orderBy(" --include="*.js" --include="*.vue" client/src/

# Compare with firestore.indexes.json
# Remove indexes for queries that no longer exist
```

## 📚 Resources

- [Firestore Index Best Practices](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [Index Limits and Pricing](https://firebase.google.com/docs/firestore/quotas#indexes)
- OPHV2 Cleanup Script: `scripts/cleanup-firestore-indexes.js`

---

**Remember**: Every index has a cost. Only create what you actually use!