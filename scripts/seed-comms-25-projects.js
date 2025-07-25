// scripts/seed-comms-25-projects.js
// Script to seed 25 test projects for Communications Dashboard

const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/OPHV2/ophv2_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to generate random date within range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Arrays for generating varied project data
const PROJECT_TITLES = [
  'COVID-19 Vaccination Campaign',
  'Hurricane Preparedness Guide 2025',
  'Maternal Health Awareness Campaign',
  'Flu Season Reminder Campaign',
  'Mental Health Resources Directory',
  'Diabetes Prevention Initiative',
  'Childhood Immunization Drive',
  'Opioid Crisis Response Program',
  'Senior Health & Wellness Fair',
  'Rural Healthcare Access Campaign',
  'Emergency Response Training',
  'Teen Pregnancy Prevention',
  'Breast Cancer Awareness Month',
  'Heart Health Education Series',
  'Nutrition & Food Security Program',
  'Mosquito-Borne Disease Prevention',
  'Dental Health for Children',
  'Substance Abuse Prevention',
  'Workplace Safety Initiative',
  'Environmental Health Awareness',
  'Tobacco Cessation Program',
  'Water Quality Education',
  'Lead Poisoning Prevention',
  'STD Prevention Campaign',
  'School Health Program'
];

const PROJECT_DESCRIPTIONS = [
  'Statewide campaign to promote public health awareness and education',
  'Regional initiative targeting at-risk populations',
  'Community-based program for health improvement',
  'Annual awareness campaign for disease prevention',
  'Comprehensive resource development project',
  'Multi-parish collaborative health initiative',
  'Emergency preparedness and response program',
  'Healthcare access improvement project',
  'Public education and outreach campaign',
  'Prevention-focused community intervention'
];

const TAGS = [
  'vaccination', 'covid-19', 'public-health', 'hurricane', 'emergency', 'preparedness',
  'maternal-health', 'rural-health', 'women', 'flu', 'seasonal', 'mental-health',
  'resources', 'directory', 'diabetes', 'prevention', 'children', 'immunization',
  'opioids', 'crisis', 'seniors', 'wellness', 'access', 'training', 'teen',
  'pregnancy', 'cancer', 'awareness', 'heart', 'nutrition', 'food-security',
  'mosquito', 'dental', 'substance-abuse', 'safety', 'environmental', 'tobacco',
  'water', 'lead', 'std', 'school'
];

const DELIVERABLES = [
  'Social media graphics', 'Print materials', 'Radio spots', 'Billboard designs',
  'Website content', 'Mobile app updates', 'Community event materials', 'Email templates',
  'Video content', 'Podcast episodes', 'Infographics', 'Brochures', 'Posters',
  'Digital ads', 'Press releases', 'Fact sheets', 'Training materials', 'Toolkits'
];

const TARGET_AUDIENCES = [
  'General public, ages 18+',
  'Coastal parish residents',
  'Women of childbearing age in rural areas',
  'Adults 65+, children under 5',
  'Healthcare providers and general public',
  'Parents and caregivers',
  'High-risk populations',
  'School-aged children',
  'Healthcare workers',
  'Community leaders',
  'Underserved communities',
  'Young adults 18-25'
];

// Generate projects
function generateProjects() {
  const projects = [];
  const regions = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const priorities = ['low', 'medium', 'high'];
  const visibilities = ['private', 'coordinators', 'public'];
  const coordinators = ['test-coordinator-1', 'test-coordinator-2', 'test-coordinator-3', 'test-coordinator-4'];

  for (let i = 0; i < 25; i++) {
    // Determine stage completion pattern
    const completionPattern = Math.random();
    let stageCompletionLevel = 'none'; // 0% complete
    if (completionPattern > 0.7) {
      stageCompletionLevel = 'all'; // 100% complete
    } else if (completionPattern > 0.4) {
      stageCompletionLevel = 'partial'; // 40-60% complete
    } else if (completionPattern > 0.2) {
      stageCompletionLevel = 'started'; // 20% complete
    }
    
    const createdDate = randomDate(new Date('2024-09-01'), new Date('2024-11-20'));
    const updatedDate = randomDate(createdDate, new Date('2024-11-25'));
    const deadlineDate = randomDate(new Date('2024-12-01'), new Date('2025-12-31'));
    
    // Generate stages based on project type
    const stageTemplates = [
      ['Planning', 'Design', 'Review', 'Approval', 'Launch'],
      ['Research', 'Content Creation', 'Translation', 'Review', 'Distribution'],
      ['Data Collection', 'Verification', 'Design', 'Review', 'Publication'],
      ['Strategy', 'Creative Development', 'Production', 'Distribution', 'Evaluation']
    ];
    
    const selectedStages = stageTemplates[Math.floor(Math.random() * stageTemplates.length)];
    const stageData = generateProjectStages(selectedStages, stageCompletionLevel, createdDate);
    const stages = stageData.stages;
    const currentStageIndex = stageData.currentStageIndex;
    
    // Select random tags (2-5 per project)
    const numTags = Math.floor(Math.random() * 4) + 2;
    const projectTags = [];
    for (let j = 0; j < numTags; j++) {
      const tag = TAGS[Math.floor(Math.random() * TAGS.length)];
      if (!projectTags.includes(tag)) {
        projectTags.push(tag);
      }
    }
    
    // Select random deliverables (2-4 per project)
    const numDeliverables = Math.floor(Math.random() * 3) + 2;
    const projectDeliverables = [];
    for (let j = 0; j < numDeliverables; j++) {
      const deliverable = DELIVERABLES[Math.floor(Math.random() * DELIVERABLES.length)];
      if (!projectDeliverables.includes(deliverable)) {
        projectDeliverables.push(deliverable);
      }
    }
    
    // Ensure all projects have a coordinator assigned
    const coordinatorIndex = Math.floor(Math.random() * coordinators.length);
    const coordinatorId = coordinators[coordinatorIndex];
    const coordinatorData = TEST_COORDINATORS.find(c => c.id === coordinatorId);
    
    // Determine if project requires approval (60% chance)
    const requiresApproval = Math.random() > 0.4;
    
    // Set manual pending_approval status for some completed projects that require approval
    let manualStatus = null;
    if (stageCompletionLevel === 'all' && requiresApproval && Math.random() > 0.5) {
      manualStatus = 'pending_approval';
    }
    
    const project = {
      id: `test-project-${i + 1}`,
      title: PROJECT_TITLES[i],
      description: PROJECT_DESCRIPTIONS[Math.floor(Math.random() * PROJECT_DESCRIPTIONS.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      visibility: visibilities[Math.floor(Math.random() * visibilities.length)],
      stages: stages,
      currentStageIndex: currentStageIndex,
      coordinatorId: coordinatorId,
      coordinatorName: coordinatorData ? coordinatorData.name : null,
      requiresApproval: requiresApproval,
      tags: projectTags,
      sharedWith: [],
      createdBy: 'system',
      createdAt: createdDate,
      updatedAt: updatedDate,
      deadline: deadlineDate,
      budget: Math.floor(Math.random() * 150000) + 10000,
      targetAudience: TARGET_AUDIENCES[Math.floor(Math.random() * TARGET_AUDIENCES.length)],
      deliverables: projectDeliverables
    };
    
    // Only set status if manually marking as pending_approval
    if (manualStatus) {
      project.status = manualStatus;
    }
    
    if (stageCompletionLevel === 'all' && !manualStatus) {
      project.completedAt = randomDate(updatedDate, new Date('2024-11-25'));
    }
    
    projects.push(project);
  }
  
  return projects;
}

// Generate project stages based on completion level
function generateProjectStages(stageNames, completionLevel, startDate) {
  const stages = [];
  let currentDate = new Date(startDate);
  let currentStageIdx = 0;
  
  for (let i = 0; i < stageNames.length; i++) {
    const stage = { 
      name: stageNames[i],
      description: '',
      completed: false,
      startedAt: null,
      completedAt: null
    };
    
    // Determine stage completion based on completion level
    if (completionLevel === 'all') {
      // All stages completed
      stage.completed = true;
      stage.startedAt = randomDate(startDate, currentDate);
      currentDate = randomDate(currentDate, new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000));
      stage.completedAt = currentDate;
    } else if (completionLevel === 'partial') {
      const progressRatio = i / stageNames.length;
      
      if (progressRatio < 0.4) {
        // First 40% of stages are completed
        stage.completed = true;
        stage.startedAt = randomDate(startDate, currentDate);
        currentDate = randomDate(currentDate, new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000));
        stage.completedAt = currentDate;
      } else if (progressRatio < 0.6 && currentStageIdx === 0) {
        // Mark the first uncompleted stage as current
        currentStageIdx = i;
        stage.startedAt = randomDate(currentDate, new Date());
        stage.description = 'Currently in progress';
      }
    } else if (completionLevel === 'started') {
      if (i === 0) {
        // Only first stage started
        currentStageIdx = 0;
        stage.startedAt = randomDate(currentDate, new Date());
        stage.description = 'Initial phase started';
      }
    }
    // For 'none' completion level, all stages remain incomplete
    
    stages.push(stage);
  }
  
  return { stages, currentStageIndex: currentStageIdx };
}

const TEST_COORDINATORS = [
  {
    id: 'test-coordinator-1',
    userId: 'test-user-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@la.gov',
    regions: ['2', '3'],
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
    regions: ['1'],
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
    regions: ['4', '5'],
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
    regions: ['7', '8', '9'],
    isActive: true,
    phoneNumber: '(318) 555-0104',
    title: 'Regional Communications Lead',
    assignedProjects: 10,
    completedProjects: 52
  }
];

// Seed function
async function seedTestData() {
  console.log('🌱 Seeding Communications Dashboard with 25 test projects...\n');
  
  try {
    // Initialize regions first
    console.log('📍 Initializing Louisiana regions...');
    const LOUISIANA_REGIONS = {
      '1': {
        id: '1',
        name: 'Southeast Louisiana',
        number: 1,
        parishes: ['Jefferson', 'Orleans', 'Plaquemines', 'St. Bernard'],
        color: '#003f7f',
        hub: 'New Orleans'
      },
      '2': {
        id: '2',
        name: 'Capital Area',
        number: 2,
        parishes: ['Ascension', 'East Baton Rouge', 'East Feliciana', 'Iberville', 
                 'Pointe Coupee', 'West Baton Rouge', 'West Feliciana'],
        color: '#0891b2',
        hub: 'Baton Rouge'
      },
      '3': {
        id: '3',
        name: 'South Central Louisiana',
        number: 3,
        parishes: ['Assumption', 'Lafourche', 'St. Charles', 'St. James', 
                 'St. John the Baptist', 'St. Mary', 'Terrebonne'],
        color: '#1e40af',
        hub: 'Thibodaux'
      },
      '4': {
        id: '4',
        name: 'Acadiana',
        number: 4,
        parishes: ['Acadia', 'Evangeline', 'Iberia', 'Lafayette', 
                 'St. Landry', 'St. Martin', 'Vermilion'],
        color: '#7c3aed',
        hub: 'Lafayette'
      },
      '5': {
        id: '5',
        name: 'Southwest Louisiana',
        number: 5,
        parishes: ['Allen', 'Beauregard', 'Calcasieu', 'Cameron', 'Jefferson Davis'],
        color: '#db2777',
        hub: 'Lake Charles'
      },
      '6': {
        id: '6',
        name: 'Central Louisiana',
        number: 6,
        parishes: ['Avoyelles', 'Catahoula', 'Concordia', 'Grant', 
                 'LaSalle', 'Rapides', 'Vernon', 'Winn'],
        color: '#dc2626',
        hub: 'Alexandria'
      },
      '7': {
        id: '7',
        name: 'Northwest Louisiana',
        number: 7,
        parishes: ['Bienville', 'Bossier', 'Caddo', 'Claiborne', 'DeSoto', 
                 'Natchitoches', 'Red River', 'Sabine', 'Webster'],
        color: '#ea580c',
        hub: 'Shreveport'
      },
      '8': {
        id: '8',
        name: 'Northeast Louisiana',
        number: 8,
        parishes: ['Caldwell', 'East Carroll', 'Franklin', 'Jackson', 'Lincoln', 
                 'Madison', 'Morehouse', 'Ouachita', 'Richland', 'Tensas', 
                 'Union', 'West Carroll'],
        color: '#ca8a04',
        hub: 'Monroe'
      },
      '9': {
        id: '9',
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
    
    // Generate and seed projects
    console.log('📁 Generating 25 test projects...');
    const projects = generateProjects();
    const projectBatch = db.batch();
    for (const project of projects) {
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
    console.log(`✅ Created ${projects.length} test projects\n`);
    
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
    
    // Generate sample files and messages for ALL projects with variety
    console.log('📎 Creating sample files and messages for all projects...');
    const fileBatch = db.batch();
    const messageBatch = db.batch();
    
    // Message templates for variety
    const messageTemplates = [
      'Project kickoff meeting scheduled for next week. Please review the attached materials.',
      'Great progress on the design phase! The focus group feedback has been very positive.',
      'Budget approval received. We can now proceed with the production phase.',
      'Translation services have been secured for Spanish, Vietnamese, and French materials.',
      'Regional coordinators meeting summary: All parishes are on board with the timeline.',
      'Vendor bids are in. Recommendation report attached for review.',
      'Quality check complete. Minor revisions needed on the print materials.',
      'Distribution plan finalized. See attached spreadsheet for parish-by-parish breakdown.',
      'Stakeholder feedback incorporated. Updated designs are ready for final approval.',
      'Campaign metrics looking strong. Early indicators show good community engagement.',
      'Materials have been delivered to all distribution centers. Launch is a go!',
      'Post-launch review meeting scheduled. Please prepare your regional reports.',
      'Urgent: Timeline adjustment needed due to hurricane preparations.',
      'Success! Project objectives met. Final report will be submitted by EOW.',
      'Community partners have expressed interest in extending this campaign.',
      'Media coverage has been excellent. See attached press clippings.',
      'Budget reconciliation complete. We came in under budget by 8%.',
      'Lessons learned document drafted. Please add your team\'s insights.',
      'Phase 2 planning initiated based on the success of this campaign.',
      'Thank you all for your hard work! This project has made a real difference.'
    ];
    
    const fileTypes = [
      { name: 'Design_Mockup', type: 'application/pdf', category: 'design' },
      { name: 'Budget_Spreadsheet', type: 'application/vnd.ms-excel', category: 'budget' },
      { name: 'Campaign_Strategy', type: 'application/pdf', category: 'planning' },
      { name: 'Social_Media_Graphics', type: 'application/zip', category: 'design' },
      { name: 'Press_Release', type: 'application/msword', category: 'content' },
      { name: 'Translation_Files', type: 'application/zip', category: 'content' },
      { name: 'Distribution_Plan', type: 'application/pdf', category: 'planning' },
      { name: 'Stakeholder_Report', type: 'application/pdf', category: 'reports' },
      { name: 'Video_Scripts', type: 'application/msword', category: 'content' },
      { name: 'Focus_Group_Results', type: 'application/pdf', category: 'research' }
    ];
    
    let fileCounter = 0;
    let messageCounter = 0;
    
    // Add files and messages to ALL projects with varying amounts
    for (let i = 0; i < 25; i++) {
      const projectId = `test-project-${i + 1}`;
      const project = projects[i];
      
      // Add 0-4 files per project
      const numFiles = Math.floor(Math.random() * 5);
      for (let f = 0; f < numFiles; f++) {
        fileCounter++;
        const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        const fileRef = db.collection('comms_files').doc(`test-file-${fileCounter}`);
        
        fileBatch.set(fileRef, {
          id: `test-file-${fileCounter}`,
          projectId: projectId,
          name: `${fileType.name}_${projectId}_v${f + 1}.${fileType.type.split('/').pop()}`,
          type: fileType.type,
          size: Math.floor(Math.random() * 5000000) + 100000,
          url: `https://example.com/files/${projectId}-file-${f + 1}`,
          uploadedBy: project.coordinatorId || TEST_COORDINATORS[0].id,
          uploadedAt: randomDate(project.createdAt, project.updatedAt),
          version: f + 1,
          category: fileType.category
        });
      }
      
      // Add 1-6 messages per project based on completion
      let numMessages = 1;
      const completedStages = project.stages.filter(s => s.completed).length;
      const totalStages = project.stages.length;
      const completionRatio = totalStages > 0 ? completedStages / totalStages : 0;
      
      if (completionRatio === 1) {
        numMessages = Math.floor(Math.random() * 4) + 3; // 3-6 messages
      } else if (completionRatio > 0) {
        numMessages = Math.floor(Math.random() * 3) + 2; // 2-4 messages
      } else {
        numMessages = Math.floor(Math.random() * 2) + 1; // 1-2 messages
      }
      
      const projectMessages = [];
      for (let m = 0; m < numMessages; m++) {
        projectMessages.push({
          template: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
          date: randomDate(project.createdAt, project.updatedAt)
        });
      }
      
      // Sort messages by date
      projectMessages.sort((a, b) => a.date - b.date);
      
      // Create messages
      for (let m = 0; m < projectMessages.length; m++) {
        messageCounter++;
        const coordinator = TEST_COORDINATORS[Math.floor(Math.random() * TEST_COORDINATORS.length)];
        const messageRef = db.collection('comms_messages').doc(`test-message-${messageCounter}`);
        
        let content = projectMessages[m].template;
        // Customize first message
        if (m === 0) {
          content = `Project "${project.title}" has been initiated. ${content}`;
        }
        // Add project-specific context to some messages
        if (Math.random() > 0.5) {
          content = content.replace('materials', `materials for ${project.title}`);
          content = content.replace('campaign', `${project.title} campaign`);
          content = content.replace('project', `${project.title} project`);
        }
        
        messageBatch.set(messageRef, {
          id: `test-message-${messageCounter}`,
          projectId: projectId,
          content: content,
          authorId: coordinator.id,
          authorName: coordinator.name,
          createdAt: admin.firestore.Timestamp.fromDate(projectMessages[m].date),
          editedAt: null,
          attachments: [],
          mentions: Math.random() > 0.7 ? [project.coordinatorId || TEST_COORDINATORS[0].id] : []
        });
      }
    }
    
    await fileBatch.commit();
    await messageBatch.commit();
    console.log('✅ Created sample files and messages\n');
    
    console.log('🎉 Test data seeding completed successfully!\n');
    console.log('Summary:');
    console.log('- 25 test projects across all Louisiana regions');
    console.log('- Various project statuses, priorities, and stages');
    console.log('- 4 test coordinators assigned to different regions');
    console.log('- Sample files and messages for first 5 projects');
    console.log('\nProject distribution:');
    console.log('- Status calculated automatically based on stage progress');
    console.log('- Priorities: low, medium, high');
    console.log('- Regions: All 9 Louisiana regions');
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

