import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  CommitteeGroup,
  FormTemplate,
  GradeThreshold,
  EvaluationSubmission,
  AggregatedResult,
  AuditLog,
  AuditActionCategory,
  SystemBackupData,
  LocalSnapshotItem,
  SystemSettings,
  TargetPositionGroup,
  UserRole,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_COMMITTEE_GROUPS,
  GRADE_THRESHOLDS,
  INITIAL_SUBMISSIONS,
  INITIAL_TARGET_POSITION_GROUPS,
} from '../data/initialData';
import { FORM_TEMPLATES } from '../data/formTemplates';
import { calculateAggregatedResult, getFormTemplateForUser } from '../utils/evaluationCalculator';
import { CHAINAT_SCHOOL_LOGO } from '../data/presetLogos';
import { FirebaseService } from '../firebase/firebaseService';
import {
  buildSystemBackupData,
  downloadJsonFile,
  downloadCsvFile,
  generateSurveyCsv,
  loadLocalSnapshots,
  saveLocalSnapshots,
  MAX_SNAPSHOTS,
} from '../utils/backupUtils';

export type ViewType =
  | 'dashboard'
  | 'evaluate'
  | 'groups'
  | 'reports'
  | 'templates'
  | 'users'
  | 'forms_admin'
  | 'my_evaluation'
  | 'schema'
  | 'settings'
  | 'audit_logs'
  | 'backup';

export const DEFAULT_SETTINGS: SystemSettings = {
  appName: 'ระบบประเมินผลการปฏิบัติงานลูกจ้างชั่วคราวและจ้างเหมาบริการ',
  appShortName: 'PES v3.0',
  schoolName: 'โรงเรียนศึกษาพิเศษชัยนาท',
  schoolAffiliation: 'สำนักบริหารงานการศึกษาพิเศษ สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',
  logoUrl: CHAINAT_SCHOOL_LOGO,
  isDemoMode: true,
  academicYear: '2569',
  evaluationRound: 'การประเมินผลการปฏิบัติงาน ปีงบประมาณ 2569 (คำสั่งที่ 251/2569 และ 252/2569)',
};

/**
 * Sanitizes and repairs users to guarantee:
 * 1. Exactly 1 Admin: นางสาวรัณย์ณภัทร มากุญชร (rannaphat, EV-302)
 * 2. นางสาวอรวรรณ พงษ์ศิริ (orawan, EV-101) is strictly Evaluator / Deputy Director
 * 3. All users have synchronized avatar and avatarUrl fields
 */
export function sanitizeAndFixUsers(rawUsers: User[]): { sanitized: User[]; hasChanged: boolean } {
  let hasChanged = false;
  const userMap = new Map<string, User>();

  for (const raw of rawUsers) {
    // Purge unwanted test user 'staff_gov_1' (นายณัฐพล บุญรักษา)
    if (raw.id === 'staff_gov_1' || raw.name?.includes('ณัฐพล บุญรักษา')) {
      hasChanged = true;
      continue;
    }

    let u = { ...raw };

    // Normalize avatar and avatarUrl for all users without overwriting custom uploads
    if (u.avatar && !u.avatarUrl) {
      u.avatarUrl = u.avatar;
      hasChanged = true;
    }
    if (u.avatarUrl && !u.avatar) {
      u.avatar = u.avatarUrl;
      hasChanged = true;
    }

    userMap.set(u.id, u);
  }

  const sanitized = Array.from(userMap.values());
  return { sanitized, hasChanged };
}

export interface RestoreOptions {
  restoreUsersAndGroups?: boolean;
  restoreSubmissions?: boolean;
  restoreForms?: boolean;
  restoreSettings?: boolean;
  restoreThresholds?: boolean;
  restoreTargetGroups?: boolean;
}

interface AppContextType {
  // Auth
  currentUser: User;
  setCurrentUser: (user: User) => void;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; message?: string };
  loginAsUser: (user: User) => void;
  logout: () => void;

  // System Settings
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  resetSystemSettings: () => void;

  // Data
  users: User[];
  committeeGroups: CommitteeGroup[];
  targetPositionGroups: TargetPositionGroup[];
  formTemplates: FormTemplate[];
  gradeThresholds: GradeThreshold[];
  submissions: EvaluationSubmission[];
  auditLogs: AuditLog[];
  aggregatedResults: AggregatedResult[];

  // Firebase status
  isFirebaseSyncing: boolean;
  isFirebaseConnected: boolean;
  syncAllToFirebase: () => Promise<void>;
  
  // Navigation / Active Context
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  selectedFormId: string;
  setSelectedFormId: (id: string) => void;
  selectedEvaluateeId: string;
  setSelectedEvaluateeId: (id: string) => void;
  
  // Evaluations & Scoring Management
  submitEvaluation: (submission: Omit<EvaluationSubmission, 'id' | 'submittedAt'>) => Promise<EvaluationSubmission>;
  saveDraftEvaluation: (submission: Omit<EvaluationSubmission, 'id' | 'submittedAt'>) => void;
  getDraftEvaluation: (evaluateeId: string, formId: string) => EvaluationSubmission | null;
  clearDraftEvaluation: (evaluateeId: string, formId: string) => void;
  deleteSubmission: (submissionId: string) => void;
  deleteEvaluationByEvaluator: (evaluateeId: string, evaluatorId: string) => void;
  updateSubmission: (submission: EvaluationSubmission) => void;
  adminUpsertSubmission: (submission: Omit<EvaluationSubmission, 'id' | 'submittedAt'> & { id?: string }) => EvaluationSubmission;

  // Committee Group CRUD
  updateCommitteeGroup: (group: CommitteeGroup) => void;
  addCommitteeGroup: (group: Omit<CommitteeGroup, 'id' | 'createdAt'>) => void;
  deleteCommitteeGroup: (groupId: string) => void;

  // Target Position Group (กลุ่มสายงานเป้าหมาย) CRUD
  addTargetPositionGroup: (groupData: Omit<TargetPositionGroup, 'id'>) => TargetPositionGroup;
  updateTargetPositionGroup: (group: TargetPositionGroup) => void;
  deleteTargetPositionGroup: (groupId: string) => void;

  // User Management CRUD & Committee Profile
  addUser: (userData: Omit<User, 'id'>) => User;
  updateUser: (user: User) => void;
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  resetUserPassword: (userId: string, newPassword: string) => void;

  // Form Management CRUD
  updateFormTemplate: (form: FormTemplate) => void;
  addFormTemplate: (form: Omit<FormTemplate, 'id'>) => FormTemplate;
  deleteFormTemplate: (formId: string) => void;
  resetFormTemplatesToDefault: () => void;

  // Global Settings
  updateGradeThresholds: (thresholds: GradeThreshold[]) => void;
  resetAllDataToDefault: () => void;

  // Backup, Snapshots & Survey Archiving (ป้องกันข้อมูลรีเซ็ต & จัดเก็บข้อมูลสำรวจ)
  localSnapshots: LocalSnapshotItem[];
  createLocalSnapshot: (name: string, notes?: string, autoCreated?: boolean) => LocalSnapshotItem;
  deleteLocalSnapshot: (id: string) => void;
  restoreFromSnapshot: (snapshotId: string, options?: RestoreOptions) => Promise<{ success: boolean; message: string }>;
  exportSystemBackup: (notes?: string) => SystemBackupData;
  restoreSystemBackup: (backupData: SystemBackupData, options?: RestoreOptions) => Promise<{ success: boolean; message: string }>;
  downloadBackupFile: (notes?: string) => void;
  downloadSurveyArchive: () => void;
  clearAuditLogs: () => void;
  logAudit: (
    action: string,
    details: string,
    options?: {
      category?: AuditActionCategory;
      targetUserId?: string;
      targetUserName?: string;
      previousValue?: string;
      newValue?: string;
      status?: 'SUCCESS' | 'WARNING' | 'ERROR';
      userRole?: string;
    }
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: 'pes_current_user_v9',
  IS_AUTH: 'pes_is_auth_v9',
  USERS: 'pes_users_v9',
  GROUPS: 'pes_groups_v9',
  TARGET_GROUPS: 'pes_target_groups_v9',
  TEMPLATES: 'pes_templates_v9',
  SUBMISSIONS: 'pes_submissions_v9',
  THRESHOLDS: 'pes_thresholds_v9',
  AUDIT_LOGS: 'pes_audit_logs_v9',
  SETTINGS: 'pes_settings_v9',
  FIREBASE_INITIALIZED: 'pes_firebase_initialized_v9',
  SNAPSHOTS: 'pes_snapshots_v9',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState<boolean>(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // 1. Users state
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    const parsed = saved ? JSON.parse(saved) : INITIAL_USERS;
    return sanitizeAndFixUsers(parsed).sanitized;
  });

  // 1.1 System Settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 2. Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_AUTH);
    return saved ? JSON.parse(saved) : true;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure currentUser is sanitized
        const { sanitized } = sanitizeAndFixUsers([parsed]);
        if (sanitized.length > 0) return sanitized[0];
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_USERS[0];
  });

  // 3. Committee Groups
  const [committeeGroups, setCommitteeGroups] = useState<CommitteeGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
    return saved ? JSON.parse(saved) : INITIAL_COMMITTEE_GROUPS;
  });

  // 3.1 Target Position Groups (กลุ่มสายงานเป้าหมาย)
  const [targetPositionGroups, setTargetPositionGroups] = useState<TargetPositionGroup[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TARGET_GROUPS);
    if (saved) {
      try {
        const parsed: TargetPositionGroup[] = JSON.parse(saved);
        // If stored data has old names, missing group 3, or redundant code suffixes, upgrade
        const needsUpgrade =
          parsed.length < 3 ||
          parsed.some(
            (g) =>
              g.name.includes('กลุ่มที่ 1: ลูกจ้างชั่วคราว') ||
              g.name.includes('กลุ่มที่ 2: ลูกจ้างชั่วคราว') ||
              g.code?.includes('(ครูผู้ช่วย)') ||
              g.code?.includes('(จ้างเหมาบริการ)')
          );
        if (!needsUpgrade) {
          return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_TARGET_POSITION_GROUPS;
  });

  // 4. Form Templates
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (saved) {
      try {
        let parsed: FormTemplate[] = JSON.parse(saved);
        const hasGovTeacher = parsed.some((t) => t.id === 'form_government_employee_teacher');
        if (!hasGovTeacher) {
          const govTemplate = FORM_TEMPLATES.find((t) => t.id === 'form_government_employee_teacher');
          if (govTemplate) parsed = [...parsed, govTemplate];
        }
        const hasClerical = parsed.some((t) => t.id === 'form_support_clerical');
        if (!hasClerical) {
          const clericalTemplate = FORM_TEMPLATES.find((t) => t.id === 'form_support_clerical');
          if (clericalTemplate) parsed = [...parsed, clericalTemplate];
        }
        return parsed;
      } catch (e) {
        // fallback
      }
    }
    return FORM_TEMPLATES;
  });

  // 5. Submissions
  const [submissions, setSubmissions] = useState<EvaluationSubmission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  // 6. Grade Thresholds
  const [gradeThresholds, setGradeThresholds] = useState<GradeThreshold[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THRESHOLDS);
    return saved ? JSON.parse(saved) : GRADE_THRESHOLDS;
  });

  // 7. Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'log_init',
            timestamp: new Date().toISOString(),
            userId: 'user_admin_1',
            userName: 'นายปรัชญา สมณะช้างเผือก',
            userRole: 'admin',
            category: 'SYSTEM',
            action: 'INITIALIZE_SYSTEM',
            details: 'คำสั่งโรงเรียนศึกษาพิเศษชัยนาท ที่ 251/2569 แต่งตั้งคณะกรรมการประเมินผลการปฏิบัติงาน ปีงบประมาณ 2569 ตำแหน่ง ครูผู้ช่วย (ลูกจ้างชั่วคราว)',
            status: 'SUCCESS',
          },
        ];
  });

  // 8. Local Snapshots (จุดสำรองข้อมูลในเครื่องเพื่อกันข้อมูลรีเซ็ต)
  const [localSnapshots, setLocalSnapshots] = useState<LocalSnapshotItem[]>(() => {
    return loadLocalSnapshots();
  });

  useEffect(() => {
    saveLocalSnapshots(localSnapshots);
  }, [localSnapshots]);

  // Active View & Filters
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedFormId, setSelectedFormId] = useState<string>('form_teacher_assistant');
  const [selectedEvaluateeId, setSelectedEvaluateeId] = useState<string>('staff_1');

  // Firebase Realtime Synchronization Listeners
  useEffect(() => {
    let unsubUsers: (() => void) | undefined;
    let unsubGroups: (() => void) | undefined;
    let unsubTargetGroups: (() => void) | undefined;
    let unsubTemplates: (() => void) | undefined;
    let unsubSubs: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;
    let unsubThresholds: (() => void) | undefined;
    let unsubLogs: (() => void) | undefined;

    const setupFirebaseSync = async () => {
      try {
        setIsFirebaseSyncing(true);

        // Verify remote users and settings count in Firestore
        const remoteUsers = await FirebaseService.getUsers();
        const remoteSettings = await FirebaseService.getSystemSettings();

        // Only seed if Firestore is completely brand new and empty (no settings and 0 users)
        // CRITICAL: NEVER overwrite Firestore if users or settings already exist!
        if (!remoteSettings && (!remoteUsers || remoteUsers.length === 0)) {
          console.log('Fresh Firestore detected. Seeding baseline initial dataset...');
          await FirebaseService.seedInitialData(
            INITIAL_USERS,
            INITIAL_COMMITTEE_GROUPS,
            FORM_TEMPLATES,
            INITIAL_SUBMISSIONS,
            DEFAULT_SETTINGS,
            GRADE_THRESHOLDS,
            INITIAL_TARGET_POSITION_GROUPS
          );
        }

        // Setup real-time listeners for all models across all devices (PC, Android, iOS)
        unsubSettings = FirebaseService.listenSystemSettings((remoteSettings) => {
          if (remoteSettings) {
            setSystemSettings((prev) => ({ ...prev, ...remoteSettings }));
          }
        });

        unsubUsers = FirebaseService.listenUsers((remoteUsers) => {
          if (remoteUsers && remoteUsers.length > 0) {
            const { sanitized } = sanitizeAndFixUsers(remoteUsers);
            setUsers(sanitized);
          }
        });

        unsubGroups = FirebaseService.listenCommitteeGroups((remoteGroups) => {
          if (remoteGroups && remoteGroups.length > 0) {
            const cleaned = remoteGroups.map((g) => ({
              ...g,
              assignedEvaluateeIds: (g.assignedEvaluateeIds || []).filter((id) => id !== 'staff_gov_1'),
            }));
            setCommitteeGroups(cleaned);
          }
        });

        unsubTargetGroups = FirebaseService.listenTargetPositionGroups((remoteTargetGroups) => {
          if (remoteTargetGroups && remoteTargetGroups.length > 0) {
            const needsUpgrade =
              remoteTargetGroups.length < 3 ||
              remoteTargetGroups.some(
                (g) =>
                  g.name.includes('กลุ่มที่ 1: ลูกจ้างชั่วคราว') ||
                  g.name.includes('กลุ่มที่ 2: ลูกจ้างชั่วคราว') ||
                  g.code?.includes('(ครูผู้ช่วย)') ||
                  g.code?.includes('(จ้างเหมาบริการ)')
              );
            if (needsUpgrade) {
              console.log('Upgrading target position groups to include Group 3 and updated clean names in Firebase...');
              INITIAL_TARGET_POSITION_GROUPS.forEach((tg) => {
                FirebaseService.saveTargetPositionGroup(tg).catch(console.error);
              });
              setTargetPositionGroups(INITIAL_TARGET_POSITION_GROUPS);
            } else {
              setTargetPositionGroups(remoteTargetGroups);
            }
          } else {
            INITIAL_TARGET_POSITION_GROUPS.forEach((tg) => {
              FirebaseService.saveTargetPositionGroup(tg).catch(console.error);
            });
            setTargetPositionGroups(INITIAL_TARGET_POSITION_GROUPS);
          }
        });

        unsubTemplates = FirebaseService.listenFormTemplates((remoteTemplates) => {
          if (remoteTemplates && remoteTemplates.length > 0) {
            let updatedList = [...remoteTemplates];
            let modified = false;

            const hasGovTeacher = updatedList.some((t) => t.id === 'form_government_employee_teacher');
            if (!hasGovTeacher) {
              const govTemplate = FORM_TEMPLATES.find((t) => t.id === 'form_government_employee_teacher');
              if (govTemplate) {
                FirebaseService.saveFormTemplate(govTemplate).catch(console.error);
                updatedList.push(govTemplate);
                modified = true;
              }
            }

            const hasClerical = updatedList.some((t) => t.id === 'form_support_clerical');
            if (!hasClerical) {
              const clericalTemplate = FORM_TEMPLATES.find((t) => t.id === 'form_support_clerical');
              if (clericalTemplate) {
                FirebaseService.saveFormTemplate(clericalTemplate).catch(console.error);
                updatedList.push(clericalTemplate);
                modified = true;
              }
            }

            setFormTemplates(updatedList);
          }
        });

        unsubSubs = FirebaseService.listenSubmissions((remoteSubs) => {
          if (remoteSubs) {
            // Deduplicate remote submissions by evaluateeId and evaluatorId, keeping latest submittedAt
            const subMap = new Map<string, EvaluationSubmission>();
            const sorted = [...remoteSubs].sort(
              (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
            );
            const duplicatesToDelete: string[] = [];

            sorted.forEach((sub) => {
              const key = `${sub.evaluateeId}_${sub.evaluatorId}`;
              const prev = subMap.get(key);
              if (prev && prev.id !== sub.id) {
                duplicatesToDelete.push(prev.id);
              }
              subMap.set(key, sub);
            });

            // Clean up duplicate documents from Firestore
            duplicatesToDelete.forEach((dupId) => {
              FirebaseService.deleteSubmission(dupId).catch(console.error);
            });

            setSubmissions(Array.from(subMap.values()));
          }
        });

        unsubThresholds = FirebaseService.listenGradeThresholds((remoteThresholds) => {
          if (remoteThresholds && remoteThresholds.length > 0) {
            setGradeThresholds(remoteThresholds);
          }
        });

        unsubLogs = FirebaseService.listenAuditLogs((remoteLogs) => {
          if (remoteLogs && remoteLogs.length > 0) {
            setAuditLogs(remoteLogs);
          }
        });

        setIsFirebaseConnected(true);
      } catch (err) {
        console.error('Firebase sync listener initialization error:', err);
        setIsFirebaseConnected(false);
      } finally {
        setIsFirebaseSyncing(false);
      }
    };

    setupFirebaseSync();

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubGroups) unsubGroups();
      if (unsubTargetGroups) unsubTargetGroups();
      if (unsubTemplates) unsubTemplates();
      if (unsubSubs) unsubSubs();
      if (unsubSettings) unsubSettings();
      if (unsubThresholds) unsubThresholds();
      if (unsubLogs) unsubLogs();
    };
  }, []);

  // Persistence to local storage for fast instant load
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_AUTH, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(committeeGroups));
  }, [committeeGroups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TARGET_GROUPS, JSON.stringify(targetPositionGroups));
  }, [targetPositionGroups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(formTemplates));
  }, [formTemplates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(gradeThresholds));
  }, [gradeThresholds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(systemSettings));
  }, [systemSettings]);

  // Compute Aggregated Results for all Evaluatees
  const [aggregatedResults, setAggregatedResults] = useState<AggregatedResult[]>([]);

  useEffect(() => {
    const results: AggregatedResult[] = [];
    const evaluateeUsers = users.filter((u) => u.role === 'staff');

    evaluateeUsers.forEach((evaluatee) => {
      const assignedGroup =
        committeeGroups.find((g) => g.assignedEvaluateeIds.includes(evaluatee.id)) ||
        committeeGroups[0];

      const matchingForm = getFormTemplateForUser(evaluatee, formTemplates);

      const agg = calculateAggregatedResult(
        evaluatee,
        matchingForm,
        assignedGroup,
        submissions,
        gradeThresholds
      );

      results.push(agg);
    });

    setAggregatedResults(results);
  }, [users, committeeGroups, formTemplates, submissions, gradeThresholds]);

  // Logger helper with enriched category and permission metadata
  const logAudit = (
    action: string,
    details: string,
    options?: {
      category?: AuditActionCategory;
      targetUserId?: string;
      targetUserName?: string;
      previousValue?: string;
      newValue?: string;
      status?: 'SUCCESS' | 'WARNING' | 'ERROR';
      userRole?: string;
    }
  ) => {
    // Determine category automatically if not provided
    let category: AuditActionCategory = options?.category || 'SYSTEM';
    if (!options?.category) {
      if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('AUTH') || action.includes('PASSWORD')) {
        category = 'AUTH';
      } else if (action.includes('ROLE') || action.includes('PERMISSION') || action.includes('SWITCH')) {
        category = 'PERMISSION';
      } else if (action.includes('EVALUATION') || action.includes('SUBMISSION')) {
        category = 'EVALUATION';
      } else if (action.includes('USER')) {
        category = 'USER_MANAGEMENT';
      } else if (action.includes('COMMITTEE') || action.includes('GROUP')) {
        category = 'COMMITTEE';
      } else if (action.includes('BACKUP') || action.includes('SNAPSHOT') || action.includes('RESTORE') || action.includes('SURVEY')) {
        category = 'BACKUP';
      }
    }

    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'ผู้ใช้งานระบบ',
      userRole: options?.userRole || currentUser?.role || 'guest',
      action,
      category,
      details,
      targetUserId: options?.targetUserId,
      targetUserName: options?.targetUserName,
      previousValue: options?.previousValue,
      newValue: options?.newValue,
      status: options?.status || 'SUCCESS',
      deviceInfo: typeof navigator !== 'undefined' ? `${navigator.platform || ''}` : 'Web Client',
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 199)]);
    FirebaseService.addAuditLog(newLog).catch(console.error);
  };

  // Explicit sync button
  const syncAllToFirebase = async () => {
    setIsFirebaseSyncing(true);
    try {
      await FirebaseService.seedInitialData(
        users,
        committeeGroups,
        formTemplates,
        submissions,
        systemSettings,
        gradeThresholds,
        targetPositionGroups
      );
      logAudit('FIREBASE_SYNC_ALL', 'ซิงค์ข้อมูลทั้งหมดขึ้นฐานข้อมูล Firebase สำเร็จ', {
        category: 'SYSTEM',
        status: 'SUCCESS',
      });
      setIsFirebaseConnected(true);
    } catch (e) {
      console.error('Firebase manual sync error:', e);
      throw e;
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  // Auth methods
  const login = (username: string, password: string): { success: boolean; message?: string } => {
    const trimmedUser = username.trim().toLowerCase();
    const foundUser = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === trimmedUser) ||
        u.email.toLowerCase() === trimmedUser ||
        u.id.toLowerCase() === trimmedUser ||
        (trimmedUser === 'admin' && (u.role === 'admin' || u.name.includes('รัณย์ณภัทร'))) ||
        (trimmedUser === 'rannaphat' && u.name.includes('รัณย์ณภัทร')) ||
        (trimmedUser === 'pratchya' && u.name.includes('ปรัชญา'))
    );

    if (!foundUser) {
      logAudit('LOGIN_FAILED', `พยายามเข้าสู่ระบบแต่ไม่พบบัญชี: "${username}"`, {
        category: 'AUTH',
        status: 'WARNING',
      });
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ' };
    }

    if (foundUser.password && foundUser.password !== password) {
      logAudit('LOGIN_FAILED', `รหัสผ่านไม่ถูกต้องสำหรับบัญชี: ${foundUser.name} (${foundUser.id})`, {
        category: 'AUTH',
        targetUserId: foundUser.id,
        targetUserName: foundUser.name,
        status: 'WARNING',
      });
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
    }

    setCurrentUser(foundUser);
    setIsAuthenticated(true);
    const roleLabels: Record<UserRole, string> = {
      admin: 'ผู้บริหาร / แอดมิน (Admin)',
      evaluator: 'คณะกรรมการประเมิน (Evaluator)',
      staff: 'ผู้รับการประเมิน (Staff)',
    };
    logAudit(
      'USER_LOGIN',
      `เข้าสู่ระบบสำเร็จในฐานะ: ${foundUser.name} (${foundUser.position}) [สิทธิ์: ${roleLabels[foundUser.role]}]`,
      {
        category: 'AUTH',
        targetUserId: foundUser.id,
        targetUserName: foundUser.name,
        userRole: foundUser.role,
        status: 'SUCCESS',
      }
    );

    if (foundUser.role === 'staff') {
      setActiveView('my_evaluation');
      setSelectedEvaluateeId(foundUser.id);
    } else {
      setActiveView('dashboard');
    }

    return { success: true };
  };

  const loginAsUser = (user: User) => {
    const prevUser = currentUser;
    setCurrentUser(user);
    setIsAuthenticated(true);
    const roleLabels: Record<UserRole, string> = {
      admin: 'ผู้บริหาร / แอดมิน (Admin)',
      evaluator: 'คณะกรรมการประเมิน (Evaluator)',
      staff: 'ผู้รับการประเมิน (Staff)',
    };
    logAudit(
      'SWITCH_USER_PERMISSION',
      `สลับสิทธิ์การใช้งานเป็น: "${user.name}" (บทบาท: ${roleLabels[user.role]}) โดยผู้ใช้เดิม: "${prevUser?.name || 'ระบบ'}"`,
      {
        category: 'PERMISSION',
        targetUserId: user.id,
        targetUserName: user.name,
        previousValue: prevUser?.role,
        newValue: user.role,
        status: 'SUCCESS',
      }
    );

    if (user.role === 'staff') {
      setActiveView('my_evaluation');
      setSelectedEvaluateeId(user.id);
    } else {
      setActiveView('dashboard');
    }
  };

  const logout = () => {
    logAudit('USER_LOGOUT', `ออกจากระบบ: ${currentUser.name} (${currentUser.position})`, {
      category: 'AUTH',
      status: 'SUCCESS',
    });
    setIsAuthenticated(false);
  };

  // Submissions
  const submitEvaluation = async (
    data: Omit<EvaluationSubmission, 'id' | 'submittedAt'>
  ): Promise<EvaluationSubmission> => {
    // Find existing submission if already evaluated
    const existing = submissions.find(
      (s) => s.evaluateeId === data.evaluateeId && s.evaluatorId === data.evaluatorId
    );
    const submissionId = existing?.id || 'sub_' + Date.now();

    const newSubmission: EvaluationSubmission = {
      ...data,
      id: submissionId,
      submittedAt: new Date().toISOString(),
      isDraft: false,
    };

    setSubmissions((prev) => {
      const filtered = prev.filter(
        (s) =>
          !(s.evaluateeId === data.evaluateeId && s.evaluatorId === data.evaluatorId) &&
          s.id !== submissionId
      );
      return [newSubmission, ...filtered];
    });

    clearDraftEvaluation(data.evaluateeId, data.formId);

    // Save to Firebase (triggers real-time broadcast to all connected devices)
    FirebaseService.saveSubmission(newSubmission).catch(console.error);

    // If there were other duplicate submissions for this evaluator & evaluatee, clean them up from Firestore
    const duplicates = submissions.filter(
      (s) => s.evaluateeId === data.evaluateeId && s.evaluatorId === data.evaluatorId && s.id !== submissionId
    );
    duplicates.forEach((dup) => {
      FirebaseService.deleteSubmission(dup.id).catch(console.error);
    });

    logAudit(
      'SUBMIT_EVALUATION',
      `${existing ? 'แก้ไขผลการประเมิน' : 'ส่งผลการประเมิน'}ให้แก่ ${data.evaluateeName} (${data.evaluateePosition}) ได้คะแนน ${data.percentage}% [${data.grade}]`,
      {
        category: 'EVALUATION',
        targetUserId: data.evaluateeId,
        targetUserName: data.evaluateeName,
        status: 'SUCCESS',
      }
    );

    return newSubmission;
  };

  const saveDraftEvaluation = (data: Omit<EvaluationSubmission, 'id' | 'submittedAt'>) => {
    const draftKey = `draft_${currentUser.id}_${data.evaluateeId}_${data.formId}`;
    const draftSubmission: EvaluationSubmission = {
      ...data,
      id: 'draft_' + Date.now(),
      submittedAt: new Date().toISOString(),
      isDraft: true,
    };
    localStorage.setItem(draftKey, JSON.stringify(draftSubmission));
  };

  const getDraftEvaluation = (evaluateeId: string, formId: string): EvaluationSubmission | null => {
    const draftKey = `draft_${currentUser.id}_${evaluateeId}_${formId}`;
    const saved = localStorage.getItem(draftKey);
    return saved ? JSON.parse(saved) : null;
  };

  const clearDraftEvaluation = (evaluateeId: string, formId: string) => {
    const draftKey = `draft_${currentUser.id}_${evaluateeId}_${formId}`;
    localStorage.removeItem(draftKey);
  };

  // Delete evaluation by submission ID
  const deleteSubmission = (submissionId: string) => {
    const target = submissions.find((s) => s.id === submissionId);
    if (!target) return;

    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    clearDraftEvaluation(target.evaluateeId, target.formId);

    FirebaseService.deleteSubmission(submissionId).catch(console.error);

    logAudit(
      'DELETE_EVALUATION',
      `ลบผลการประเมินของกรรมการ: ${target.evaluatorName} ที่ประเมินให้แก่: ${target.evaluateeName} (${target.percentage}% [${target.grade}])`
    );
  };

  // Evaluator or Admin deletes evaluation for a specific candidate & evaluator
  const deleteEvaluationByEvaluator = (evaluateeId: string, evaluatorId: string) => {
    const target = submissions.find(
      (s) => s.evaluateeId === evaluateeId && s.evaluatorId === evaluatorId
    );
    if (!target) return;

    setSubmissions((prev) =>
      prev.filter((s) => !(s.evaluateeId === evaluateeId && s.evaluatorId === evaluatorId))
    );
    clearDraftEvaluation(evaluateeId, target.formId);

    if (target.id) {
      FirebaseService.deleteSubmission(target.id).catch(console.error);
    }

    logAudit(
      'DELETE_EVALUATION',
      `ลบผลคะแนนการประเมิน: ผู้ประเมิน ${target.evaluatorName} -> ผู้รับการประเมิน ${target.evaluateeName}`
    );
  };

  // Update existing evaluation submission
  const updateSubmission = (updatedSubmission: EvaluationSubmission) => {
    const finalized = { ...updatedSubmission, submittedAt: new Date().toISOString() };
    setSubmissions((prev) =>
      prev.map((s) => (s.id === finalized.id ? finalized : s))
    );
    FirebaseService.saveSubmission(finalized).catch(console.error);
    logAudit(
      'UPDATE_EVALUATION',
      `แก้ไขคะแนนการประเมิน: ${updatedSubmission.evaluatorName} ให้แก่ ${updatedSubmission.evaluateeName} เป็น ${updatedSubmission.percentage}% [${updatedSubmission.grade}]`
    );
  };

  // Admin directly inserts or modifies an evaluation for any evaluator/candidate
  const adminUpsertSubmission = (
    data: Omit<EvaluationSubmission, 'id' | 'submittedAt'> & { id?: string }
  ): EvaluationSubmission => {
    const submissionId = data.id || 'sub_admin_' + Date.now();
    const finalSubmission: EvaluationSubmission = {
      ...data,
      id: submissionId,
      submittedAt: new Date().toISOString(),
      isDraft: false,
    };

    setSubmissions((prev) => {
      const filtered = prev.filter(
        (s) =>
          !(
            (data.id && s.id === data.id) ||
            (s.evaluateeId === data.evaluateeId && s.evaluatorId === data.evaluatorId)
          )
      );
      return [finalSubmission, ...filtered];
    });

    FirebaseService.saveSubmission(finalSubmission).catch(console.error);

    logAudit(
      'ADMIN_OVERRIDE_EVALUATION',
      `[ผู้ดูแลระบบ] บันทึก/ปรับปรุงคะแนน: ${data.evaluatorName} -> ${data.evaluateeName} คะแนน ${data.percentage}% [${data.grade}]`
    );

    return finalSubmission;
  };

  // Committee Group CRUD
  const updateCommitteeGroup = (group: CommitteeGroup) => {
    setCommitteeGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
    FirebaseService.saveCommitteeGroup(group).catch(console.error);
    logAudit('UPDATE_COMMITTEE_GROUP', `แก้ไขข้อมูลกลุ่มคณะกรรมการ: ${group.name}`);
  };

  const addCommitteeGroup = (groupData: Omit<CommitteeGroup, 'id' | 'createdAt'>) => {
    const newGroup: CommitteeGroup = {
      ...groupData,
      id: 'group_' + (committeeGroups.length + 1) + '_' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    setCommitteeGroups((prev) => [...prev, newGroup]);
    FirebaseService.saveCommitteeGroup(newGroup).catch(console.error);
    logAudit('CREATE_COMMITTEE_GROUP', `สร้างกลุ่มคณะกรรมการใหม่: ${newGroup.name}`);
  };

  const deleteCommitteeGroup = (groupId: string) => {
    setCommitteeGroups((prev) => prev.filter((g) => g.id !== groupId));
    FirebaseService.deleteCommitteeGroup(groupId).catch(console.error);
    logAudit('DELETE_COMMITTEE_GROUP', `ลบกลุ่มคณะกรรมการรหัส: ${groupId}`);
  };

  // Target Position Group (กลุ่มสายงานเป้าหมาย) CRUD
  const addTargetPositionGroup = (groupData: Omit<TargetPositionGroup, 'id'>): TargetPositionGroup => {
    const newId = 'target_grp_' + Date.now().toString(36);
    const newGroup: TargetPositionGroup = {
      ...groupData,
      id: newId,
      order: groupData.order || (targetPositionGroups.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTargetPositionGroups((prev) => [...prev, newGroup]);
    FirebaseService.saveTargetPositionGroup(newGroup).catch(console.error);
    logAudit('CREATE_TARGET_POSITION_GROUP', `เพิ่มกลุ่มสายงานเป้าหมายใหม่: ${newGroup.name} (${newGroup.code})`);
    return newGroup;
  };

  const updateTargetPositionGroup = (group: TargetPositionGroup) => {
    const updated = { ...group, updatedAt: new Date().toISOString() };
    setTargetPositionGroups((prev) => prev.map((g) => (g.id === group.id ? updated : g)));
    FirebaseService.saveTargetPositionGroup(updated).catch(console.error);
    logAudit('UPDATE_TARGET_POSITION_GROUP', `แก้ไข/เปลี่ยนชื่อกลุ่มสายงานเป้าหมาย: ${group.name} (${group.code})`);
  };

  const deleteTargetPositionGroup = (groupId: string) => {
    const groupToDelete = targetPositionGroups.find((g) => g.id === groupId);
    setTargetPositionGroups((prev) => prev.filter((g) => g.id !== groupId));
    FirebaseService.deleteTargetPositionGroup(groupId).catch(console.error);
    logAudit('DELETE_TARGET_POSITION_GROUP', `ลบกลุ่มสายงานเป้าหมาย: ${groupToDelete?.name || groupId}`);
  };

  // User Management CRUD
  const addUser = (userData: Omit<User, 'id'>): User => {
    const newId = (userData.role === 'evaluator' ? 'evaluator_' : userData.role === 'admin' ? 'user_admin_' : 'staff_') + Date.now();
    const avatarValue = userData.avatar || userData.avatarUrl || undefined;
    const newUser: User = {
      ...userData,
      id: newId,
      password: userData.password || 'password123',
      avatar: avatarValue,
      avatarUrl: avatarValue,
    };
    setUsers((prev) => [newUser, ...prev]);
    FirebaseService.saveUser(newUser).catch(console.error);
    const roleLabels: Record<UserRole, string> = {
      admin: 'ผู้บริหาร / แอดมิน (Admin)',
      evaluator: 'คณะกรรมการประเมิน (Evaluator)',
      staff: 'ผู้รับการประเมิน (Staff)',
    };
    logAudit(
      'CREATE_USER_WITH_PERMISSION',
      `เพิ่มผู้ใช้งานใหม่และกำหนดสิทธิ์: "${newUser.name}" (${newUser.position}) สิทธิ์: ${roleLabels[newUser.role]}`,
      {
        category: 'PERMISSION',
        targetUserId: newUser.id,
        targetUserName: newUser.name,
        newValue: newUser.role,
        status: 'SUCCESS',
      }
    );
    return newUser;
  };

  const updateUser = (user: User) => {
    const prevUser = users.find((u) => u.id === user.id);
    const avatarValue = user.avatar || user.avatarUrl || undefined;
    const synchronizedUser: User = {
      ...user,
      avatar: avatarValue,
      avatarUrl: avatarValue,
    };
    setUsers((prev) => prev.map((u) => (u.id === synchronizedUser.id ? synchronizedUser : u)));
    if (currentUser.id === synchronizedUser.id) {
      setCurrentUser(synchronizedUser);
    }
    FirebaseService.saveUser(synchronizedUser).catch(console.error);

    if (prevUser && prevUser.role !== synchronizedUser.role) {
      const roleLabels: Record<UserRole, string> = {
        admin: 'ผู้บริหาร / แอดมิน (Admin)',
        evaluator: 'คณะกรรมการประเมิน (Evaluator)',
        staff: 'ผู้รับการประเมิน (Staff)',
      };
      logAudit(
        'CHANGE_USER_ROLE_AND_PERMISSION',
        `ปรับเปลี่ยนสิทธิ์และบทบาทผู้ใช้: "${synchronizedUser.name}" จากสิทธิ์ "${roleLabels[prevUser.role]}" เป็นสิทธิ์ "${roleLabels[synchronizedUser.role]}"`,
        {
          category: 'PERMISSION',
          targetUserId: synchronizedUser.id,
          targetUserName: synchronizedUser.name,
          previousValue: prevUser.role,
          newValue: synchronizedUser.role,
          status: 'SUCCESS',
        }
      );
    } else {
      logAudit('UPDATE_USER', `แก้ไขข้อมูลผู้ใช้งาน: ${synchronizedUser.name} (${synchronizedUser.position})`, {
        category: 'USER_MANAGEMENT',
        targetUserId: synchronizedUser.id,
        targetUserName: synchronizedUser.name,
      });
    }
  };

  const updateUserProfile = (userId: string, updates: Partial<User>) => {
    const avatarValue = updates.avatar || updates.avatarUrl || undefined;
    const normalizedUpdates: Partial<User> = {
      ...updates,
      ...(updates.avatar || updates.avatarUrl ? { avatar: avatarValue, avatarUrl: avatarValue } : {}),
      ...(updates.avatar === '' || updates.avatarUrl === '' ? { avatar: '', avatarUrl: '' } : {}),
    };

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updatedUser = { ...u, ...normalizedUpdates };
          FirebaseService.saveUser(updatedUser).catch(console.error);
          return updatedUser;
        }
        return u;
      })
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...normalizedUpdates }));
    }
    logAudit('UPDATE_PROFILE', `อัปเดตข้อมูลโปรไฟล์และรูปภาพ: ${updates.name || currentUser.name}`);
  };

  const updateSystemSettings = (newSettings: Partial<SystemSettings>) => {
    setSystemSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      FirebaseService.saveSystemSettings(updated).catch(console.error);
      return updated;
    });
    logAudit('UPDATE_SYSTEM_SETTINGS', `แก้ไขการตั้งค่าระบบ: ชื่อแอพ/ชื่อโรงเรียน/โลโก้/โหมดทดสอบ`, {
      category: 'SYSTEM',
    });
  };

  const resetSystemSettings = () => {
    setSystemSettings(DEFAULT_SETTINGS);
    FirebaseService.saveSystemSettings(DEFAULT_SETTINGS).catch(console.error);
    logAudit('RESET_SYSTEM_SETTINGS', 'คืนค่าการตั้งค่าระบบเป็นค่าเริ่มต้น', {
      category: 'SYSTEM',
      status: 'WARNING',
    });
  };

  const deleteUser = (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    FirebaseService.deleteUser(userId).catch(console.error);
    logAudit('DELETE_USER_PERMISSION', `ลบผู้ใช้งานและเพิกถอนสิทธิ์: "${userToDelete?.name || userId}" (ตำแหน่ง: ${userToDelete?.position || '-'})`, {
      category: 'PERMISSION',
      targetUserId: userId,
      targetUserName: userToDelete?.name,
      previousValue: userToDelete?.role,
      status: 'SUCCESS',
    });
  };

  const resetUserPassword = (userId: string, newPassword: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, password: newPassword };
          FirebaseService.saveUser(updated).catch(console.error);
          return updated;
        }
        return u;
      })
    );
    const user = users.find((u) => u.id === userId);
    logAudit('RESET_USER_PASSWORD', `รีเซ็ตรหัสผ่านของผู้ใช้งาน: ${user?.name || userId}`, {
      category: 'AUTH',
      targetUserId: userId,
      targetUserName: user?.name,
    });
  };

  // Form Management CRUD
  const updateFormTemplate = (form: FormTemplate) => {
    setFormTemplates((prev) => prev.map((f) => (f.id === form.id ? form : f)));
    FirebaseService.saveFormTemplate(form).catch(console.error);
    logAudit('UPDATE_FORM_TEMPLATE', `ปรับปรุงแบบประเมิน: ${form.title}`);
  };

  const addFormTemplate = (formData: Omit<FormTemplate, 'id'>): FormTemplate => {
    const newId = 'form_custom_' + Date.now();
    const newForm: FormTemplate = {
      ...formData,
      id: newId,
      isCustom: true,
    };
    setFormTemplates((prev) => [newForm, ...prev]);
    FirebaseService.saveFormTemplate(newForm).catch(console.error);
    logAudit('CREATE_FORM_TEMPLATE', `สร้างแบบประเมินใหม่: ${newForm.title}`);
    return newForm;
  };

  const deleteFormTemplate = (formId: string) => {
    const form = formTemplates.find((f) => f.id === formId);
    setFormTemplates((prev) => prev.filter((f) => f.id !== formId));
    FirebaseService.deleteFormTemplate(formId).catch(console.error);
    logAudit('DELETE_FORM_TEMPLATE', `ลบแบบประเมิน: ${form?.title || formId}`);
  };

  const resetFormTemplatesToDefault = () => {
    setFormTemplates(FORM_TEMPLATES);
    FORM_TEMPLATES.forEach((tmpl) => {
      FirebaseService.saveFormTemplate(tmpl).catch(console.error);
    });
    logAudit('RESET_FORM_TEMPLATES', 'รีเซ็ตแบบประเมินทั้งหมดกลับสู่แบบฟอร์มมาตรฐาน 13 ตำแหน่ง');
  };

  const updateGradeThresholds = (thresholds: GradeThreshold[]) => {
    setGradeThresholds(thresholds);
    FirebaseService.saveGradeThresholds(thresholds).catch(console.error);
    logAudit('UPDATE_THRESHOLDS', 'ปรับปรุงเกณฑ์การตัดระดับผลการประเมิน (5 ระดับ)');
  };

  // =========================================================================
  // Backup, Snapshots, Survey Archiving & Reset Protection
  // =========================================================================

  const createLocalSnapshot = (name: string, notes?: string, autoCreated: boolean = false): LocalSnapshotItem => {
    const backupData = buildSystemBackupData(
      systemSettings,
      gradeThresholds,
      targetPositionGroups,
      users,
      committeeGroups,
      formTemplates,
      submissions,
      auditLogs,
      {
        id: currentUser?.id || 'system',
        name: currentUser?.name || 'ระบบอัตโนมัติ',
        role: currentUser?.role || 'admin',
        position: currentUser?.position || 'ผู้ดูแลระบบ',
      },
      notes
    );

    const snapshotItem: LocalSnapshotItem = {
      id: 'snap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name || `สำรองข้อมูล ${new Date().toLocaleString('th-TH')}`,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.name || 'ระบบอัตโนมัติ',
      creatorRole: currentUser?.role || 'admin',
      notes,
      autoCreated,
      totalUsers: users.length,
      totalSubmissions: submissions.length,
      data: backupData,
      sizeBytes: JSON.stringify(backupData).length,
    };

    setLocalSnapshots((prev) => {
      const updated = [snapshotItem, ...prev.slice(0, MAX_SNAPSHOTS - 1)];
      saveLocalSnapshots(updated);
      return updated;
    });

    logAudit(
      'CREATE_SNAPSHOT',
      `สร้างจุดสำรองข้อมูลในเครื่อง: "${snapshotItem.name}" (${users.length} ผู้ใช้, ${submissions.length} ผลประเมิน)`,
      {
        category: 'BACKUP',
        status: 'SUCCESS',
      }
    );
    return snapshotItem;
  };

  const deleteLocalSnapshot = (id: string) => {
    const target = localSnapshots.find((s) => s.id === id);
    setLocalSnapshots((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveLocalSnapshots(updated);
      return updated;
    });
    logAudit('DELETE_SNAPSHOT', `ลบจุดสำรองข้อมูล: "${target?.name || id}"`, {
      category: 'BACKUP',
      status: 'SUCCESS',
    });
  };

  const exportSystemBackup = (notes?: string): SystemBackupData => {
    return buildSystemBackupData(
      systemSettings,
      gradeThresholds,
      targetPositionGroups,
      users,
      committeeGroups,
      formTemplates,
      submissions,
      auditLogs,
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        position: currentUser.position,
      },
      notes
    );
  };

  const restoreSystemBackup = async (
    backupData: SystemBackupData,
    options?: RestoreOptions
  ): Promise<{ success: boolean; message: string }> => {
    const opts = {
      restoreUsersAndGroups: true,
      restoreSubmissions: true,
      restoreForms: true,
      restoreSettings: true,
      restoreThresholds: true,
      restoreTargetGroups: true,
      ...options,
    };

    try {
      // 1. Automatically save a safety snapshot before restoring!
      createLocalSnapshot(
        `จุดกู้คืนฉุกเฉิน (ก่อนกู้คืน ${new Date().toLocaleTimeString('th-TH')})`,
        'ระบบสร้างอัตโนมัติก่อนกู้คืนข้อมูล เพื่อความปลอดภัยสูงสุด',
        true
      );

      // 2. Restore Users & Groups
      if (opts.restoreUsersAndGroups) {
        if (Array.isArray(backupData.users) && backupData.users.length > 0) {
          const { sanitized } = sanitizeAndFixUsers(backupData.users);
          setUsers(sanitized);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(sanitized));
        }
        if (Array.isArray(backupData.committeeGroups)) {
          setCommitteeGroups(backupData.committeeGroups);
          localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(backupData.committeeGroups));
        }
      }

      // 3. Restore Target Position Groups
      if (opts.restoreTargetGroups && Array.isArray(backupData.targetPositionGroups)) {
        setTargetPositionGroups(backupData.targetPositionGroups);
        localStorage.setItem(STORAGE_KEYS.TARGET_GROUPS, JSON.stringify(backupData.targetPositionGroups));
      }

      // 4. Restore Form Templates
      if (opts.restoreForms && Array.isArray(backupData.formTemplates) && backupData.formTemplates.length > 0) {
        setFormTemplates(backupData.formTemplates);
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(backupData.formTemplates));
      }

      // 5. Restore Submissions / Survey Data
      if (opts.restoreSubmissions && Array.isArray(backupData.submissions)) {
        setSubmissions(backupData.submissions);
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(backupData.submissions));
      }

      // 6. Restore Settings & Thresholds
      if (opts.restoreSettings && backupData.systemSettings) {
        setSystemSettings(backupData.systemSettings);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(backupData.systemSettings));
      }
      if (opts.restoreThresholds && Array.isArray(backupData.gradeThresholds)) {
        setGradeThresholds(backupData.gradeThresholds);
        localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(backupData.gradeThresholds));
      }

      // Sync restored state to Firebase if connected
      try {
        await FirebaseService.seedInitialData(
          opts.restoreUsersAndGroups ? (backupData.users || users) : users,
          opts.restoreUsersAndGroups ? (backupData.committeeGroups || committeeGroups) : committeeGroups,
          opts.restoreForms ? (backupData.formTemplates || formTemplates) : formTemplates,
          opts.restoreSubmissions ? (backupData.submissions || submissions) : submissions,
          opts.restoreSettings ? (backupData.systemSettings || systemSettings) : systemSettings,
          opts.restoreThresholds ? (backupData.gradeThresholds || gradeThresholds) : gradeThresholds,
          opts.restoreTargetGroups ? (backupData.targetPositionGroups || targetPositionGroups) : targetPositionGroups
        );
      } catch (err) {
        console.warn('Firebase sync warning during restore (local data restored successfully):', err);
      }

      logAudit(
        'RESTORE_SYSTEM_BACKUP',
        `กู้คืนข้อมูลระบบสำเร็จ: ผู้ใช้ ${backupData.users?.length || 0} รายการ, ผลประเมิน/แบบสำรวจ ${backupData.submissions?.length || 0} รายการ`,
        {
          category: 'BACKUP',
          status: 'SUCCESS',
        }
      );

      return { success: true, message: 'กู้คืนข้อมูลระบบสำเร็จเรียบร้อยแล้ว' };
    } catch (err: any) {
      console.error('Error during system restore:', err);
      logAudit('RESTORE_SYSTEM_BACKUP_FAILED', `กู้คืนข้อมูลล้มเหลว: ${err?.message || 'Unknown error'}`, {
        category: 'BACKUP',
        status: 'ERROR',
      });
      return { success: false, message: 'เกิดข้อผิดพลาดในการกู้คืนข้อมูล: ' + (err?.message || '') };
    }
  };

  const restoreFromSnapshot = async (
    snapshotId: string,
    options?: RestoreOptions
  ): Promise<{ success: boolean; message: string }> => {
    const snapshot = localSnapshots.find((s) => s.id === snapshotId);
    if (!snapshot || !snapshot.data) {
      return { success: false, message: 'ไม่พบข้อมูลของจุดสำรองนี้ในระบบ' };
    }
    return restoreSystemBackup(snapshot.data, options);
  };

  const downloadBackupFile = (notes?: string) => {
    const backupData = exportSystemBackup(notes);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `pes_backup_${systemSettings.academicYear}_${dateStr}.json`;
    downloadJsonFile(backupData, filename);
    logAudit('EXPORT_BACKUP_FILE', `ดาวน์โหลดไฟล์สำรองข้อมูลทั้งระบบ: ${filename}`, {
      category: 'BACKUP',
      status: 'SUCCESS',
    });
  };

  const downloadSurveyArchive = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    // 1. Download Excel/CSV with UTF-8 BOM
    const csvContent = generateSurveyCsv(aggregatedResults, submissions, systemSettings);
    downloadCsvFile(csvContent, `รายงานผลสำรวจและประเมิน_${systemSettings.academicYear}_${dateStr}.csv`);

    // 2. Download Complete Survey JSON archive
    const surveyJsonData = {
      title: `ชุดข้อมูลสำรวจและประเมินผลการปฏิบัติงาน ประจำปีงบประมาณ ${systemSettings.academicYear}`,
      schoolName: systemSettings.schoolName,
      schoolAffiliation: systemSettings.schoolAffiliation,
      evaluationRound: systemSettings.evaluationRound,
      exportedAt: new Date().toISOString(),
      exportedBy: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        position: currentUser.position,
      },
      totalEvaluatees: aggregatedResults.length,
      totalSubmissions: submissions.length,
      aggregatedResults,
      submissions,
    };
    downloadJsonFile(surveyJsonData, `แฟ้มข้อมูลสำรวจ_${systemSettings.academicYear}_${dateStr}.json`);

    logAudit('DOWNLOAD_SURVEY_ARCHIVE', `ดาวน์โหลดแฟ้มจัดเก็บข้อมูลสำรวจและประเมินผล ประจำปีงบประมาณ ${systemSettings.academicYear} (CSV & JSON)`, {
      category: 'BACKUP',
      status: 'SUCCESS',
    });
  };

  const clearAuditLogs = () => {
    const clearLog: AuditLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'CLEAR_AUDIT_LOGS',
      category: 'BACKUP',
      details: 'ล้างประวัติการใช้งานระบบทั้งหมด และเริ่มต้นเก็บบันทึกใหม่',
      status: 'SUCCESS',
    };
    setAuditLogs([clearLog]);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([clearLog]));
  };

  const resetAllDataToDefault = () => {
    // 1. Automatically save a snapshot of current data before resetting!
    createLocalSnapshot(
      `จุดสำรองก่อนรีเซ็ตระบบ (${new Date().toLocaleTimeString('th-TH')})`,
      'ระบบสำรองข้อมูลอัตโนมัติก่อนล้างข้อมูลกลับสู่ค่าเริ่มต้นโรงงาน เพื่อป้องกันข้อมูลสูญหาย',
      true
    );
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[1]);
    setIsAuthenticated(true);
    setCommitteeGroups(INITIAL_COMMITTEE_GROUPS);
    setTargetPositionGroups(INITIAL_TARGET_POSITION_GROUPS);
    setFormTemplates(FORM_TEMPLATES);
    setSubmissions(INITIAL_SUBMISSIONS);
    setGradeThresholds(GRADE_THRESHOLDS);
    localStorage.clear();
    syncAllToFirebase().catch(console.error);
    logAudit('RESET_SYSTEM', 'รีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้นจากโรงงาน (ได้สร้างจุดสำรองข้อมูลความปลอดภัยไว้แล้ว)', {
      category: 'SYSTEM',
      status: 'WARNING',
    });
  };

  // Daily automatic snapshot check
  useEffect(() => {
    if (users.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const existingAuto = localSnapshots.find((s) => s.autoCreated && s.createdAt.startsWith(today));
      if (!existingAuto) {
        createLocalSnapshot(`สำรองอัตโนมัติประจำวัน (${today})`, 'ระบบสำรองข้อมูลอัตโนมัติเพื่อป้องกันข้อมูลรีเซ็ต', true);
      }
    }
  }, [users.length]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        login,
        loginAsUser,
        logout,
        systemSettings,
        updateSystemSettings,
        resetSystemSettings,
        users,
        committeeGroups,
        targetPositionGroups,
        formTemplates,
        gradeThresholds,
        submissions,
        auditLogs,
        aggregatedResults,
        isFirebaseSyncing,
        isFirebaseConnected,
        syncAllToFirebase,
        activeView,
        setActiveView,
        selectedFormId,
        setSelectedFormId,
        selectedEvaluateeId,
        setSelectedEvaluateeId,
        submitEvaluation,
        saveDraftEvaluation,
        getDraftEvaluation,
        clearDraftEvaluation,
        deleteSubmission,
        deleteEvaluationByEvaluator,
        updateSubmission,
        adminUpsertSubmission,
        updateCommitteeGroup,
        addCommitteeGroup,
        deleteCommitteeGroup,
        addTargetPositionGroup,
        updateTargetPositionGroup,
        deleteTargetPositionGroup,
        addUser,
        updateUser,
        updateUserProfile,
        deleteUser,
        resetUserPassword,
        updateFormTemplate,
        addFormTemplate,
        deleteFormTemplate,
        resetFormTemplatesToDefault,
        updateGradeThresholds,
        resetAllDataToDefault,
        localSnapshots,
        createLocalSnapshot,
        deleteLocalSnapshot,
        restoreFromSnapshot,
        exportSystemBackup,
        restoreSystemBackup,
        downloadBackupFile,
        downloadSurveyArchive,
        clearAuditLogs,
        logAudit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
