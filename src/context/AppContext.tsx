import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  CommitteeGroup,
  FormTemplate,
  GradeThreshold,
  EvaluationSubmission,
  AggregatedResult,
  AuditLog,
  SystemSettings,
  TargetPositionGroup,
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
  | 'settings';

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
const OFFICIAL_AVATARS: Record<string, string> = {
  user_admin_1: '/avatars/user_admin_1.jpg',
  evaluator_director: '/avatars/evaluator_director.jpg',
  evaluator_1: '/avatars/evaluator_1.jpg',
  evaluator_2: '/avatars/evaluator_2.jpg',
  evaluator_3: '/avatars/evaluator_3.jpg',
  evaluator_4: '/avatars/evaluator_4.jpg',
  evaluator_5: '/avatars/evaluator_5.jpg',
  evaluator_6: '/avatars/evaluator_6.jpg',
};

export function sanitizeAndFixUsers(rawUsers: User[]): { sanitized: User[]; hasChanged: boolean } {
  let hasChanged = false;
  const userMap = new Map<string, User>();

  for (const raw of rawUsers) {
    let u = { ...raw };

    // 1. Ensure evaluator_1 (Orawan) preserves user edits, only setting role and default fields if completely missing
    if (u.id === 'evaluator_1' || u.username === 'orawan' || u.employeeCode === 'EV-101') {
      if (u.id !== 'evaluator_1') {
        u.id = 'evaluator_1';
        hasChanged = true;
      }
      if (u.role !== 'evaluator') {
        u.role = 'evaluator';
        hasChanged = true;
      }
      if (!u.name) {
        u.name = 'นางสาวอรวรรณ พงษ์ศิริ';
        hasChanged = true;
      }
      if (!u.username) {
        u.username = 'orawan';
        hasChanged = true;
      }
      if (!u.position) {
        u.position = 'รองผู้อำนวยการสถานศึกษา (ประธานกรรมการ ชุดที่ 1)';
        hasChanged = true;
      }
      if (!u.department) {
        u.department = 'ฝ่ายบริหารงานวิชาการและบุคคล';
        hasChanged = true;
      }
      if (!u.groupId) {
        u.groupId = 'group_1';
        hasChanged = true;
      }
      if (!u.employeeCode) {
        u.employeeCode = 'EV-101';
        hasChanged = true;
      }
      if (!u.email) u.email = 'orawan.p@chainat-special.ac.th';
      if (!u.phone) u.phone = '081-987-6543';
    }

    // 2. Ensure user_admin_1 (Rannaphat) preserves user edits, only setting role and default fields if completely missing
    else if (u.id === 'user_admin_1' || u.username === 'rannaphat' || u.employeeCode === 'EV-302') {
      if (u.id !== 'user_admin_1') {
        u.id = 'user_admin_1';
        hasChanged = true;
      }
      if (u.role !== 'admin') {
        u.role = 'admin';
        hasChanged = true;
      }
      if (!u.name) {
        u.name = 'นางสาวรัณย์ณภัทร มากุญชร';
        hasChanged = true;
      }
      if (!u.username) {
        u.username = 'rannaphat';
        hasChanged = true;
      }
      if (!u.position) {
        u.position = 'ครูชำนาญการ (ผู้ดูแลระบบ / Admin & กรรมการลงทะเบียนและรวบรวมคะแนน)';
        hasChanged = true;
      }
      if (!u.department) {
        u.department = 'กลุ่มงานทะเบียนและประเมินผล';
        hasChanged = true;
      }
      if (!u.employeeCode) {
        u.employeeCode = 'EV-302';
        hasChanged = true;
      }
      if (!u.email) u.email = 'rannaphat.m@chainat-special.ac.th';
      if (!u.phone) u.phone = '087-321-0987';
    }

    // 3. Set default official photo ONLY if user has NEVER set an avatar (undefined, not empty string)
    if (OFFICIAL_AVATARS[u.id] && u.avatarUrl === undefined && u.avatar === undefined) {
      u.avatarUrl = OFFICIAL_AVATARS[u.id];
      u.avatar = OFFICIAL_AVATARS[u.id];
      hasChanged = true;
    }

    // 4. Normalize avatar and avatarUrl so both match
    if (u.avatar !== undefined && u.avatarUrl === undefined) {
      u.avatarUrl = u.avatar;
      hasChanged = true;
    }
    if (u.avatarUrl !== undefined && u.avatar === undefined) {
      u.avatar = u.avatarUrl;
      hasChanged = true;
    }

    userMap.set(u.id, u);
  }

  // Ensure evaluator_1 and user_admin_1 exist in map if completely absent
  if (!userMap.has('evaluator_1')) {
    const defaultEv = INITIAL_USERS.find((u) => u.id === 'evaluator_1');
    if (defaultEv) userMap.set('evaluator_1', defaultEv);
    hasChanged = true;
  }
  if (!userMap.has('user_admin_1')) {
    const defaultAdmin = INITIAL_USERS.find((u) => u.id === 'user_admin_1');
    if (defaultAdmin) userMap.set('user_admin_1', defaultAdmin);
    hasChanged = true;
  }

  const sanitized = Array.from(userMap.values());
  return { sanitized, hasChanged };
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
};

// Multi-tab / multi-window instant real-time synchronization
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('app_performance_realtime_sync')
  : null;

function broadcastSync(type: string, payload: any) {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    }
  } catch (e) {
    // Ignore channel errors
  }
}

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
            action: 'INITIALIZE_SYSTEM',
            details: 'คำสั่งโรงเรียนศึกษาพิเศษชัยนาท ที่ 251/2569 แต่งตั้งคณะกรรมการประเมินผลการปฏิบัติงาน ปีงบประมาณ 2569 ตำแหน่ง ครูผู้ช่วย (ลูกจ้างชั่วคราว)',
          },
        ];
  });

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

    // Cross-tab real-time sync event listener
    const handleChannelMessage = (event: MessageEvent) => {
      try {
        const { type, payload } = event.data || {};
        if (type === 'USERS_UPDATE' && Array.isArray(payload)) {
          setUsers(payload);
        } else if (type === 'USER_SINGLE_UPDATE' && payload?.id) {
          setUsers((prev) => prev.map((u) => (u.id === payload.id ? payload : u)));
          if (currentUser.id === payload.id) {
            setCurrentUser(payload);
          }
        } else if (type === 'SUBMISSIONS_UPDATE' && Array.isArray(payload)) {
          setSubmissions(payload);
        } else if (type === 'SUBMISSION_SINGLE_UPDATE' && payload?.id) {
          setSubmissions((prev) => {
            const filtered = prev.filter((s) => s.id !== payload.id);
            return [payload, ...filtered];
          });
        } else if (type === 'SETTINGS_UPDATE' && payload) {
          setSystemSettings((prev) => ({ ...prev, ...payload }));
        } else if (type === 'GROUPS_UPDATE' && Array.isArray(payload)) {
          setCommitteeGroups(payload);
        } else if (type === 'TARGET_GROUPS_UPDATE' && Array.isArray(payload)) {
          setTargetPositionGroups(payload);
        } else if (type === 'TEMPLATES_UPDATE' && Array.isArray(payload)) {
          setFormTemplates(payload);
        }
      } catch (err) {
        console.error('Channel message handling error:', err);
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener('message', handleChannelMessage);
    }

    const setupFirebaseSync = async () => {
      try {
        setIsFirebaseSyncing(true);

        // Verify remote users and settings count in Firestore
        const remoteUsers = await FirebaseService.getUsers();
        const remoteSettings = await FirebaseService.getSystemSettings();

        // Seed initial data ONLY if Firestore is completely empty
        if ((!remoteUsers || remoteUsers.length === 0) && !remoteSettings) {
          console.log('Seeding initial data to empty Firebase Firestore...');
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
            setCurrentUser((prevCurr) => {
              const matched = sanitized.find((u) => u.id === prevCurr.id);
              return matched ? { ...prevCurr, ...matched } : prevCurr;
            });
          }
        });

        unsubGroups = FirebaseService.listenCommitteeGroups((remoteGroups) => {
          if (remoteGroups && remoteGroups.length > 0) {
            setCommitteeGroups(remoteGroups);
          }
        });

        unsubTargetGroups = FirebaseService.listenTargetPositionGroups((remoteTargetGroups) => {
          if (remoteTargetGroups && remoteTargetGroups.length > 0) {
            setTargetPositionGroups(remoteTargetGroups);
          }
        });

        unsubTemplates = FirebaseService.listenFormTemplates((remoteTemplates) => {
          if (remoteTemplates && remoteTemplates.length > 0) {
            setFormTemplates(remoteTemplates);
          }
        });

        unsubSubs = FirebaseService.listenSubmissions((remoteSubs) => {
          if (remoteSubs) {
            // Deduplicate remote submissions in memory by evaluateeId and evaluatorId, keeping latest submittedAt
            const subMap = new Map<string, EvaluationSubmission>();
            const sorted = [...remoteSubs].sort(
              (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
            );
            sorted.forEach((sub) => {
              const key = `${sub.evaluateeId}_${sub.evaluatorId}`;
              subMap.set(key, sub);
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
      if (syncChannel) {
        syncChannel.removeEventListener('message', handleChannelMessage);
      }
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

  // Logger helper
  const logAudit = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'guest',
      userName: currentUser?.name || 'ผู้ใช้งาน',
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);
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
      logAudit('FIREBASE_SYNC_ALL', 'ซิงค์ข้อมูลทั้งหมดขึ้นฐานข้อมูล Firebase สำเร็จ');
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
      return { success: false, message: 'ไม่พบบัญชีผู้ใช้งานนี้ในระบบ' };
    }

    if (foundUser.password && foundUser.password !== password) {
      return { success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' };
    }

    setCurrentUser(foundUser);
    setIsAuthenticated(true);
    logAudit('USER_LOGIN', `เข้าสู่ระบบสำเร็จในฐานะ ${foundUser.name} (${foundUser.position})`);

    if (foundUser.role === 'staff') {
      setActiveView('my_evaluation');
      setSelectedEvaluateeId(foundUser.id);
    } else {
      setActiveView('dashboard');
    }

    return { success: true };
  };

  const loginAsUser = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    logAudit('DEMO_SWITCH_USER', `สลับตัวตนทดสอบ (Demo) เป็น ${user.name} (${user.position})`);

    if (user.role === 'staff') {
      setActiveView('my_evaluation');
      setSelectedEvaluateeId(user.id);
    } else {
      setActiveView('dashboard');
    }
  };

  const logout = () => {
    logAudit('USER_LOGOUT', `ออกจากระบบ: ${currentUser.name}`);
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
      const next = [newSubmission, ...filtered];
      broadcastSync('SUBMISSIONS_UPDATE', next);
      return next;
    });

    clearDraftEvaluation(data.evaluateeId, data.formId);

    // Save to Firebase (triggers real-time broadcast to all connected devices)
    FirebaseService.saveSubmission(newSubmission).catch(console.error);

    logAudit(
      'SUBMIT_EVALUATION',
      `${existing ? 'แก้ไขผลการประเมิน' : 'ส่งผลการประเมิน'}ให้แก่ ${data.evaluateeName} (${data.evaluateePosition}) ได้คะแนน ${data.percentage}% [${data.grade}]`
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

    setSubmissions((prev) => {
      const next = prev.filter((s) => s.id !== submissionId);
      broadcastSync('SUBMISSIONS_UPDATE', next);
      return next;
    });
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

    setSubmissions((prev) => {
      const next = prev.filter((s) => !(s.evaluateeId === evaluateeId && s.evaluatorId === evaluatorId));
      broadcastSync('SUBMISSIONS_UPDATE', next);
      return next;
    });
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
    setSubmissions((prev) => {
      const next = prev.map((s) => (s.id === finalized.id ? finalized : s));
      broadcastSync('SUBMISSIONS_UPDATE', next);
      return next;
    });
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
      const next = [finalSubmission, ...filtered];
      broadcastSync('SUBMISSIONS_UPDATE', next);
      return next;
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
    setCommitteeGroups((prev) => {
      const next = prev.map((g) => (g.id === group.id ? group : g));
      broadcastSync('GROUPS_UPDATE', next);
      return next;
    });
    FirebaseService.saveCommitteeGroup(group).catch(console.error);
    logAudit('UPDATE_COMMITTEE_GROUP', `แก้ไขข้อมูลกลุ่มคณะกรรมการ: ${group.name}`);
  };

  const addCommitteeGroup = (groupData: Omit<CommitteeGroup, 'id' | 'createdAt'>) => {
    const newGroup: CommitteeGroup = {
      ...groupData,
      id: 'group_' + (committeeGroups.length + 1) + '_' + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    setCommitteeGroups((prev) => {
      const next = [...prev, newGroup];
      broadcastSync('GROUPS_UPDATE', next);
      return next;
    });
    FirebaseService.saveCommitteeGroup(newGroup).catch(console.error);
    logAudit('CREATE_COMMITTEE_GROUP', `สร้างกลุ่มคณะกรรมการใหม่: ${newGroup.name}`);
  };

  const deleteCommitteeGroup = (groupId: string) => {
    setCommitteeGroups((prev) => {
      const next = prev.filter((g) => g.id !== groupId);
      broadcastSync('GROUPS_UPDATE', next);
      return next;
    });
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
    setTargetPositionGroups((prev) => {
      const next = [...prev, newGroup];
      broadcastSync('TARGET_GROUPS_UPDATE', next);
      return next;
    });
    FirebaseService.saveTargetPositionGroup(newGroup).catch(console.error);
    logAudit('CREATE_TARGET_POSITION_GROUP', `เพิ่มกลุ่มสายงานเป้าหมายใหม่: ${newGroup.name} (${newGroup.code})`);
    return newGroup;
  };

  const updateTargetPositionGroup = (group: TargetPositionGroup) => {
    const updated = { ...group, updatedAt: new Date().toISOString() };
    setTargetPositionGroups((prev) => {
      const next = prev.map((g) => (g.id === group.id ? updated : g));
      broadcastSync('TARGET_GROUPS_UPDATE', next);
      return next;
    });
    FirebaseService.saveTargetPositionGroup(updated).catch(console.error);
    logAudit('UPDATE_TARGET_POSITION_GROUP', `แก้ไข/เปลี่ยนชื่อกลุ่มสายงานเป้าหมาย: ${group.name} (${group.code})`);
  };

  const deleteTargetPositionGroup = (groupId: string) => {
    const groupToDelete = targetPositionGroups.find((g) => g.id === groupId);
    setTargetPositionGroups((prev) => {
      const next = prev.filter((g) => g.id !== groupId);
      broadcastSync('TARGET_GROUPS_UPDATE', next);
      return next;
    });
    FirebaseService.deleteTargetPositionGroup(groupId).catch(console.error);
    logAudit('DELETE_TARGET_POSITION_GROUP', `ลบกลุ่มสายงานเป้าหมาย: ${groupToDelete?.name || groupId}`);
  };

  // User Management CRUD
  const addUser = (userData: Omit<User, 'id'>): User => {
    const newId = (userData.role === 'evaluator' ? 'evaluator_' : userData.role === 'admin' ? 'user_admin_' : 'staff_') + Date.now();
    const avatarValue = userData.avatar !== undefined ? userData.avatar : userData.avatarUrl;
    const newUser: User = {
      ...userData,
      id: newId,
      password: userData.password || 'password123',
      avatar: avatarValue,
      avatarUrl: avatarValue,
    };
    setUsers((prev) => {
      const next = [newUser, ...prev];
      broadcastSync('USERS_UPDATE', next);
      return next;
    });
    FirebaseService.saveUser(newUser).catch(console.error);
    logAudit('CREATE_USER', `เพิ่มผู้ใช้งานใหม่: ${newUser.name} (${newUser.position}) [${newUser.role}]`);
    return newUser;
  };

  const updateUser = (user: User) => {
    const avatarValue = user.avatar !== undefined ? user.avatar : user.avatarUrl;
    const synchronizedUser: User = {
      ...user,
      avatar: avatarValue,
      avatarUrl: avatarValue,
    };

    setUsers((prev) => {
      const next = prev.map((u) => (u.id === synchronizedUser.id ? synchronizedUser : u));
      broadcastSync('USERS_UPDATE', next);
      return next;
    });

    if (currentUser.id === synchronizedUser.id) {
      setCurrentUser(synchronizedUser);
    }

    // Synchronously update evaluatee & evaluator references in all submissions so scores, candidate cards, and report headers update immediately
    setSubmissions((prev) => {
      let modified = false;
      const nextSubs = prev.map((s) => {
        let changed = false;
        const updated = { ...s };
        if (s.evaluateeId === synchronizedUser.id) {
          if (updated.evaluateeName !== synchronizedUser.name) {
            updated.evaluateeName = synchronizedUser.name;
            changed = true;
          }
          if (updated.evaluateePosition !== synchronizedUser.position) {
            updated.evaluateePosition = synchronizedUser.position;
            changed = true;
          }
          if (updated.evaluateeDepartment !== synchronizedUser.department) {
            updated.evaluateeDepartment = synchronizedUser.department;
            changed = true;
          }
          if (synchronizedUser.avatar !== undefined && updated.evaluateeAvatar !== synchronizedUser.avatar) {
            updated.evaluateeAvatar = synchronizedUser.avatar;
            changed = true;
          }
        }
        if (s.evaluatorId === synchronizedUser.id) {
          if (updated.evaluatorName !== synchronizedUser.name) {
            updated.evaluatorName = synchronizedUser.name;
            changed = true;
          }
          if (updated.evaluatorPosition !== synchronizedUser.position) {
            updated.evaluatorPosition = synchronizedUser.position;
            changed = true;
          }
        }
        if (changed) {
          modified = true;
          FirebaseService.saveSubmission(updated).catch(() => {});
          return updated;
        }
        return s;
      });
      if (modified) {
        broadcastSync('SUBMISSIONS_UPDATE', nextSubs);
      }
      return nextSubs;
    });

    FirebaseService.saveUser(synchronizedUser).catch(console.error);
    logAudit('UPDATE_USER', `แก้ไขข้อมูลผู้ใช้งาน: ${synchronizedUser.name} (${synchronizedUser.position})`);
  };

  const updateUserProfile = (userId: string, updates: Partial<User>) => {
    const avatarValue = updates.avatar !== undefined ? updates.avatar : updates.avatarUrl;
    const normalizedUpdates: Partial<User> = {
      ...updates,
      ...(avatarValue !== undefined ? { avatar: avatarValue, avatarUrl: avatarValue } : {}),
    };

    let updatedUserObj: User | null = null;
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === userId) {
          const updatedUser = { ...u, ...normalizedUpdates };
          updatedUserObj = updatedUser;
          FirebaseService.saveUser(updatedUser).catch(console.error);
          return updatedUser;
        }
        return u;
      });
      broadcastSync('USERS_UPDATE', next);
      return next;
    });

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, ...normalizedUpdates }));
    }

    // Synchronously update submissions for real-time consistency
    setSubmissions((prev) => {
      let modified = false;
      const nextSubs = prev.map((s) => {
        let changed = false;
        const updated = { ...s };
        if (s.evaluateeId === userId) {
          if (updates.name && updated.evaluateeName !== updates.name) {
            updated.evaluateeName = updates.name;
            changed = true;
          }
          if (updates.position && updated.evaluateePosition !== updates.position) {
            updated.evaluateePosition = updates.position;
            changed = true;
          }
          if (updates.department && updated.evaluateeDepartment !== updates.department) {
            updated.evaluateeDepartment = updates.department;
            changed = true;
          }
          if (avatarValue !== undefined && updated.evaluateeAvatar !== avatarValue) {
            updated.evaluateeAvatar = avatarValue;
            changed = true;
          }
        }
        if (s.evaluatorId === userId) {
          if (updates.name && updated.evaluatorName !== updates.name) {
            updated.evaluatorName = updates.name;
            changed = true;
          }
          if (updates.position && updated.evaluatorPosition !== updates.position) {
            updated.evaluatorPosition = updates.position;
            changed = true;
          }
        }
        if (changed) {
          modified = true;
          FirebaseService.saveSubmission(updated).catch(() => {});
          return updated;
        }
        return s;
      });
      if (modified) {
        broadcastSync('SUBMISSIONS_UPDATE', nextSubs);
      }
      return nextSubs;
    });

    logAudit('UPDATE_PROFILE', `อัปเดตข้อมูลโปรไฟล์และรูปภาพ: ${updates.name || currentUser.name}`);
  };

  const updateSystemSettings = (newSettings: Partial<SystemSettings>) => {
    setSystemSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      broadcastSync('SETTINGS_UPDATE', updated);
      FirebaseService.saveSystemSettings(updated).catch(console.error);
      return updated;
    });
    logAudit('UPDATE_SYSTEM_SETTINGS', `แก้ไขการตั้งค่าระบบ: ชื่อแอพ/ชื่อโรงเรียน/โลโก้/โหมดทดสอบ`);
  };

  const resetSystemSettings = () => {
    setSystemSettings(DEFAULT_SETTINGS);
    broadcastSync('SETTINGS_UPDATE', DEFAULT_SETTINGS);
    FirebaseService.saveSystemSettings(DEFAULT_SETTINGS).catch(console.error);
    logAudit('RESET_SYSTEM_SETTINGS', 'คืนค่าการตั้งค่าระบบเป็นค่าเริ่มต้น');
  };

  const deleteUser = (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== userId);
      broadcastSync('USERS_UPDATE', next);
      return next;
    });
    FirebaseService.deleteUser(userId).catch(console.error);
    logAudit('DELETE_USER', `ลบผู้ใช้งาน: ${userToDelete?.name || userId}`);
  };

  const resetUserPassword = (userId: string, newPassword: string) => {
    setUsers((prev) => {
      const next = prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, password: newPassword };
          FirebaseService.saveUser(updated).catch(console.error);
          return updated;
        }
        return u;
      });
      broadcastSync('USERS_UPDATE', next);
      return next;
    });
    const user = users.find((u) => u.id === userId);
    logAudit('RESET_USER_PASSWORD', `รีเซ็ตรหัสผ่านของผู้ใช้งาน: ${user?.name || userId}`);
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

  const resetAllDataToDefault = () => {
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
    logAudit('RESET_SYSTEM', 'รีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้นจากโรงงาน');
  };

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
