/**
 * Performance Evaluation System Data Types
 */

export type UserRole = 'admin' | 'evaluator' | 'staff';

export type PositionGroup = string; // e.g. 'teacher_assistant' | 'support_staff' or custom ID

export interface TargetPositionGroup {
  id: string; // e.g. 'teacher_assistant', 'support_staff', 'custom_group_1'
  name: string; // e.g. "กลุ่มที่ 1: ลูกจ้างชั่วคราว ตำแหน่งครูผู้ช่วย"
  code: string; // e.g. "G1", "ครูผู้ช่วย", "สายสนับสนุน"
  description: string; // คำอธิบายกลุ่มสายงานเป้าหมาย
  color?: string; // e.g. "blue", "emerald", "purple", "amber", "rose", "cyan", "indigo"
  order?: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  username?: string; // Login username
  password?: string; // Login password (hashed/plain for demo)
  position: string; // e.g. "ประธานกรรมการ", "กรรมการและเลขานุการ", "ผู้อำนวยการสถานศึกษา"
  department: string; // e.g. "กลุ่มบริหารงานบุคคล", "กลุ่มงานวิชาการ", "กลุ่มบริหารทั่วไป"
  role: UserRole;
  positionGroup?: PositionGroup; // กลุ่มที่ 1: teacher_assistant, กลุ่มที่ 2: support_staff
  email: string;
  avatar?: string; // Uploaded profile picture (base64 or URL)
  avatarUrl?: string;
  groupId?: string; // ID of assigned committee group
  phone?: string;
  employeeCode?: string; // รหัสพนักงาน
  formTemplateId?: string; // รหัสแบบฟอร์มการประเมินที่กำหนดเฉพาะบุคคล
  leaveStats?: LeaveStats; // สถิติการมาทำงานและการลาที่แอดมินบันทึกไว้ล่วงหน้า
}

export interface CommitteeGroup {
  id: string;
  name: string; // e.g. "คณะกรรมการชุดที่ 1 (กลุ่มสายวิชาการ/ครูผู้ช่วย)"
  targetPositionGroup: PositionGroup;
  description: string;
  evaluatorIds: string[]; // List of User IDs in this committee
  assignedEvaluateeIds: string[]; // List of evaluatee User IDs assigned to this committee
  createdAt: string;
}

export interface RubricIndicator {
  id: string;
  title: string;
  description: string;
  weight: number; // Max points per indicator, usually 5, 10, 15
}

export interface RubricCategory {
  id: string;
  name: string; // e.g. "ตอนที่ 1: ผลสัมฤทธิ์ของงานและภาระหน้าที่", "ตอนที่ 2: วินัย คุณธรรม จริยธรรม"
  weightPercentage: number; // e.g. 70% and 30%
  indicators: RubricIndicator[];
}

export interface FormTemplate {
  id: string;
  code: string;
  group: PositionGroup;
  title: string; // e.g. "แบบประเมินผลการปฏิบัติงานลูกจ้างชั่วคราว ตำแหน่งครูผู้ช่วย"
  positionTitle: string; // e.g. "ครูผู้ช่วย", "พี่เลี้ยงเด็กพิการ", "ภารโรง"
  description: string;
  categories: RubricCategory[];
  totalMaxScore: number;
  isCustom?: boolean;
}

export type GradeLevel =
  | 'ระดับดีเด่น'
  | 'ระดับดี'
  | 'ระดับปกติ'
  | 'งดจ้างต่อ'
  | 'ยอดเยี่ยม'
  | 'ดีมาก'
  | 'ดี'
  | 'พอใช้'
  | 'ปรับปรุง';

export interface LeaveStatItem {
  days: number;
  times: number;
}

export interface LeaveStats {
  late: LeaveStatItem; // มาสาย
  sick: LeaveStatItem; // ลาป่วย
  personal: LeaveStatItem; // ลากิจส่วนตัว
  maternity: LeaveStatItem; // ลาคลอดบุตร
  ordinationOrHajj: LeaveStatItem; // ลาอุปสมบท / ประกอบพิธีฮัจย์
  absent: LeaveStatItem; // ขาดราชการ
  other: LeaveStatItem; // อื่น ๆ
  notes?: string;
  // For backward compatibility:
  sickAndPersonal?: LeaveStatItem;
  extendedSick?: LeaveStatItem;
}

export interface DetailedComments {
  // (1) งานสำคัญที่ได้รับมอบหมายและผลงาน
  assignedWorkAndSuccess: string;
  assignedWorkSupervisorComment?: string;

  // (2) ความสามารถหรือลักษณะเด่น
  distinctiveCapabilities: string;
  distinctiveCapabilitiesSupervisorComment?: string;

  // (3) ข้อควรปรับปรุง พัฒนา หรือฝึกอบรม
  improvementsAndTraining: string;
  improvementsSupervisorComment?: string;

  // สรุปทั่วไป (backward compatible)
  strengths?: string;
  improvements?: string;
  general?: string;
}

export interface RecommendationSummary {
  decision: 'continue' | 'terminate'; // จ้างต่อ / ยุติการจ้าง
  terminationReason?: string; // เหตุผลกรณีเห็นควรให้ยุติการจ้าง
  supervisorName?: string;
  supervisorPosition?: string;
  supervisorSignatureUrl?: string;
  supervisorSignedAt?: string;
}

export interface GradeThreshold {
  level: GradeLevel;
  minScore: number; // percentage min e.g. 90
  maxScore: number; // percentage max e.g. 100
  color: string;
  badgeBg: string;
  description: string;
}

export interface SystemSettings {
  appName: string;
  appShortName: string;
  schoolName: string;
  schoolAffiliation: string;
  logoUrl?: string; // custom upload base64 or url
  isDemoMode: boolean; // toggle demo mode on/off
  academicYear: string;
  evaluationRound: string;
}

export interface EvaluationSubmission {
  id: string;
  evaluateeId: string;
  evaluateeName: string;
  evaluateePosition: string;
  evaluateeDepartment: string;
  formId: string;
  formTitle: string;
  groupId: string;
  
  // Anti-impersonation Read-only locked fields:
  evaluatorId: string;
  evaluatorName: string;
  evaluatorPosition: string;
  
  // ส่วนที่ 1 & 2 ข้อมูลประกอบ
  positionNumber?: string;
  startDate?: string;
  workplaceLocation?: string;
  supervisorMentorName?: string;

  // ส่วนที่ 3.1 ข้อมูลการปฏิบัติราชการ (วันลา)
  leaveStats?: LeaveStats;

  // ส่วนที่ 3.2 คะแนน
  scores: Record<string, number>; // indicatorId -> score
  categoryScores: Record<string, { scored: number; max: number; percentage: number }>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: GradeLevel;
  
  // ส่วนที่ 3.4 ข้อคิดเห็น 3 ข้อ
  comments: DetailedComments;
  
  // ส่วนที่ 4 สรุปการจ้างต่อ
  recommendation?: RecommendationSummary;

  signatureDataUrl?: string;
  submittedAt: string;
  isDraft: boolean;
  
  aiFeedback?: {
    strengthsSummary?: string;
    improvementAreas?: string;
    developmentPlan?: string;
    overallComment?: string;
  };
}

export interface AggregatedResult {
  evaluateeId: string;
  evaluatee: User;
  formId: string;
  formTitle: string;
  groupId: string;
  groupName: string;
  
  totalCommitteeCount: number;
  submittedCommitteeCount: number;
  isFullyEvaluated: boolean;
  
  submissions: EvaluationSubmission[];
  meanScore: number; // raw mean total score
  maxScore: number;
  meanPercentage: number;
  finalGrade: GradeLevel;
  
  categoryAverages: Record<string, number>; // categoryId -> mean percentage
  lastUpdated: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}
