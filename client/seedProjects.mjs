#!/usr/bin/env node
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWfFbew1rO6l9X0K4qLl65bL0F5X99tNQ",
  authDomain: "ophv2-98d15.firebaseapp.com",
  projectId: "ophv2-98d15",
  storageBucket: "ophv2-98d15.firebasestorage.app",
  messagingSenderId: "362447084308",
  appId: "1:362447084308:web:5f979a53cbdcc093db7af4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Project data templates
const projectTemplates = [
  { title: "Hurricane Season Public Safety Campaign", description: "Develop comprehensive public awareness campaign for hurricane preparedness including social media, print materials, and radio PSAs" },
  { title: "COVID-19 Vaccine Booster Outreach", description: "Create targeted messaging to encourage booster shot uptake in underserved communities across Louisiana" },
  { title: "Small Business Recovery Grant Program", description: "Design and implement communication strategy for new state grant program supporting small business recovery" },
  { title: "Infrastructure Bill Community Forums", description: "Organize and promote series of town halls to gather public input on infrastructure spending priorities" },
  { title: "Youth Mental Health Awareness Initiative", description: "Develop multimedia campaign targeting teens and young adults with mental health resources and support information" },
  { title: "Coastal Restoration Project Updates", description: "Create ongoing communication materials to keep communities informed about coastal restoration progress" },
  { title: "State Park Summer Programs", description: "Promote summer recreational and educational programs across Louisiana state parks system" },
  { title: "Tax Season Assistance Campaign", description: "Inform residents about free tax preparation services and important filing deadline changes" },
  { title: "Workforce Development Initiative", description: "Communicate new job training and apprenticeship opportunities in growing industries" },
  { title: "Emergency Alert System Upgrade", description: "Public education campaign about improvements to state emergency notification systems" },
  { title: "Healthcare Enrollment Period", description: "Comprehensive outreach for annual healthcare marketplace open enrollment period" },
  { title: "Road Work Safety Awareness", description: "Safety campaign for major highway construction projects across multiple parishes" },
  { title: "Environmental Protection Updates", description: "Communicate new environmental regulations and compliance requirements to businesses" },
  { title: "Education Budget Town Halls", description: "Series of public meetings to discuss proposed education budget changes" },
  { title: "Tourism Recovery Campaign", description: "Multi-channel marketing initiative to boost Louisiana tourism post-pandemic" },
  { title: "Disaster Preparedness Workshops", description: "Promote and organize community disaster preparedness training sessions statewide" },
  { title: "Senior Services Expansion", description: "Inform elderly residents about expanded services and benefits available to them" },
  { title: "Agricultural Support Programs", description: "Outreach to farmers about new state and federal agricultural assistance programs" },
  { title: "Public Transportation Updates", description: "Communicate changes to bus routes, schedules, and new transit options" },
  { title: "Voting Rights Information Campaign", description: "Ensure all citizens understand their voting rights and registration requirements" },
  { title: "Child Care Assistance Program", description: "Promote expanded child care subsidy program for working families" },
  { title: "Broadband Expansion Initiative", description: "Keep rural communities informed about high-speed internet infrastructure projects" },
  { title: "Housing Assistance Resources", description: "Comprehensive guide to available housing assistance and rental support programs" },
  { title: "Veterans Benefits Outreach", description: "Connect veterans with expanded healthcare and education benefits" },
  { title: "Clean Energy Incentives", description: "Educate businesses and homeowners about renewable energy tax credits and rebates" },
  { title: "Flood Insurance Requirements", description: "Critical information campaign about updated flood insurance regulations" },
  { title: "Summer Food Program", description: "Promote free summer meal programs for children when school is out" },
  { title: "State Budget Public Input", description: "Gather citizen feedback on state budget priorities through multiple channels" },
  { title: "Prescription Drug Savings Program", description: "Inform seniors about new prescription drug discount programs" },
  { title: "Career Fair Series", description: "Promote regional career fairs connecting job seekers with employers" },
  { title: "Water Quality Reports", description: "Regular updates on water quality testing and infrastructure improvements" },
  { title: "Crime Prevention Initiative", description: "Community partnership program to reduce crime through awareness and engagement" },
  { title: "Arts and Culture Grants", description: "Announce new funding opportunities for arts organizations and cultural events" },
  { title: "Disability Services Awareness", description: "Improve awareness of services and accommodations for people with disabilities" },
  { title: "Economic Development Zones", description: "Communicate benefits of new opportunity zones to potential investors" },
  { title: "Health Screening Programs", description: "Promote free health screening events in underserved communities" },
  { title: "Storm Debris Cleanup", description: "Coordinate communication about debris removal schedules and procedures" },
  { title: "School Safety Updates", description: "Keep parents informed about new school safety measures and protocols" },
  { title: "Public Records Modernization", description: "Announce improvements to online access for public records and documents" },
  { title: "Wildlife Conservation Campaign", description: "Educate public about endangered species protection and habitat preservation" },
  { title: "Business License Simplification", description: "Promote streamlined process for obtaining business licenses and permits" },
  { title: "Maternal Health Initiative", description: "Comprehensive campaign to improve maternal health outcomes statewide" },
  { title: "Digital Literacy Training", description: "Promote free computer and internet skills training for all ages" },
  { title: "Historic Preservation Grants", description: "Inform property owners about funding for historic building restoration" },
  { title: "Substance Abuse Prevention", description: "Multi-faceted campaign addressing opioid crisis and addiction resources" },
  { title: "Emergency Shelter Information", description: "Ensure all residents know locations and procedures for emergency shelters" },
  { title: "State Fair Promotion", description: "Comprehensive marketing campaign for annual Louisiana State Fair" },
  { title: "Consumer Protection Alerts", description: "Regular updates about scams, recalls, and consumer safety issues" },
  { title: "Green Jobs Training", description: "Promote training programs for careers in renewable energy and sustainability" },
  { title: "Census Data Applications", description: "Help communities understand and utilize new census data for planning" }
];

const tags = [
  "public-safety", "healthcare", "education", "infrastructure", "economic-development",
  "environment", "tourism", "disaster-preparedness", "social-services", "veterans",
  "youth", "seniors", "workforce", "housing", "transportation", "technology",
  "agriculture", "arts-culture", "small-business", "emergency-response"
];

const stages = [
  { value: "planning", label: "Planning", weight: 20 },
  { value: "in_progress", label: "In Progress", weight: 40 },
  { value: "review", label: "Review", weight: 20 },
  { value: "approved", label: "Approved", weight: 10 },
  { value: "completed", label: "Completed", weight: 10 }
];

const priorities = [
  { value: "low", weight: 20 },
  { value: "normal", weight: 50 },
  { value: "high", weight: 25 },
  { value: "urgent", weight: 5 }
];

function weightedRandom(items) {
  const weights = items.map(item => item.weight);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i].value || items[i];
    }
  }
  return items[items.length - 1].value || items[items.length - 1];
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomElements(array, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateProgress(stage) {
  switch(stage) {
    case "planning": return Math.floor(Math.random() * 25);
    case "in_progress": return Math.floor(Math.random() * 50) + 25;
    case "review": return Math.floor(Math.random() * 20) + 70;
    case "approved": return Math.floor(Math.random() * 10) + 85;
    case "completed": return 100;
    default: return 0;
  }
}

function generateDeadline() {
  const daysAhead = Math.floor(Math.random() * 180) + 30; // 30-210 days from now
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + daysAhead);
  return deadline.toISOString().split('T')[0];
}

async function deleteTestCoordinators() {
  console.log('🔍 Checking for test coordinators to delete...\n');
  
  const testPatterns = {
    ids: /^test-coordinator-\d+$/,
    emails: [
      'sarah.johnson@la.gov',
      'james.wilson@la.gov',
      'maria.rodriguez@la.gov',
      'michael.chen@la.gov'
    ]
  };
  
  try {
    const coordinatorsRef = collection(db, 'comms_coordinators');
    const snapshot = await getDocs(coordinatorsRef);
    
    const toDelete = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const id = doc.id;
      const email = data.email || data.userEmail || '';
      
      if (testPatterns.ids.test(id) || testPatterns.emails.includes(email.toLowerCase())) {
        toDelete.push({
          id: id,
          name: data.displayName || data.name || data.userName || 'Unknown',
          email: email
        });
      }
    });
    
    if (toDelete.length > 0) {
      console.log(`🗑️  Found ${toDelete.length} test coordinators to delete:\n`);
      for (const coord of toDelete) {
        try {
          await deleteDoc(doc(db, 'comms_coordinators', coord.id));
          console.log(`✅ Deleted: ${coord.name} (${coord.id})`);
        } catch (error) {
          console.error(`❌ Failed to delete ${coord.name}: ${error.message}`);
        }
      }
      console.log('\n');
    }
  } catch (error) {
    console.error('❌ Error checking for test coordinators:', error);
  }
}

async function seedProjects() {
  console.log('🌱 Starting project seeding process...\n');
  
  // First delete test coordinators
  await deleteTestCoordinators();
  
  // Get current coordinators
  console.log('📋 Fetching current coordinators...');
  const coordSnapshot = await getDocs(collection(db, 'comms_coordinators'));
  const currentCoordinators = coordSnapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    .filter(coord => !coord.id.includes('test-coordinator'));
  
  if (currentCoordinators.length === 0) {
    console.error('❌ No coordinators found! Please add coordinators first.');
    process.exit(1);
  }
  
  console.log(`✅ Found ${currentCoordinators.length} active coordinators\n`);
  currentCoordinators.forEach(coord => {
    console.log(`   - ${coord.displayName || coord.name || coord.email} (Regions: ${(coord.regions || []).join(', ')})`);
  });
  
  console.log('\n🚀 Creating 50 communications projects...\n');
  
  const projectsRef = collection(db, 'comms_projects');
  let successCount = 0;
  const stats = {
    byStage: {},
    byPriority: {},
    byCoordinator: {}
  };
  
  for (let i = 0; i < 50; i++) {
    try {
      const template = randomElement(projectTemplates);
      const coordinator = randomElement(currentCoordinators);
      const coordinatorRegions = coordinator.regions || [];
      const region = coordinatorRegions.length > 0 
        ? randomElement(coordinatorRegions)
        : Math.floor(Math.random() * 8 + 1).toString();
      
      const stage = weightedRandom(stages);
      const priority = weightedRandom(priorities);
      const projectTags = randomElements(tags, 1, 4);
      const progress = generateProgress(stage);
      const requiresApproval = Math.random() > 0.7;
      const deadline = generateDeadline();
      
      const projectData = {
        title: template.title,
        description: template.description,
        coordinatorId: coordinator.id,
        coordinatorName: coordinator.displayName || coordinator.name || coordinator.email,
        region: region,
        stage: stage,
        priority: priority,
        tags: projectTags,
        progress: progress,
        requiresApproval: requiresApproval,
        deadline: deadline,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: 'seeding-script',
        status: 'active',
        attachments: [],
        comments: []
      };
      
      if (requiresApproval) {
        projectData.approvalStatus = stage === 'approved' || stage === 'completed' ? 'approved' : 'pending';
        if (projectData.approvalStatus === 'approved') {
          projectData.approvedAt = Timestamp.now();
          projectData.approvedBy = 'admin';
        }
      }
      
      await addDoc(projectsRef, projectData);
      successCount++;
      
      // Update stats
      stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
      stats.byCoordinator[projectData.coordinatorName] = (stats.byCoordinator[projectData.coordinatorName] || 0) + 1;
      
      console.log(`✅ [${i + 1}/50] "${template.title.substring(0, 40)}..." - ${projectData.coordinatorName}`);
      
    } catch (error) {
      console.error(`❌ Failed to create project ${i + 1}: ${error.message}`);
    }
  }
  
  console.log(`\n🎉 Seeding complete! Created ${successCount}/50 projects\n`);
  
  console.log('📊 Statistics:');
  console.log('\nBy Stage:');
  Object.entries(stats.byStage).forEach(([stage, count]) => {
    console.log(`   ${stage}: ${count}`);
  });
  
  console.log('\nBy Priority:');
  Object.entries(stats.byPriority).forEach(([priority, count]) => {
    console.log(`   ${priority}: ${count}`);
  });
  
  console.log('\nBy Coordinator:');
  Object.entries(stats.byCoordinator).forEach(([name, count]) => {
    console.log(`   ${name}: ${count}`);
  });
  
  process.exit(0);
}

// Run the seeding
seedProjects().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});