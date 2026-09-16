import {
  SystemBackupData,
  LocalSnapshotItem,
  SystemSettings,
  GradeThreshold,
  TargetPositionGroup,
  User,
  CommitteeGroup,
  FormTemplate,
  EvaluationSubmission,
  AuditLog,
  AggregatedResult,
} from '../types';

export const BACKUP_VERSION = 'PES-BACKUP-V3.2';
export const SNAPSHOT_STORAGE_KEY = 'pes_system_snapshots_v9';
export const MAX_SNAPSHOTS = 15;

/**
 * Downloads arbitrary data as a JSON file
 */
export const downloadJsonFile = (data: unknown, filename: string) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads a string as a CSV file with UTF-8 BOM for Thai language support in Microsoft Excel
 */
export const downloadCsvFile = (csvContent: string, filename: string) => {
  // \uFEFF is the UTF-8 Byte Order Mark (BOM) ensuring Excel displays Thai characters properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Constructs a full system backup data object
 */
export const buildSystemBackupData = (
  systemSettings: SystemSettings,
  gradeThresholds: GradeThreshold[],
  targetPositionGroups: TargetPositionGroup[],
  users: User[],
  committeeGroups: CommitteeGroup[],
  formTemplates: FormTemplate[],
  submissions: EvaluationSubmission[],
  auditLogs: AuditLog[],
  exportedBy: { id: string; name: string; role: string; position: string },
  notes?: string
): SystemBackupData => {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    exportedBy,
    systemSettings,
    gradeThresholds,
    targetPositionGroups,
    users,
    committeeGroups,
    formTemplates,
    submissions,
    auditLogs,
    stats: {
      totalUsers: users.length,
      totalEvaluators: users.filter((u) => u.role === 'evaluator').length,
      totalEvaluatees: users.filter((u) => u.role === 'staff').length,
      totalGroups: committeeGroups.length,
      totalForms: formTemplates.length,
      totalSubmissions: submissions.length,
      academicYear: systemSettings.academicYear,
      evaluationRound: systemSettings.evaluationRound,
    },
    notes: notes || 'สำรองข้อมูลความปลอดภัยทั้งระบบ',
  };
};

/**
 * Validates a parsed JSON backup object
 */
export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats?: {
    usersCount: number;
    groupsCount: number;
    formsCount: number;
    submissionsCount: number;
    logsCount: number;
    exportedAt: string;
    exportedBy?: string;
    version?: string;
  };
}

export const validateBackupData = (data: any): BackupValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['ไฟล์ข้อมูลไม่ถูกต้อง หรือไม่ใช่รูปแบบ JSON ที่ถูกต้อง'], warnings };
  }

  if (!Array.isArray(data.users)) {
    errors.push('ไม่พบโครงสร้างข้อมูลผู้ใช้งาน (users)');
  }
  if (!Array.isArray(data.committeeGroups)) {
    warnings.push('ไม่พบข้อมูลกลุ่มคณะกรรมการ (committeeGroups)');
  }
  if (!Array.isArray(data.formTemplates)) {
    warnings.push('ไม่พบข้อมูลแบบประเมิน (formTemplates)');
  }
  if (!Array.isArray(data.submissions)) {
    warnings.push('ไม่พบข้อมูลผลการประเมิน (submissions)');
  }
  if (!data.systemSettings || typeof data.systemSettings !== 'object') {
    warnings.push('ไม่พบข้อมูลการตั้งค่าระบบ (systemSettings)');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    stats: isValid
      ? {
          usersCount: data.users?.length || 0,
          groupsCount: data.committeeGroups?.length || 0,
          formsCount: data.formTemplates?.length || 0,
          submissionsCount: data.submissions?.length || 0,
          logsCount: data.auditLogs?.length || 0,
          exportedAt: data.exportedAt || new Date().toISOString(),
          exportedBy: data.exportedBy?.name || 'ไม่ระบุ',
          version: data.version || 'ไม่ระบุเวอร์ชัน',
        }
      : undefined,
  };
};

/**
 * Generates an Excel/CSV file of Survey and Evaluation results
 */
export const generateSurveyCsv = (
  results: AggregatedResult[],
  submissions: EvaluationSubmission[],
  systemSettings: SystemSettings
): string => {
  const headers = [
    'ลำดับ',
    'รหัสผู้รับการประเมิน',
    'ชื่อ-นามสกุล',
    'ตำแหน่ง',
    'ฝ่าย/กลุ่มงาน',
    'กลุ่มชุดกรรมการ',
    'ชื่อแบบประเมิน',
    'จำนวนกรรมการที่ประเมิน (คน)',
    'สถานะการประเมิน',
    'คะแนนเฉลี่ย',
    'คะแนนเต็ม',
    'ร้อยละ (%)',
    'ระดับผลการประเมิน',
    'มติการจ้างต่อ',
    'เหตุผลกรณีงดจ้างต่อ',
    'วันลาป่วย(วัน)',
    'วันลากิจ(วัน)',
    'วันขาดราชการ(วัน)',
    'มาสาย(ครั้ง)',
    'ผลงานสำคัญที่ได้รับมอบหมาย',
    'ความสามารถ/ลักษณะเด่น',
    'ข้อควรปรับปรุง/พัฒนา',
    'วันที่อัปเดตล่าสุด',
  ];

  const escapeCsv = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: string[][] = results.map((item, index) => {
    // Collect leave stats from submissions or user profile
    const latestSub = item.submissions[0];
    const leave = latestSub?.leaveStats || item.evaluatee.leaveStats;
    const recommendation = latestSub?.recommendation;

    // Collect comments
    const assignedWork = item.submissions
      .map((s) => s.comments?.assignedWorkAndSuccess)
      .filter(Boolean)
      .join(' | ') || item.submissions.map((s) => s.comments?.strengths).filter(Boolean).join(' | ');

    const distinctive = item.submissions
      .map((s) => s.comments?.distinctiveCapabilities)
      .filter(Boolean)
      .join(' | ') || item.submissions.map((s) => s.comments?.general).filter(Boolean).join(' | ');

    const improvements = item.submissions
      .map((s) => s.comments?.improvementsAndTraining)
      .filter(Boolean)
      .join(' | ') || item.submissions.map((s) => s.comments?.improvements).filter(Boolean).join(' | ');

    return [
      String(index + 1),
      item.evaluateeId,
      item.evaluatee.name,
      item.evaluatee.position,
      item.evaluatee.department,
      item.groupName,
      item.formTitle,
      `${item.submittedCommitteeCount}/${item.totalCommitteeCount}`,
      item.isFullyEvaluated ? 'ประเมินครบถ้วน' : 'อยู่ระหว่างประเมิน',
      item.meanScore.toFixed(2),
      String(item.maxScore),
      item.meanPercentage.toFixed(2),
      item.finalGrade,
      recommendation?.decision === 'terminate' ? 'ยุติการจ้าง' : 'เห็นควรจ้างต่อ',
      recommendation?.terminationReason || '-',
      String(leave?.sick?.days || 0),
      String(leave?.personal?.days || 0),
      String(leave?.absent?.days || 0),
      String(leave?.late?.times || 0),
      assignedWork || '-',
      distinctive || '-',
      improvements || '-',
      new Date(item.lastUpdated).toLocaleDateString('th-TH'),
    ];
  });

  const metaRows = [
    [`รายงานผลการสำรวจและประเมินผลการปฏิบัติงาน`],
    [`สถานศึกษา: ${systemSettings.schoolName} (${systemSettings.schoolAffiliation})`],
    [`รอบการประเมิน: ${systemSettings.evaluationRound} ประจำปีงบประมาณ ${systemSettings.academicYear}`],
    [`วันที่ส่งออกข้อมูล: ${new Date().toLocaleString('th-TH')}`],
    [], // empty line
  ];

  const metaContent = metaRows.map((r) => r.map(escapeCsv).join(',')).join('\n');
  const tableContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');

  return metaContent + '\n' + tableContent;
};

/**
 * Generates an Audit Log CSV
 */
export const generateAuditLogCsv = (logs: AuditLog[]): string => {
  const headers = [
    'ลำดับ',
    'รหัสบันทึก',
    'วัน-เวลา (ISO)',
    'วัน-เวลา (ไทย)',
    'หมวดหมู่',
    'รหัสการกระทำ (Action)',
    'ผู้กระทำ (User)',
    'บทบาท (Role)',
    'รายละเอียดการกระทำ',
    'ผู้ใช้เป้าหมาย (Target)',
    'ค่าเดิม (Previous)',
    'ค่าใหม่ (New)',
    'สถานะ',
  ];

  const escapeCsv = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = logs.map((log, index) => [
    String(index + 1),
    log.id,
    log.timestamp,
    new Date(log.timestamp).toLocaleString('th-TH'),
    log.category || 'GENERAL',
    log.action,
    log.userName,
    log.userRole || '-',
    log.details,
    log.targetUserName || log.targetUserId || '-',
    log.previousValue || '-',
    log.newValue || '-',
    log.status || 'SUCCESS',
  ]);

  return [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
};

/**
 * Storage Helpers for Snapshots
 */
export const loadLocalSnapshots = (): LocalSnapshotItem[] => {
  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load local snapshots:', e);
    return [];
  }
};

export const saveLocalSnapshots = (snapshots: LocalSnapshotItem[]) => {
  try {
    // Keep max snapshots to avoid local storage quota limits
    const trimmed = snapshots.slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save local snapshots to localStorage:', e);
  }
};
