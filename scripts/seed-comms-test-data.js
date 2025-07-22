// scripts/seed-comms-test-data.js
// Script to seed test data for Communications Dashboard

const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Test data
const TEST_PROJECTS = [
  {
    id: 'test-project-1',
    title: 'COVID-19 Vaccination Campaign',
    description: 'Statewide campaign to promote COVID-19 vaccination and booster shots',
    region: 'region2', // Capital Area
    status: 'in_progress',
    priority: 'high',
    visibility: 'public',
    stages: [
      { name: 'Planning', status: 'completed', completedAt: new Date('2024-11-01') },
      { name: 'Design', status: 'completed', completedAt: new Date('2024-11-15') },
      { name: 'Review', status: 'in_progress', startedAt: new Date('2024-11-20') },
      { name: 'Approval', status: 'not_started' },
      { name: 'Launch', status: 'not_started' }
    ],
    assignedCoordinators: ['test-coordinator-1'],
    tags: ['vaccination', 'covid-19', 'public-health'],
    sharedWith: [],
    createdBy: 'system',
    createdAt: new Date('2024-11-01'),
    updatedAt: new Date('2024-11-25'),
    deadline: new Date('2024-12-15'),
    budget: 50000,
    targetAudience: 'General public, ages 18+',
    deliverables: ['Social media graphics', 'Print materials', 'Radio spots']
  },
  {
    id: 'test-project-2',
    title: 'Hurricane Preparedness Guide 2025',
    description: 'Annual hurricane preparedness materials for coastal parishes',
    region: 'region1', // Southeast Louisiana
    status: 'planning',
    priority: 'medium',
    visibility: 'public',
    stages: [
      { name: 'Research', status: 'in_progress', startedAt: new Date('2024-11-20') },
      { name: 'Content Creation', status: 'not_started' },
      { name: 'Translation', status: 'not_started' },
      { name: 'Review', status: 'not_started' },
      { name: 'Distribution', status: 'not_started' }
    ],
    assignedCoordinators: ['test-coordinator-2'],
    tags: ['hurricane', 'emergency', 'preparedness'],
    sharedWith: [],
    createdBy: 'system',
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-11-22'),
    deadline: new Date('2025-05-01'),
    budget: 75000,
    targetAudience: 'Coastal parish residents',
    deliverables: ['Printed guides', 'Website content', 'Mobile app updates']
  },
  {
    id: 'test-project-3',
    title: 'Maternal Health Awareness Campaign',
    description: 'Campaign to promote maternal health services in rural parishes',
    region: 'region4', // Acadiana
    status: 'pending_approval',
    priority: 'high',
    visibility: 'coordinators',
    stages: [
      { name: 'Research', status: 'completed', completedAt: new Date('2024-10-15') },
      { name: 'Strategy', status: 'completed', completedAt: new Date('2024-11-01') },
      { name: 'Creative Development', status: 'completed', completedAt: new Date('2024-11-20') },
      { name: 'Approval', status: 'in_progress', startedAt: new Date('2024-11-21') },
      { name: 'Implementation', status: 'not_started' }
    ],
    assignedCoordinators: ['test-coordinator-3'],
    tags: ['maternal-health', 'rural-health', 'women'],
    sharedWith: [],
    createdBy: 'system',
    createdAt: new Date('2024-10-01'),
    updatedAt: new Date('2024-11-24'),
    deadline: new Date('2025-02-01'),
    budget: 100000,
    targetAudience: 'Women of childbearing age in rural areas',
    deliverables: ['Billboard designs', 'Radio scripts', 'Community event materials']
  },
  {
    id: 'test-project-4',
    title: 'Flu Season Reminder Campaign',
    description: 'Annual flu vaccination reminder campaign',
    region: 'region7', // Northwest Louisiana
    status: 'completed',
    priority: 'medium',
    visibility: 'public',
    stages: [
      { name: 'Planning', status: 'completed', completedAt: new Date('2024-09-01') },
      { name: 'Design', status: 'completed', completedAt: new Date('2024-09-15') },
      { name: 'Production', status: 'completed', completedAt: new Date('2024-10-01') },
      { name: 'Distribution', status: 'completed', completedAt: new Date('2024-10-15') },
      { name: 'Evaluation', status: 'completed', completedAt: new Date('2024-11-15') }
    ],
    assignedCoordinators: ['test-coordinator-4'],
    tags: ['flu', 'vaccination', 'seasonal'],
    sharedWith: [],
    createdBy: 'system',
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date('2024-11-15'),
    completedAt: new Date('2024-11-15'),
    deadline: new Date('2024-11-01'),
    budget: 25000,
    targetAudience: 'Adults 65+, children under 5',
    deliverables: ['Pharmacy posters', 'Social media content', 'Email templates']
  },
  {
    id: 'test-project-5',
    title: 'Mental Health Resources Directory',
    description: 'Comprehensive directory of mental health resources by region',
    region: 'region6', // Central Louisiana
    status: 'draft',
    priority: 'low',
    visibility: 'private',
    stages: [
      { name: 'Data Collection', status: 'not_started' },
      { name: 'Verification', status: 'not_started' },
      { name: 'Design', status: 'not_started' },
      { name: 'Review', status: 'not_started' },
      { name: 'Publication', status: 'not_started' }
    ],
    assignedCoordinators: [],
    tags: ['mental-health', 'resources', 'directory'],
    sharedWith: [],
    createdBy: 'system',
    createdAt: new Date('2024-11-20'),
    updatedAt: new Date('2024-11-20'),
    deadline: new Date('2025-06-01'),
    budget: 15000,
    targetAudience: 'Healthcare providers and general public',
    deliverables: ['Online directory', 'Printable PDF', 'Provider toolkit']
  }
];

const TEST_COORDINATORS = [
  {
    id: 'test-coordinator-1',
    userId: 'test-user-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@la.gov',
    regions: ['region2', 'region3'],
    isActive: true,
    phoneNumber: '(225) 555-0101',
    title: 'Regional Communications Coordinator',
    assignedProjects: 8,
    completedProjects: 45
  },
  {
    id: 'test-coordinator-2',
    userId: 'test-user-2',
    name: 'Michael Chen',
    email: 'michael.chen@la.gov',
    regions: ['region1'],
    isActive: true,
    phoneNumber: '(504) 555-0102',
    title: 'Senior Communications Specialist',
    assignedProjects: 5,
    completedProjects: 32
  },
  {
    id: 'test-coordinator-3',
    userId: 'test-user-3',
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@la.gov',
    regions: ['region4', 'region5'],
    isActive: true,
    phoneNumber: '(337) 555-0103',
    title: 'Communications Manager',
    assignedProjects: 12,
    completedProjects: 67
  },
  {
    id: 'test-coordinator-4',
    userId: 'test-user-4',
    name: 'James Wilson',
    email: 'james.wilson@la.gov',
    regions: ['region7', 'region8', 'region9'],
    isActive: true,
    phoneNumber: '(318) 555-0104',
    title: 'Regional Communications Lead',
    assignedProjects: 10,
    completedProjects: 52
  }
];

const TEST_FILES = [
  {
    id: 'test-file-1',
    projectId: 'test-project-1',
    name: 'COVID-19_Vaccination_Poster_Final.pdf',
    type: 'application/pdf',
    size: 2456789,
    url: 'https://example.com/files/covid-poster.pdf',
    uploadedBy: 'test-coordinator-1',
    uploadedAt: new Date('2024-11-15'),
    version: 3,
    category: 'design'
  },
  {
    id: 'test-file-2',
    projectId: 'test-project-2',
    name: 'Hurricane_Prep_Checklist_2025.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 345678,
    url: 'https://example.com/files/hurricane-checklist.docx',
    uploadedBy: 'test-coordinator-2',
    uploadedAt: new Date('2024-11-20'),
    version: 1,
    category: 'content'
  }
];

const TEST_MESSAGES = [
  {
    id: 'test-message-1',
    projectId: 'test-project-1',
    content: 'I\'ve uploaded the final version of the vaccination poster. Please review and let me know if any changes are needed.',
    authorId: 'test-coordinator-1',
    authorName: 'Sarah Johnson',
    createdAt: new Date('2024-11-15T10:30:00'),
    editedAt: null,
    attachments: ['test-file-1']
  },
  {
    id: 'test-message-2',
    projectId: 'test-project-1',
    content: 'The poster looks great! I think we\'re ready to send this to print. Can we get approval by end of day?',
    authorId: 'test-user-admin',
    authorName: 'Admin User',
    createdAt: new Date('2024-11-15T14:45:00'),
    editedAt: null,
    attachments: []
  },
  {
    id: 'test-message-3',
    projectId: 'test-project-2',
    content: 'Starting work on the hurricane prep guide. I\'ll have the first draft ready by next week.',
    authorId: 'test-coordinator-2',
    authorName: 'Michael Chen',
    createdAt: new Date('2024-11-20T09:15:00'),
    editedAt: null,
    attachments: []
  }
];

// Seed function
async function seedTestData() {
  console.log('🌱 Seeding Communications Dashboard test data...\n');
  
  try {
    // Initialize regions first
    console.log('📍 Initializing Louisiana regions...');
    const LOUISIANA_REGIONS = {
      region1: {
        id: 'region1',
        name: 'Southeast Louisiana',
        number: 1,
        parishes: ['Jefferson', 'Orleans', 'Plaquemines', 'St. Bernard'],
        color: '#003f7f',
        hub: 'New Orleans'
      },
      region2: {
        id: 'region2',
        name: 'Capital Area',
        number: 2,
        parishes: ['Ascension', 'East Baton Rouge', 'East Feliciana', 'Iberville', 
                 'Pointe Coupee', 'West Baton Rouge', 'West Feliciana'],
        color: '#0891b2',
        hub: 'Baton Rouge'
      },
      region3: {
        id: 'region3',
        name: 'South Central Louisiana',
        number: 3,
        parishes: ['Assumption', 'Lafourche', 'St. Charles', 'St. James', 
                 'St. John the Baptist', 'St. Mary', 'Terrebonne'],
        color: '#1e40af',
        hub: 'Thibodaux'
      },
      region4: {
        id: 'region4',
        name: 'Acadiana',
        number: 4,
        parishes: ['Acadia', 'Evangeline', 'Iberia', 'Lafayette', 
                 'St. Landry', 'St. Martin', 'Vermilion'],
        color: '#7c3aed',
        hub: 'Lafayette'
      },
      region5: {
        id: 'region5',
        name: 'Southwest Louisiana',
        number: 5,
        parishes: ['Allen', 'Beauregard', 'Calcasieu', 'Cameron', 'Jefferson Davis'],
        color: '#db2777',
        hub: 'Lake Charles'
      },
      region6: {
        id: 'region6',
        name: 'Central Louisiana',
        number: 6,
        parishes: ['Avoyelles', 'Catahoula', 'Concordia', 'Grant', 
                 'LaSalle', 'Rapides', 'Vernon', 'Winn'],
        color: '#dc2626',
        hub: 'Alexandria'
      },
      region7: {
        id: 'region7',
        name: 'Northwest Louisiana',
        number: 7,
        parishes: ['Bienville', 'Bossier', 'Caddo', 'Claiborne', 'DeSoto', 
                 'Natchitoches', 'Red River', 'Sabine', 'Webster'],
        color: '#ea580c',
        hub: 'Shreveport'
      },
      region8: {
        id: 'region8',
        name: 'Northeast Louisiana',
        number: 8,
        parishes: ['Caldwell', 'East Carroll', 'Franklin', 'Jackson', 'Lincoln', 
                 'Madison', 'Morehouse', 'Ouachita', 'Richland', 'Tensas', 
                 'Union', 'West Carroll'],
        color: '#ca8a04',
        hub: 'Monroe'
      },
      region9: {
        id: 'region9',
        name: 'Northshore',
        number: 9,
        parishes: ['Livingston', 'St. Helena', 'St. Tammany', 'Tangipahoa', 'Washington'],
        color: '#16a34a',
        hub: 'Hammond'
      }
    };
    
    // Create regions in Firestore
    const regionBatch = db.batch();
    for (const [regionId, regionData] of Object.entries(LOUISIANA_REGIONS)) {
      const regionRef = db.collection('comms_regions').doc(regionId);
      regionBatch.set(regionRef, {
        ...regionData,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await regionBatch.commit();
    console.log(`✅ Initialized ${Object.keys(LOUISIANA_REGIONS).length} regions\n`);
    
    // Seed projects
    console.log('📁 Creating test projects...');
    const projectBatch = db.batch();
    for (const project of TEST_PROJECTS) {
      const projectRef = db.collection('comms_projects').doc(project.id);
      projectBatch.set(projectRef, {
        ...project,
        createdAt: admin.firestore.Timestamp.fromDate(project.createdAt),
        updatedAt: admin.firestore.Timestamp.fromDate(project.updatedAt),
        deadline: project.deadline ? admin.firestore.Timestamp.fromDate(project.deadline) : null,
        completedAt: project.completedAt ? admin.firestore.Timestamp.fromDate(project.completedAt) : null
      });
    }
    await projectBatch.commit();
    console.log(`✅ Created ${TEST_PROJECTS.length} test projects\n`);
    
    // Seed coordinators
    console.log('👥 Creating test coordinators...');
    const coordinatorBatch = db.batch();
    for (const coordinator of TEST_COORDINATORS) {
      const coordinatorRef = db.collection('comms_coordinators').doc(coordinator.userId);
      coordinatorBatch.set(coordinatorRef, {
        ...coordinator,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    await coordinatorBatch.commit();
    console.log(`✅ Created ${TEST_COORDINATORS.length} test coordinators\n`);
    
    // Seed files
    console.log('📎 Creating test files...');
    const fileBatch = db.batch();
    for (const file of TEST_FILES) {
      const fileRef = db.collection('comms_files').doc(file.id);
      fileBatch.set(fileRef, {
        ...file,
        uploadedAt: admin.firestore.Timestamp.fromDate(file.uploadedAt)
      });
    }
    await fileBatch.commit();
    console.log(`✅ Created ${TEST_FILES.length} test files\n`);
    
    // Seed messages
    console.log('💬 Creating test messages...');
    const messageBatch = db.batch();
    for (const message of TEST_MESSAGES) {
      const messageRef = db.collection('comms_messages').doc(message.id);
      messageBatch.set(messageRef, {
        ...message,
        createdAt: admin.firestore.Timestamp.fromDate(message.createdAt),
        editedAt: message.editedAt ? admin.firestore.Timestamp.fromDate(message.editedAt) : null
      });
    }
    await messageBatch.commit();
    console.log(`✅ Created ${TEST_MESSAGES.length} test messages\n`);
    
    console.log('🎉 Test data seeding completed successfully!\n');
    console.log('You can now test the Communications Dashboard with:');
    console.log('- 5 test projects in various stages');
    console.log('- 4 test coordinators assigned to different regions');
    console.log('- Sample files and messages');
    console.log('\nMake sure users have appropriate permissions (view_comms, manage_comms, etc.)');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    process.exit(1);
  }
}

// Run the seeder
seedTestData().then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
});