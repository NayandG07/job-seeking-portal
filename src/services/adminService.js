import { 
  collection, 
  doc, 
  addDoc,
  getDocs, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  endBefore,
  Timestamp,
  writeBatch,
  count,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../lib/firebaseClient.js';

// Collections
const USERS_COLLECTION = 'users';
const JOBS_COLLECTION = 'jobs';
const COMPANIES_COLLECTION = 'companies';
const APPLICATIONS_COLLECTION = 'applications';
const AUDIT_LOG_COLLECTION = 'auditLog';
const MODERATION_COLLECTION = 'contentModeration';

// User Management
export async function getAllUsers(filters, pageSize = 50, startAfterDoc) {
  try {
    let baseQuery = query(collection(db, USERS_COLLECTION));

    // Apply filters
    if (filters?.userRole) {
      baseQuery = query(baseQuery, where('role', '==', filters.userRole));
    }

    if (filters?.status) {
      const isDisabled = filters.status === 'disabled';
      baseQuery = query(baseQuery, where('disabled', '==', isDisabled));
    }

    // Add ordering and pagination
    baseQuery = query(baseQuery, orderBy('createdAt', 'desc'));
    
    if (startAfterDoc) {
      baseQuery = query(baseQuery, startAfter(startAfterDoc));
    }
    
    baseQuery = query(baseQuery, firestoreLimit(pageSize + 1));

    const snapshot = await getDocs(baseQuery);
    const users = snapshot.docs.slice(0, pageSize).map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    // Filter by search term if provided (client-side since Firestore doesn't support text search)
    let filteredUsers = users;
    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredUsers = users.filter(user => 
        user.displayName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = snapshot.docs.length > pageSize;

    return { users: filteredUsers, hasMore };
  } catch (error) {
    console.error('Error getting users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function getUserById(userId) {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return {
      uid: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to fetch user');
  }
}

export async function updateUserRole(adminId, updateData) {
  try {
    const userRef = doc(db, USERS_COLLECTION, updateData.userId);
    
    // Update user role
    await updateDoc(userRef, {
      role: updateData.newRole,
      updatedAt: Timestamp.now()
    });

    // Log the action
    await logAuditAction(adminId, 'role_change', 'user', updateData.userId, {
      newRole: updateData.newRole,
      reason: updateData.reason
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
}

export async function disableUser(adminId, userData) {
  try {
    const userRef = doc(db, USERS_COLLECTION, userData.userId);
    
    await updateDoc(userRef, {
      disabled: userData.disabled,
      disabledAt: userData.disabled ? Timestamp.now() : null,
      disabledReason: userData.disabled ? userData.reason : null,
      updatedAt: Timestamp.now()
    });

    // Log the action
    await logAuditAction(adminId, userData.disabled ? 'disable_user' : 'enable_user', 'user', userData.userId, {
      reason: userData.reason
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw new Error('Failed to update user status');
  }
}

// Content Moderation
export async function deleteContent(adminId, deleteData) {
  try {
    const batch = writeBatch(db);
    
    // Delete the content
    const contentRef = doc(db, deleteData.contentType === 'job' ? JOBS_COLLECTION : 
                           deleteData.contentType === 'company' ? COMPANIES_COLLECTION : 
                           USERS_COLLECTION, deleteData.contentId);
    
    batch.delete(contentRef);

    // If deleting a company, also delete its jobs
    if (deleteData.contentType === 'company') {
      const jobsQuery = query(
        collection(db, JOBS_COLLECTION),
        where('companyId', '==', deleteData.contentId)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      jobsSnapshot.docs.forEach(jobDoc => {
        batch.delete(jobDoc.ref);
      });
    }

    // If deleting a job, also delete its applications
    if (deleteData.contentType === 'job') {
      const applicationsQuery = query(
        collection(db, APPLICATIONS_COLLECTION),
        where('jobId', '==', deleteData.contentId)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      applicationsSnapshot.docs.forEach(appDoc => {
        batch.delete(appDoc.ref);
      });
    }

    await batch.commit();

    // Log the action
    await logAuditAction(adminId, 'delete_content', deleteData.contentType, deleteData.contentId, {
      reason: deleteData.reason
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    throw new Error('Failed to delete content');
  }
}

// Analytics
export async function getPlatformAnalytics() {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Users analytics
    const [totalUsersSnap, studentsSnap, recruitersSnap, adminsSnap] = await Promise.all([
      getCountFromServer(collection(db, USERS_COLLECTION)),
      getCountFromServer(query(collection(db, USERS_COLLECTION), where('role', '==', 'student'))),
      getCountFromServer(query(collection(db, USERS_COLLECTION), where('role', '==', 'recruiter'))),
      getCountFromServer(query(collection(db, USERS_COLLECTION), where('role', '==', 'admin')))
    ]);

    const [newUsersWeekSnap, newUsersMonthSnap] = await Promise.all([
      getCountFromServer(query(collection(db, USERS_COLLECTION), where('createdAt', '>=', Timestamp.fromDate(weekAgo)))),
      getCountFromServer(query(collection(db, USERS_COLLECTION), where('createdAt', '>=', Timestamp.fromDate(monthAgo))))
    ]);

    // Jobs analytics  
    const [totalJobsSnap, activeJobsSnap, closedJobsSnap] = await Promise.all([
      getCountFromServer(collection(db, JOBS_COLLECTION)),
      getCountFromServer(query(collection(db, JOBS_COLLECTION), where('status', '==', 'active'))),
      getCountFromServer(query(collection(db, JOBS_COLLECTION), where('status', '==', 'closed')))
    ]);

    const [newJobsWeekSnap, newJobsMonthSnap] = await Promise.all([
      getCountFromServer(query(collection(db, JOBS_COLLECTION), where('postedAt', '>=', Timestamp.fromDate(weekAgo)))),
      getCountFromServer(query(collection(db, JOBS_COLLECTION), where('postedAt', '>=', Timestamp.fromDate(monthAgo))))
    ]);

    // Applications analytics
    const [totalAppsSnap, pendingAppsSnap, reviewedAppsSnap, acceptedAppsSnap, rejectedAppsSnap] = await Promise.all([
      getCountFromServer(collection(db, APPLICATIONS_COLLECTION)),
      getCountFromServer(query(collection(db, APPLICATIONS_COLLECTION), where('status', '==', 'pending'))),
      getCountFromServer(query(collection(db, APPLICATIONS_COLLECTION), where('status', '==', 'reviewed'))),
      getCountFromServer(query(collection(db, APPLICATIONS_COLLECTION), where('status', '==', 'accepted'))),
      getCountFromServer(query(collection(db, APPLICATIONS_COLLECTION), where('status', '==', 'rejected')))
    ]);

    const [newAppsWeekSnap, newAppsMonthSnap] = await Promise.all([
      getCountFromServer(query(collection(db, APPLICATIONS_COLLECTION), where('appliedAt', '>=', Timestamp.fromDate(weekAgo)))),
      getCountFromServer(query(collection(db, APPLICATIONS_COLLECTION), where('appliedAt', '>=', Timestamp.fromDate(monthAgo))))
    ]);

    // Companies analytics
    const [totalCompaniesSnap, newCompaniesWeekSnap, newCompaniesMonthSnap] = await Promise.all([
      getCountFromServer(collection(db, COMPANIES_COLLECTION)),
      getCountFromServer(query(collection(db, COMPANIES_COLLECTION), where('createdAt', '>=', Timestamp.fromDate(weekAgo)))),
      getCountFromServer(query(collection(db, COMPANIES_COLLECTION), where('createdAt', '>=', Timestamp.fromDate(monthAgo))))
    ]);

    // Calculate average applications per job
    const totalJobs = totalJobsSnap.data().count;
    const totalApps = totalAppsSnap.data().count;
    const averageApplications = totalJobs > 0 ? Math.round((totalApps / totalJobs) * 10) / 10 : 0;

    // Get companies with active jobs count
    const activeJobsSnapshot = await getDocs(query(
      collection(db, JOBS_COLLECTION), 
      where('status', '==', 'active')
    ));
    const companiesWithActiveJobs = new Set(activeJobsSnapshot.docs.map(doc => doc.data().companyId));

    return {
      users: {
        total: totalUsersSnap.data().count,
        students: studentsSnap.data().count,
        recruiters: recruitersSnap.data().count,
        admins: adminsSnap.data().count,
        activeToday: 0, // Would need lastLoginAt tracking
        activeThisWeek: 0, // Would need lastLoginAt tracking
        activeThisMonth: 0, // Would need lastLoginAt tracking
        newThisWeek: newUsersWeekSnap.data().count,
        newThisMonth: newUsersMonthSnap.data().count
      },
      jobs: {
        total: totalJobsSnap.data().count,
        active: activeJobsSnap.data().count,
        closed: closedJobsSnap.data().count,
        postedThisWeek: newJobsWeekSnap.data().count,
        postedThisMonth: newJobsMonthSnap.data().count,
        averageApplications
      },
      applications: {
        total: totalAppsSnap.data().count,
        pending: pendingAppsSnap.data().count,
        reviewed: reviewedAppsSnap.data().count,
        accepted: acceptedAppsSnap.data().count,
        rejected: rejectedAppsSnap.data().count,
        submittedThisWeek: newAppsWeekSnap.data().count,
        submittedThisMonth: newAppsMonthSnap.data().count
      },
      companies: {
        total: totalCompaniesSnap.data().count,
        withActiveJobs: companiesWithActiveJobs.size,
        createdThisWeek: newCompaniesWeekSnap.data().count,
        createdThisMonth: newCompaniesMonthSnap.data().count
      }
    };
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    throw new Error('Failed to fetch platform analytics');
  }
}

export async function getAdminDashboardStats() {
  try {
    const [analytics] = await Promise.all([
      getPlatformAnalytics()
    ]);

    // Get recent users
    const recentUsersQuery = query(
      collection(db, USERS_COLLECTION),
      orderBy('createdAt', 'desc'),
      firestoreLimit(5)
    );
    const recentUsersSnapshot = await getDocs(recentUsersQuery);
    const recentUsers = recentUsersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    // Get recent jobs
    const recentJobsQuery = query(
      collection(db, JOBS_COLLECTION),
      orderBy('postedAt', 'desc'),
      firestoreLimit(5)
    );
    const recentJobsSnapshot = await getDocs(recentJobsQuery);
    const recentJobs = await Promise.all(
      recentJobsSnapshot.docs.map(async (jobDoc) => {
        const jobData = jobDoc.data();
        
        // Get application count for this job
        const appCountSnap = await getCountFromServer(
          query(collection(db, APPLICATIONS_COLLECTION), where('jobId', '==', jobDoc.id))
        );

        return {
          id: jobDoc.id,
          title: jobData.title,
          companyName: jobData.companyName,
          postedAt: jobData.postedAt,
          applicationCount: appCountSnap.data().count
        };
      })
    );

    return {
      totalUsers: analytics.users.total,
      totalJobs: analytics.jobs.total,
      totalApplications: analytics.applications.total,
      totalCompanies: analytics.companies.total,
      recentUsers,
      recentJobs,
      pendingReports: [] // Would be populated from moderation collection
    };
  } catch (error) {
    console.error('Error getting admin dashboard stats:', error);
    throw new Error('Failed to fetch admin dashboard stats');
  }
}

// Audit Logging
export async function logAuditAction(
  adminId, 
  action, 
  targetType, 
  targetId, 
  details
) {
  try {
    // Get admin info
    const adminDoc = await getDoc(doc(db, USERS_COLLECTION, adminId));
    const adminName = adminDoc.exists() ? adminDoc.data().displayName : 'Unknown Admin';

    const auditEntry = {
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      details,
      timestamp: Timestamp.now()
    };

    await addDoc(collection(db, AUDIT_LOG_COLLECTION), auditEntry);
  } catch (error) {
    console.error('Error logging audit action:', error);
    // Don't throw error here as we don't want audit logging to break main operations
  }
}

export async function getAuditLog(pageSize = 50, startAfterDoc) {
  try {
    let auditQuery = query(
      collection(db, AUDIT_LOG_COLLECTION),
      orderBy('timestamp', 'desc')
    );

    if (startAfterDoc) {
      auditQuery = query(auditQuery, startAfter(startAfterDoc));
    }

    auditQuery = query(auditQuery, firestoreLimit(pageSize + 1));

    const snapshot = await getDocs(auditQuery);
    const entries = snapshot.docs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const hasMore = snapshot.docs.length > pageSize;

    return { entries, hasMore };
  } catch (error) {
    console.error('Error getting audit log:', error);
    throw new Error('Failed to fetch audit log');
  }
}

// Search and filtering utilities
export async function searchContent(searchTerm, contentType) {
  try {
    const collectionName = contentType === 'job' ? JOBS_COLLECTION :
                          contentType === 'company' ? COMPANIES_COLLECTION :
                          USERS_COLLECTION;

    // Basic search - in a real app, you might want to use Algolia or similar for full-text search
    const snapshot = await getDocs(collection(db, collectionName));
    
    const results = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((item) => {
        const searchLower = searchTerm.toLowerCase();
        
        if (contentType === 'job') {
          return item.title?.toLowerCase().includes(searchLower) ||
                 item.description?.toLowerCase().includes(searchLower) ||
                 item.companyName?.toLowerCase().includes(searchLower);
        } else if (contentType === 'company') {
          return item.name?.toLowerCase().includes(searchLower) ||
                 item.description?.toLowerCase().includes(searchLower);
        } else if (contentType === 'user') {
          return item.displayName?.toLowerCase().includes(searchLower) ||
                 item.email?.toLowerCase().includes(searchLower);
        }
        
        return false;
      });

    return results;
  } catch (error) {
    console.error('Error searching content:', error);
    throw new Error('Failed to search content');
  }
}