import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import {
  User,
  CommitteeGroup,
  FormTemplate,
  EvaluationSubmission,
  SystemSettings,
  AuditLog,
  GradeThreshold,
  TargetPositionGroup,
} from '../types';

// Collection References
const USERS_COLLECTION = 'users';
const GROUPS_COLLECTION = 'committeeGroups';
const TARGET_GROUPS_COLLECTION = 'targetPositionGroups';
const TEMPLATES_COLLECTION = 'formTemplates';
const SUBMISSIONS_COLLECTION = 'submissions';
const SETTINGS_COLLECTION = 'systemSettings';
const LOGS_COLLECTION = 'auditLogs';
const THRESHOLDS_COLLECTION = 'gradeThresholds';

/**
 * Strips undefined values and deep copies objects so Firestore never rejects data
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return data;
  return JSON.parse(
    JSON.stringify(data, (key, value) => {
      if (value === undefined) return null;
      return value;
    })
  );
}

export const FirebaseService = {
  // ----------------------------------------------------
  // System Settings
  // ----------------------------------------------------
  async getSystemSettings(): Promise<SystemSettings | null> {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, 'current');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as SystemSettings;
      }
      return null;
    } catch (error) {
      console.error('Error getting system settings from Firebase:', error);
      return null;
    }
  },

  async saveSystemSettings(settings: SystemSettings): Promise<void> {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, 'current');
      const cleanData = sanitizeForFirestore({ ...settings, updatedAt: new Date().toISOString() });
      await setDoc(docRef, cleanData, { merge: true });
    } catch (error) {
      console.error('Error saving system settings to Firebase:', error);
      throw error;
    }
  },

  listenSystemSettings(callback: (settings: SystemSettings | null) => void) {
    const docRef = doc(db, SETTINGS_COLLECTION, 'current');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as SystemSettings);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to system settings:', error);
      }
    );
  },

  // ----------------------------------------------------
  // Users (Evaluators, Evaluatees, Admins)
  // ----------------------------------------------------
  async getUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, USERS_COLLECTION));
      return snapshot.docs.map((d) => d.data() as User);
    } catch (error) {
      console.error('Error fetching users from Firebase:', error);
      return [];
    }
  },

  async saveUser(user: User): Promise<void> {
    try {
      const docRef = doc(db, USERS_COLLECTION, user.id);
      const cleanData = sanitizeForFirestore(user);
      await setDoc(docRef, cleanData, { merge: true });
    } catch (error) {
      console.error('Error saving user to Firebase:', error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, userId));
    } catch (error) {
      console.error('Error deleting user from Firebase:', error);
      throw error;
    }
  },

  listenUsers(callback: (users: User[]) => void) {
    return onSnapshot(
      collection(db, USERS_COLLECTION),
      (snapshot) => {
        const users = snapshot.docs.map((d) => d.data() as User);
        if (users.length > 0) {
          callback(users);
        }
      },
      (error) => {
        console.error('Error listening to users:', error);
      }
    );
  },

  // ----------------------------------------------------
  // Committee Groups
  // ----------------------------------------------------
  async getCommitteeGroups(): Promise<CommitteeGroup[]> {
    try {
      const snapshot = await getDocs(collection(db, GROUPS_COLLECTION));
      return snapshot.docs.map((d) => d.data() as CommitteeGroup);
    } catch (error) {
      console.error('Error fetching groups from Firebase:', error);
      return [];
    }
  },

  async saveCommitteeGroup(group: CommitteeGroup): Promise<void> {
    try {
      const docRef = doc(db, GROUPS_COLLECTION, group.id);
      const cleanData = sanitizeForFirestore(group);
      await setDoc(docRef, cleanData, { merge: true });
    } catch (error) {
      console.error('Error saving group to Firebase:', error);
      throw error;
    }
  },

  async deleteCommitteeGroup(groupId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, GROUPS_COLLECTION, groupId));
    } catch (error) {
      console.error('Error deleting group from Firebase:', error);
      throw error;
    }
  },

  listenCommitteeGroups(callback: (groups: CommitteeGroup[]) => void) {
    return onSnapshot(
      collection(db, GROUPS_COLLECTION),
      (snapshot) => {
        const groups = snapshot.docs.map((d) => d.data() as CommitteeGroup);
        if (groups.length > 0) {
          callback(groups);
        }
      },
      (error) => {
        console.error('Error listening to groups:', error);
      }
    );
  },

  // ----------------------------------------------------
  // Target Position Groups (กลุ่มสายงานเป้าหมาย)
  // ----------------------------------------------------
  async getTargetPositionGroups(): Promise<TargetPositionGroup[]> {
    try {
      const snapshot = await getDocs(collection(db, TARGET_GROUPS_COLLECTION));
      return snapshot.docs.map((d) => d.data() as TargetPositionGroup);
    } catch (error) {
      console.error('Error fetching target position groups from Firebase:', error);
      return [];
    }
  },

  async saveTargetPositionGroup(group: TargetPositionGroup): Promise<void> {
    try {
      const docRef = doc(db, TARGET_GROUPS_COLLECTION, group.id);
      const cleanData = sanitizeForFirestore({ ...group, updatedAt: new Date().toISOString() });
      await setDoc(docRef, cleanData, { merge: true });
    } catch (error) {
      console.error('Error saving target position group to Firebase:', error);
      throw error;
    }
  },

  async deleteTargetPositionGroup(groupId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TARGET_GROUPS_COLLECTION, groupId));
    } catch (error) {
      console.error('Error deleting target position group from Firebase:', error);
      throw error;
    }
  },

  listenTargetPositionGroups(callback: (groups: TargetPositionGroup[]) => void) {
    return onSnapshot(
      collection(db, TARGET_GROUPS_COLLECTION),
      (snapshot) => {
        const groups = snapshot.docs.map((d) => d.data() as TargetPositionGroup);
        if (groups.length > 0) {
          groups.sort((a, b) => (a.order || 99) - (b.order || 99));
          callback(groups);
        }
      },
      (error) => {
        console.error('Error listening to target position groups:', error);
      }
    );
  },

  // ----------------------------------------------------
  // Form Templates
  // ----------------------------------------------------
  async getFormTemplates(): Promise<FormTemplate[]> {
    try {
      const snapshot = await getDocs(collection(db, TEMPLATES_COLLECTION));
      return snapshot.docs.map((d) => d.data() as FormTemplate);
    } catch (error) {
      console.error('Error fetching templates from Firebase:', error);
      return [];
    }
  },

  async saveFormTemplate(template: FormTemplate): Promise<void> {
    try {
      const docRef = doc(db, TEMPLATES_COLLECTION, template.id);
      const cleanData = sanitizeForFirestore(template);
      await setDoc(docRef, cleanData, { merge: true });
    } catch (error) {
      console.error('Error saving template to Firebase:', error);
      throw error;
    }
  },

  async deleteFormTemplate(templateId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, TEMPLATES_COLLECTION, templateId));
    } catch (error) {
      console.error('Error deleting template from Firebase:', error);
      throw error;
    }
  },

  listenFormTemplates(callback: (templates: FormTemplate[]) => void) {
    return onSnapshot(
      collection(db, TEMPLATES_COLLECTION),
      (snapshot) => {
        const templates = snapshot.docs.map((d) => d.data() as FormTemplate);
        if (templates.length > 0) {
          callback(templates);
        }
      },
      (error) => {
        console.error('Error listening to templates:', error);
      }
    );
  },

  // ----------------------------------------------------
  // Submissions (Evaluations & Drafts)
  // ----------------------------------------------------
  async getSubmissions(): Promise<EvaluationSubmission[]> {
    try {
      const snapshot = await getDocs(collection(db, SUBMISSIONS_COLLECTION));
      return snapshot.docs.map((d) => d.data() as EvaluationSubmission);
    } catch (error) {
      console.error('Error fetching submissions from Firebase:', error);
      return [];
    }
  },

  async saveSubmission(submission: EvaluationSubmission): Promise<void> {
    try {
      const docRef = doc(db, SUBMISSIONS_COLLECTION, submission.id);
      const cleanData = sanitizeForFirestore(submission);
      await setDoc(docRef, cleanData, { merge: true });
    } catch (error) {
      console.error('Error saving submission to Firebase:', error);
      throw error;
    }
  },

  async deleteSubmission(submissionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId));
    } catch (error) {
      console.error('Error deleting submission from Firebase:', error);
      throw error;
    }
  },

  listenSubmissions(callback: (submissions: EvaluationSubmission[]) => void) {
    return onSnapshot(
      collection(db, SUBMISSIONS_COLLECTION),
      (snapshot) => {
        const subs = snapshot.docs.map((d) => d.data() as EvaluationSubmission);
        callback(subs);
      },
      (error) => {
        console.error('Error listening to submissions:', error);
      }
    );
  },

  // ----------------------------------------------------
  // Grade Thresholds
  // ----------------------------------------------------
  async saveGradeThresholds(thresholds: GradeThreshold[]): Promise<void> {
    try {
      const docRef = doc(db, THRESHOLDS_COLLECTION, 'current');
      const cleanData = sanitizeForFirestore({ thresholds, updatedAt: new Date().toISOString() });
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error('Error saving thresholds to Firebase:', error);
    }
  },

  listenGradeThresholds(callback: (thresholds: GradeThreshold[]) => void) {
    const docRef = doc(db, THRESHOLDS_COLLECTION, 'current');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.thresholds)) {
            callback(data.thresholds as GradeThreshold[]);
          }
        }
      },
      (error) => {
        console.error('Error listening to thresholds:', error);
      }
    );
  },

  // ----------------------------------------------------
  // Audit Logs
  // ----------------------------------------------------
  async addAuditLog(log: AuditLog): Promise<void> {
    try {
      const docRef = doc(db, LOGS_COLLECTION, log.id);
      const cleanData = sanitizeForFirestore(log);
      await setDoc(docRef, cleanData);
    } catch (error) {
      console.error('Error saving audit log to Firebase:', error);
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const snapshot = await getDocs(collection(db, LOGS_COLLECTION));
      return snapshot.docs.map((d) => d.data() as AuditLog);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  },

  listenAuditLogs(callback: (logs: AuditLog[]) => void) {
    return onSnapshot(
      collection(db, LOGS_COLLECTION),
      (snapshot) => {
        const logs = snapshot.docs.map((d) => d.data() as AuditLog);
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(logs.slice(0, 100));
      },
      (error) => {
        console.error('Error listening to audit logs:', error);
      }
    );
  },

  // ----------------------------------------------------
  // Batch Seed Initial Data to Firebase
  // ----------------------------------------------------
  async seedInitialData(
    users: User[],
    groups: CommitteeGroup[],
    templates: FormTemplate[],
    submissions: EvaluationSubmission[],
    settings: SystemSettings,
    thresholds?: GradeThreshold[],
    targetGroups?: TargetPositionGroup[]
  ): Promise<void> {
    try {
      // 1. Save Settings
      if (settings) {
        const settingsRef = doc(db, SETTINGS_COLLECTION, 'current');
        await setDoc(settingsRef, sanitizeForFirestore({ ...settings, updatedAt: new Date().toISOString() }));
      }

      // 2. Save Thresholds
      if (thresholds && thresholds.length > 0) {
        const threshRef = doc(db, THRESHOLDS_COLLECTION, 'current');
        await setDoc(threshRef, sanitizeForFirestore({ thresholds, updatedAt: new Date().toISOString() }));
      }

      // 3. Save Committee Groups
      if (groups && groups.length > 0) {
        for (const g of groups) {
          const gRef = doc(db, GROUPS_COLLECTION, g.id);
          await setDoc(gRef, sanitizeForFirestore(g), { merge: true });
        }
      }

      // 4. Save Target Position Groups
      if (targetGroups && targetGroups.length > 0) {
        for (const tg of targetGroups) {
          const tgRef = doc(db, TARGET_GROUPS_COLLECTION, tg.id);
          await setDoc(tgRef, sanitizeForFirestore({ ...tg, updatedAt: new Date().toISOString() }), { merge: true });
        }
      }

      // 5. Save Form Templates (one by one to prevent batch size overflow)
      if (templates && templates.length > 0) {
        for (const tmpl of templates) {
          const tRef = doc(db, TEMPLATES_COLLECTION, tmpl.id);
          await setDoc(tRef, sanitizeForFirestore(tmpl), { merge: true });
        }
      }

      // 6. Save Users in batches of 20
      if (users && users.length > 0) {
        for (let i = 0; i < users.length; i += 20) {
          const batch = writeBatch(db);
          const chunk = users.slice(i, i + 20);
          chunk.forEach((u) => {
            const uRef = doc(db, USERS_COLLECTION, u.id);
            batch.set(uRef, sanitizeForFirestore(u), { merge: true });
          });
          await batch.commit();
        }
      }

      // 7. Save Submissions in batches
      if (submissions && submissions.length > 0) {
        for (let i = 0; i < submissions.length; i += 20) {
          const batch = writeBatch(db);
          const chunk = submissions.slice(i, i + 20);
          chunk.forEach((s) => {
            const sRef = doc(db, SUBMISSIONS_COLLECTION, s.id);
            batch.set(sRef, sanitizeForFirestore(s), { merge: true });
          });
          await batch.commit();
        }
      }

      console.log('Firebase Firestore synchronized successfully across all collections!');
    } catch (error) {
      console.error('Error seeding Firebase data:', error);
      throw error;
    }
  },
};
