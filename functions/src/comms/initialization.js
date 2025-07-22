// functions/src/comms/initialization.js
// Cloud Functions for Communications Dashboard initialization

const admin = require('firebase-admin');
const { logger } = require('firebase-functions/v2');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// Louisiana regions data
const LOUISIANA_REGIONS = {
  region1: {
    id: 'region1',
    name: 'Southeast Louisiana',
    number: 1,
    parishes: ['Jefferson', 'Orleans', 'Plaquemines', 'St. Bernard'],
    color: '#003f7f', // Navy blue
    hub: 'New Orleans'
  },
  region2: {
    id: 'region2',
    name: 'Capital Area',
    number: 2,
    parishes: ['Ascension', 'East Baton Rouge', 'East Feliciana', 'Iberville', 
               'Pointe Coupee', 'West Baton Rouge', 'West Feliciana'],
    color: '#0891b2', // Cyan
    hub: 'Baton Rouge'
  },
  region3: {
    id: 'region3',
    name: 'South Central Louisiana',
    number: 3,
    parishes: ['Assumption', 'Lafourche', 'St. Charles', 'St. James', 
               'St. John the Baptist', 'St. Mary', 'Terrebonne'],
    color: '#1e40af', // Blue
    hub: 'Thibodaux'
  },
  region4: {
    id: 'region4',
    name: 'Acadiana',
    number: 4,
    parishes: ['Acadia', 'Evangeline', 'Iberia', 'Lafayette', 
               'St. Landry', 'St. Martin', 'Vermilion'],
    color: '#7c3aed', // Purple
    hub: 'Lafayette'
  },
  region5: {
    id: 'region5',
    name: 'Southwest Louisiana',
    number: 5,
    parishes: ['Allen', 'Beauregard', 'Calcasieu', 'Cameron', 'Jefferson Davis'],
    color: '#db2777', // Pink
    hub: 'Lake Charles'
  },
  region6: {
    id: 'region6',
    name: 'Central Louisiana',
    number: 6,
    parishes: ['Avoyelles', 'Catahoula', 'Concordia', 'Grant', 
               'LaSalle', 'Rapides', 'Vernon', 'Winn'],
    color: '#dc2626', // Red
    hub: 'Alexandria'
  },
  region7: {
    id: 'region7',
    name: 'Northwest Louisiana',
    number: 7,
    parishes: ['Bienville', 'Bossier', 'Caddo', 'Claiborne', 'DeSoto', 
               'Natchitoches', 'Red River', 'Sabine', 'Webster'],
    color: '#ea580c', // Orange
    hub: 'Shreveport'
  },
  region8: {
    id: 'region8',
    name: 'Northeast Louisiana',
    number: 8,
    parishes: ['Caldwell', 'East Carroll', 'Franklin', 'Jackson', 'Lincoln', 
               'Madison', 'Morehouse', 'Ouachita', 'Richland', 'Tensas', 
               'Union', 'West Carroll'],
    color: '#ca8a04', // Yellow/amber
    hub: 'Monroe'
  },
  region9: {
    id: 'region9',
    name: 'Northshore',
    number: 9,
    parishes: ['Livingston', 'St. Helena', 'St. Tammany', 'Tangipahoa', 'Washington'],
    color: '#16a34a', // Green
    hub: 'Hammond'
  }
};

/**
 * Initialize Communications regions in Firestore
 * This should be called once during system setup
 */
async function initializeRegions() {
  logger.info('Initializing Louisiana regions for Communications Dashboard');
  
  const batch = db.batch();
  
  try {
    // Create/update each region
    for (const [regionId, regionData] of Object.entries(LOUISIANA_REGIONS)) {
      const regionRef = db.collection('comms_regions').doc(regionId);
      batch.set(regionRef, {
        ...regionData,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }
    
    await batch.commit();
    logger.info(`Successfully initialized ${Object.keys(LOUISIANA_REGIONS).length} regions`);
    
    return {
      success: true,
      regionsCount: Object.keys(LOUISIANA_REGIONS).length,
      regions: Object.keys(LOUISIANA_REGIONS)
    };
  } catch (error) {
    logger.error('Error initializing regions:', error);
    throw error;
  }
}

/**
 * Cloud Function to initialize Communications Dashboard data
 * Can only be called by users with manage_comms permission
 */
exports.initializeCommsData = onCall({
  cors: true,
  region: 'us-central1'
}, async (request) => {
  const { auth } = request;
  
  // Check authentication
  if (!auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in to initialize data');
  }
  
  try {
    // Check permissions
    const userDoc = await db.collection('users').doc(auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    
    const userData = userDoc.data();
    const userRole = userData.role;
    
    // Check if user is owner or has manage_comms permission
    if (userRole !== 'owner') {
      // Check role permissions
      const roleDoc = await db.collection('roles').doc(userRole).get();
      if (!roleDoc.exists || !roleDoc.data().permissions.includes('manage_comms')) {
        // Check custom permissions
        if (!userData.customPermissions || !userData.customPermissions.includes('manage_comms')) {
          throw new HttpsError('permission-denied', 'You need manage_comms permission to initialize data');
        }
      }
    }
    
    // Initialize regions
    const result = await initializeRegions();
    
    // Log the initialization
    await db.collection('audit_logs').add({
      action: 'comms_data_initialized',
      userId: auth.uid,
      userEmail: userData.email,
      timestamp: FieldValue.serverTimestamp(),
      details: {
        regionsInitialized: result.regionsCount,
        method: 'cloud_function'
      }
    });
    
    return {
      success: true,
      message: 'Communications Dashboard data initialized successfully',
      ...result
    };
    
  } catch (error) {
    logger.error('Error in initializeCommsData:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to initialize Communications data');
  }
});

/**
 * Get all regions data
 * Can be called by any user with view_comms permission
 */
exports.getCommsRegions = onCall({
  cors: true,
  region: 'us-central1'
}, async (request) => {
  const { auth } = request;
  
  // Check authentication
  if (!auth) {
    throw new HttpsError('unauthenticated', 'You must be logged in to view regions');
  }
  
  try {
    // Check permissions
    const userDoc = await db.collection('users').doc(auth.uid).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    
    const userData = userDoc.data();
    const userRole = userData.role;
    
    // Check if user has view_comms permission
    let hasPermission = userRole === 'owner';
    
    if (!hasPermission) {
      const roleDoc = await db.collection('roles').doc(userRole).get();
      if (roleDoc.exists && roleDoc.data().permissions.includes('view_comms')) {
        hasPermission = true;
      } else if (userData.customPermissions && userData.customPermissions.includes('view_comms')) {
        hasPermission = true;
      }
    }
    
    if (!hasPermission) {
      throw new HttpsError('permission-denied', 'You need view_comms permission to access this data');
    }
    
    // Fetch regions from Firestore
    const regionsSnapshot = await db.collection('comms_regions').get();
    
    if (regionsSnapshot.empty) {
      // If no regions exist, return the default data
      return {
        success: true,
        regions: LOUISIANA_REGIONS,
        source: 'default'
      };
    }
    
    // Convert snapshot to object
    const regions = {};
    regionsSnapshot.forEach(doc => {
      regions[doc.id] = doc.data();
    });
    
    return {
      success: true,
      regions,
      source: 'firestore'
    };
    
  } catch (error) {
    logger.error('Error in getCommsRegions:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to fetch regions data');
  }
});

// Export regions data for use in other functions
exports.LOUISIANA_REGIONS = LOUISIANA_REGIONS;