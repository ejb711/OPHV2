// scripts/debug-seed-comms-projects.js
// Script to debug current projects and seed new test data with correct format

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../ophv2_key.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Status values that the analytics expects
const EXPECTED_STATUSES = {
  NOT_STARTED: 'not_started',
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  PENDING_APPROVAL: 'pending_approval',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled'
};

// Louisiana regions
const REGIONS = {
  '1': 'Region 1 - Orleans',
  '2': 'Region 2 - Baton Rouge',
  '3': 'Region 3 - Houma',
  '4': 'Region 4 - Lafayette',
  '5': 'Region 5 - Lake Charles',
  '6': 'Region 6 - Alexandria',
  '7': 'Region 7 - Shreveport',
  '8': 'Region 8 - Monroe',
  '9': 'Region 9 - Hammond'
};

// Priority values
const PRIORITIES = ['low', 'medium', 'high'];

async function debugCurrentProjects() {
  console.log('🔍 DEBUGGING CURRENT PROJECTS\n');
  console.log('=' .repeat(80));
  
  try {
    const snapshot = await db.collection('comms_projects').get();
    
    console.log(`Total projects found: ${snapshot.size}\n`);
    
    // Analyze status values
    const statusCounts = {};
    const regionCounts = {};
    const priorityCounts = {};
    
    snapshot.forEach(doc => {
      const project = doc.data();
      
      // Count statuses
      const status = project.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Count regions
      const region = project.region || 'undefined';
      regionCounts[region] = (regionCounts[region] || 0) + 1;
      
      // Count priorities
      const priority = project.priority || 'undefined';
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    });
    
    console.log('📊 STATUS VALUES FOUND:');
    console.log('-'.repeat(40));
    Object.entries(statusCounts).forEach(([status, count]) => {
      const isExpected = Object.values(EXPECTED_STATUSES).includes(status);
      console.log(`  ${status}: ${count} projects ${!isExpected ? '⚠️  (NOT EXPECTED)' : '✅'}`);
    });
    
    console.log('\n📍 REGION VALUES FOUND:');
    console.log('-'.repeat(40));
    Object.entries(regionCounts).forEach(([region, count]) => {
      const isExpected = Object.keys(REGIONS).includes(region);
      console.log(`  ${region}: ${count} projects ${!isExpected ? '⚠️  (NOT EXPECTED)' : '✅'}`);
    });
    
    console.log('\n🎯 PRIORITY VALUES FOUND:');
    console.log('-'.repeat(40));
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      const isExpected = PRIORITIES.includes(priority);
      console.log(`  ${priority}: ${count} projects ${!isExpected ? '⚠️  (NOT EXPECTED)' : '✅'}`);
    });
    
    // Show sample projects
    console.log('\n📋 SAMPLE PROJECTS (First 3):');
    console.log('-'.repeat(80));
    let count = 0;
    snapshot.forEach(doc => {
      if (count < 3) {
        const project = doc.data();
        console.log(`\nProject: ${project.title}`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  Status: "${project.status}" (type: ${typeof project.status})`);
        console.log(`  Region: "${project.region}" (type: ${typeof project.region})`);
        console.log(`  Priority: "${project.priority}" (type: ${typeof project.priority})`);
        console.log(`  Created: ${project.createdAt?.toDate?.() || project.createdAt}`);
        console.log(`  Deleted: ${project.deleted || false}`);
        count++;
      }
    });
    
  } catch (error) {
    console.error('❌ Error debugging projects:', error);
  }
}

async function fixExistingProjects() {
  console.log('\n\n🔧 FIXING EXISTING PROJECTS\n');
  console.log('=' .repeat(80));
  
  const batch = db.batch();
  let fixCount = 0;
  
  try {
    const snapshot = await db.collection('comms_projects').get();
    
    snapshot.forEach(doc => {
      const project = doc.data();
      const updates = {};
      
      // Fix status values
      if (project.status) {
        const statusLower = project.status.toLowerCase().replace(/\s+/g, '_');
        if (Object.values(EXPECTED_STATUSES).includes(statusLower) && project.status !== statusLower) {
          updates.status = statusLower;
          console.log(`  Fixing status: "${project.status}" → "${statusLower}"`);
        }
      }
      
      // Fix region values (extract numeric part)
      if (project.region && project.region.includes('Region')) {
        const regionMatch = project.region.match(/Region (\d)/);
        if (regionMatch) {
          updates.region = regionMatch[1];
          console.log(`  Fixing region: "${project.region}" → "${regionMatch[1]}"`);
        }
      }
      
      // Fix priority values
      if (project.priority && typeof project.priority === 'string') {
        const priorityLower = project.priority.toLowerCase();
        if (PRIORITIES.includes(priorityLower) && project.priority !== priorityLower) {
          updates.priority = priorityLower;
          console.log(`  Fixing priority: "${project.priority}" → "${priorityLower}"`);
        }
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, {
          ...updates,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        fixCount++;
      }
    });
    
    if (fixCount > 0) {
      await batch.commit();
      console.log(`\n✅ Fixed ${fixCount} projects`);
    } else {
      console.log('\n✅ No fixes needed - all projects have correct format');
    }
    
  } catch (error) {
    console.error('❌ Error fixing projects:', error);
  }
}

async function seedNewProjects() {
  console.log('\n\n🌱 SEEDING NEW TEST PROJECTS\n');
  console.log('=' .repeat(80));
  
  const testProjects = [
    // Active projects (should count in analytics)
    {
      title: 'Diabetes Prevention Campaign 2025',
      description: 'Comprehensive diabetes prevention and awareness campaign targeting high-risk populations',
      region: '2', // Baton Rouge
      status: EXPECTED_STATUSES.IN_PROGRESS,
      priority: 'high',
      visibility: 'public',
      tags: ['diabetes', 'prevention', 'chronic-disease'],
      coordinatorId: 'test-user-1',
      coordinatorName: 'John Smith',
      deadline: new Date('2025-03-15'),
      createdBy: 'system',
      createdByEmail: 'system@ophv2.app'
    },
    {
      title: 'Flu Vaccine Distribution Plan',
      description: 'Annual flu vaccine distribution and clinic coordination across all parishes',
      region: '1', // Orleans
      status: EXPECTED_STATUSES.PLANNING,
      priority: 'high',
      visibility: 'organization',
      tags: ['vaccination', 'flu', 'seasonal'],
      coordinatorId: 'test-user-2',
      coordinatorName: 'Jane Doe',
      deadline: new Date('2025-09-01'),
      createdBy: 'system',
      createdByEmail: 'system@ophv2.app'
    },
    {
      title: 'Mental Health Awareness Week',
      description: 'Statewide mental health awareness campaign with focus on youth',
      region: '4', // Lafayette
      status: EXPECTED_STATUSES.REVIEW,
      priority: 'medium',
      visibility: 'public',
      tags: ['mental-health', 'awareness', 'youth'],
      coordinatorId: 'test-user-3',
      coordinatorName: 'Mike Johnson',
      deadline: new Date('2025-05-10'),
      createdBy: 'system',
      createdByEmail: 'system@ophv2.app'
    },
    {
      title: 'Rural Health Clinic Expansion',
      description: 'Planning for new rural health clinics in underserved areas',
      region: '6', // Alexandria
      status: EXPECTED_STATUSES.IN_PROGRESS,
      priority: 'high',
      visibility: 'coordinators',
      tags: ['rural-health', 'infrastructure', 'access'],
      coordinatorId: 'test-user-4',
      coordinatorName: 'Sarah Williams',
      deadline: new Date('2025-12-31'),
      createdBy: 'system',
      createdByEmail: 'system@ophv2.app'
    },
    {
      title: 'Maternal Health Initiative',
      description: 'Improving maternal health outcomes through education and support programs',
      region: '3', // Houma
      status: EXPECTED_STATUSES.IN_PROGRESS,
      priority: 'high',
      visibility: 'public',
      tags: ['maternal-health', 'prenatal', 'education'],
      coordinatorId: 'test-user-5',
      coordinatorName: 'Emily Brown',
      deadline: new Date('2025-06-30'),
      createdBy: 'system',
      createdByEmail: 'system@ophv2.app'
    },
    // Projects in other statuses
    {
      title: 'Opioid Crisis Response Plan',
      description: 'Comprehensive response plan for addressing opioid crisis',
      region: '7', // Shreveport
      status: EXPECTED_STATUSES.NOT_STARTED,
      priority: 'high',
      visibility: 'organization',
      tags: ['opioid', 'crisis-response', 'substance-abuse'],
      deadline: new Date('2025-04-01'),
      createdBy: 'system',
      createdByEmail: 'system@ophv2.app'
    },
    {
      title: 'School Health Program 2024',
      description: 'Annual school health screening and vaccination program',
      region: '8', // Monroe
      status: EXPECTED_STATUSES.COMPLETED,
      priority: 'medium',
      visibility: 'public',
      tags: ['schools', 'screening', 'pediatric'],
      completedAt: new Date('2024-12-20'),
      createdBy: 'system',
      createdByEmail: 'system@ophv2.app'
    },
    {
      title: 'Emergency Preparedness Training',
      description: 'Training healthcare workers for emergency response',
      region: '5', // Lake Charles
      status: EXPECTED_STATUSES.PENDING_APPROVAL,
      priority: 'medium',
      visibility: 'coordinators',
      tags: ['emergency', 'training', 'preparedness'],
      deadline: new Date('2025-02-28'),
      createdBy: 'system',
      createdByEmail: 'system@ophv2.app'
    },
    {
      title: 'Community Health Worker Program',
      description: 'Training and deploying community health workers in rural areas',
      region: '9', // Hammond
      status: EXPECTED_STATUSES.IN_PROGRESS,
      priority: 'medium',
      visibility: 'public',
      tags: ['community-health', 'training', 'rural'],
      deadline: new Date('2025-08-15'),
      createdBy: 'system',
      createdByEmail: 'system@ophv2.app'
    },
    {
      title: 'Telehealth Expansion Initiative',
      description: 'Expanding telehealth services to underserved communities',
      region: '2', // Baton Rouge (another one for this region)
      status: EXPECTED_STATUSES.PLANNING,
      priority: 'low',
      visibility: 'organization',
      tags: ['telehealth', 'technology', 'access'],
      deadline: new Date('2025-10-01'),
      createdBy: 'system',
      createdByEmail: 'system@ophv2.app'
    }
  ];
  
  const batch = db.batch();
  
  testProjects.forEach((project, index) => {
    const docRef = db.collection('comms_projects').doc();
    const projectData = {
      ...project,
      id: docRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deleted: false,
      viewCount: Math.floor(Math.random() * 100),
      currentStageIndex: 0,
      stages: ['Planning', 'Implementation', 'Review', 'Launch']
    };
    
    batch.set(docRef, projectData);
    console.log(`  ✅ Creating: ${project.title} (${REGIONS[project.region]}, ${project.status})`);
  });
  
  await batch.commit();
  console.log(`\n✅ Created ${testProjects.length} new test projects`);
}

async function showAnalyticsSummary() {
  console.log('\n\n📊 EXPECTED ANALYTICS SUMMARY\n');
  console.log('=' .repeat(80));
  
  try {
    const snapshot = await db.collection('comms_projects')
      .where('deleted', '==', false)
      .get();
    
    let activeCount = 0;
    let completedCount = 0;
    const regionCounts = {};
    const priorityCounts = { high: 0, medium: 0, low: 0 };
    
    snapshot.forEach(doc => {
      const project = doc.data();
      
      // Count active projects
      if (['planning', 'in_progress', 'review'].includes(project.status)) {
        activeCount++;
      }
      
      // Count completed
      if (project.status === 'completed') {
        completedCount++;
      }
      
      // Count by region
      if (project.region) {
        regionCounts[project.region] = (regionCounts[project.region] || 0) + 1;
      }
      
      // Count by priority
      if (project.priority && priorityCounts.hasOwnProperty(project.priority)) {
        priorityCounts[project.priority]++;
      }
    });
    
    console.log(`Total Projects: ${snapshot.size}`);
    console.log(`Active Projects: ${activeCount} (planning, in_progress, review)`);
    console.log(`Completed Projects: ${completedCount}`);
    console.log(`Completion Rate: ${snapshot.size > 0 ? Math.round((completedCount / snapshot.size) * 100) : 0}%`);
    
    console.log('\nRegional Distribution:');
    Object.entries(regionCounts).forEach(([region, count]) => {
      const percentage = Math.round((count / snapshot.size) * 100);
      console.log(`  ${REGIONS[region] || `Region ${region}`}: ${count} projects (${percentage}%)`);
    });
    
    console.log('\nPriority Distribution:');
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      console.log(`  ${priority}: ${count} projects`);
    });
    
  } catch (error) {
    console.error('❌ Error calculating analytics:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Communications Dashboard Debug & Seed Script\n');
  
  // Step 1: Debug current state
  await debugCurrentProjects();
  
  // Ask user what to do
  console.log('\n\n📋 OPTIONS:');
  console.log('1. Fix existing projects only');
  console.log('2. Fix existing projects AND add new test data');
  console.log('3. Just add new test data');
  console.log('4. Exit without changes');
  
  // For automated execution, we'll do option 2 (fix and seed)
  const option = process.argv[2] || '2';
  
  switch(option) {
    case '1':
      await fixExistingProjects();
      break;
    case '2':
      await fixExistingProjects();
      await seedNewProjects();
      break;
    case '3':
      await seedNewProjects();
      break;
    case '4':
      console.log('\nExiting without changes...');
      process.exit(0);
      break;
    default:
      console.log('\nInvalid option. Running option 2 (fix and seed)...');
      await fixExistingProjects();
      await seedNewProjects();
  }
  
  // Show expected analytics
  await showAnalyticsSummary();
  
  console.log('\n\n✨ Script completed!');
  console.log('Refresh your dashboard to see the updated analytics.');
}

// Run the script
main().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});