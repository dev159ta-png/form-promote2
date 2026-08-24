import {
  FormTemplate,
  GradeLevel,
  GradeThreshold,
  EvaluationSubmission,
  AggregatedResult,
  User,
  CommitteeGroup,
} from '../types';
import { GRADE_THRESHOLDS } from '../data/initialData';

/**
 * Determine grade level based on percentage and thresholds
 */
export function calculateGrade(percentage: number, thresholds: GradeThreshold[] = GRADE_THRESHOLDS): GradeLevel {
  for (const threshold of thresholds) {
    if (percentage >= threshold.minScore && percentage <= threshold.maxScore + 0.001) {
      return threshold.level;
    }
  }
  return thresholds[thresholds.length - 1]?.level || 'งดจ้างต่อ';
}

/**
 * Get threshold styling info for a grade
 */
export function getGradeInfo(grade: GradeLevel, thresholds: GradeThreshold[] = GRADE_THRESHOLDS): GradeThreshold {
  const found = thresholds.find((t) => t.level === grade);
  return (
    found || {
      level: 'งดจ้างต่อ',
      minScore: 0,
      maxScore: 59.99,
      color: 'rose',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20',
      description: 'ผลการปฏิบัติงานไม่ผ่านเกณฑ์มาตรฐาน (ต่ำกว่า 60 คะแนน)',
    }
  );
}

/**
 * Calculate totals for a single evaluation submission
 */
export function calculateSubmissionScores(
  form: FormTemplate,
  scores: Record<string, number>,
  thresholds: GradeThreshold[] = GRADE_THRESHOLDS
) {
  let totalScore = 0;
  let maxScore = 0;
  const categoryScores: Record<string, { scored: number; max: number; percentage: number }> = {};

  form.categories.forEach((cat) => {
    let catScored = 0;
    let catMax = 0;

    cat.indicators.forEach((ind) => {
      const val = scores[ind.id] || 0;
      catScored += val;
      catMax += ind.weight;
    });

    const catPct = catMax > 0 ? (catScored / catMax) * 100 : 0;
    categoryScores[cat.id] = {
      scored: catScored,
      max: catMax,
      percentage: Number(catPct.toFixed(2)),
    };

    totalScore += catScored;
    maxScore += catMax;
  });

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const grade = calculateGrade(percentage, thresholds);

  return {
    totalScore,
    maxScore,
    percentage: Number(percentage.toFixed(2)),
    categoryScores,
    grade,
  };
}

/**
 * Calculate aggregated committee mean score for an evaluatee
 */
export function calculateAggregatedResult(
  evaluatee: User,
  form: FormTemplate,
  group: CommitteeGroup,
  submissions: EvaluationSubmission[],
  thresholds: GradeThreshold[] = GRADE_THRESHOLDS
): AggregatedResult {
  // Filter submissions for this evaluatee and group that are not drafts
  const validSubmissions = submissions.filter(
    (s) => s.evaluateeId === evaluatee.id && s.groupId === group.id && !s.isDraft
  );

  const totalCommitteeCount = group.evaluatorIds.length;
  const submittedCommitteeCount = validSubmissions.length;
  const isFullyEvaluated = submittedCommitteeCount >= totalCommitteeCount && totalCommitteeCount > 0;

  if (validSubmissions.length === 0) {
    return {
      evaluateeId: evaluatee.id,
      evaluatee,
      formId: form.id,
      formTitle: form.title,
      groupId: group.id,
      groupName: group.name,
      totalCommitteeCount,
      submittedCommitteeCount: 0,
      isFullyEvaluated: false,
      submissions: [],
      meanScore: 0,
      maxScore: form.categories.reduce((acc, cat) => acc + cat.indicators.reduce((sum, ind) => sum + ind.weight, 0), 0),
      meanPercentage: 0,
      finalGrade: 'ปรับปรุง',
      categoryAverages: {},
      lastUpdated: new Date().toISOString(),
    };
  }

  // Calculate Mean Scores
  const sumTotalScores = validSubmissions.reduce((acc, s) => acc + s.totalScore, 0);
  const sumPercentages = validSubmissions.reduce((acc, s) => acc + s.percentage, 0);

  const meanScore = Number((sumTotalScores / validSubmissions.length).toFixed(2));
  const meanPercentage = Number((sumPercentages / validSubmissions.length).toFixed(2));
  const finalGrade = calculateGrade(meanPercentage, thresholds);

  // Category averages
  const categoryAverages: Record<string, number> = {};
  form.categories.forEach((cat) => {
    let catPctSum = 0;
    validSubmissions.forEach((s) => {
      catPctSum += s.categoryScores[cat.id]?.percentage || 0;
    });
    categoryAverages[cat.id] = Number((catPctSum / validSubmissions.length).toFixed(2));
  });

  return {
    evaluateeId: evaluatee.id,
    evaluatee,
    formId: form.id,
    formTitle: form.title,
    groupId: group.id,
    groupName: group.name,
    totalCommitteeCount,
    submittedCommitteeCount,
    isFullyEvaluated,
    submissions: validSubmissions,
    meanScore,
    maxScore: validSubmissions[0]?.maxScore || 100,
    meanPercentage,
    finalGrade,
    categoryAverages,
    lastUpdated: validSubmissions[validSubmissions.length - 1]?.submittedAt || new Date().toISOString(),
  };
}

/**
 * Export results to CSV
 */
export function exportToCSV(aggregatedResults: AggregatedResult[], filename = 'performance-evaluations.csv') {
  const headers = [
    'ลำดับ',
    'ชื่อ-นามสกุล ผู้รับการประเมิน',
    'ตำแหน่ง',
    'ฝ่าย/สังกัด',
    'กลุ่มคณะกรรมการ',
    'กรรมการที่ส่งผล (คน)',
    'สถานะการประเมิน',
    'คะแนนเฉลี่ย',
    'คะแนนเต็ม',
    'ร้อยละเฉลี่ย (%)',
    'ระดับผลการประเมิน',
    'วันที่อัปเดตล่าสุด',
  ];

  const rows = aggregatedResults.map((item, index) => [
    index + 1,
    `"${item.evaluatee.name}"`,
    `"${item.evaluatee.position}"`,
    `"${item.evaluatee.department}"`,
    `"${item.groupName}"`,
    `"${item.submittedCommitteeCount}/${item.totalCommitteeCount}"`,
    `"${item.isFullyEvaluated ? 'ประเมินเสร็จสิ้น' : item.submittedCommitteeCount > 0 ? 'กำลังดำเนินการ' : 'รอการประเมิน'}"`,
    item.meanScore.toFixed(2),
    item.maxScore,
    `${item.meanPercentage.toFixed(2)}%`,
    `"${item.finalGrade}"`,
    `"${new Date(item.lastUpdated).toLocaleDateString('th-TH')}"`,
  ]);

  // UTF-8 BOM for Thai language Excel support
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper to resolve the appropriate form template for a user / evaluatee
 */
export function getFormTemplateForUser(
  user: User | undefined | null,
  templates: FormTemplate[]
): FormTemplate {
  if (!templates || templates.length === 0) {
    return {
      id: 'form_default',
      code: 'DEFAULT',
      group: 'teacher_assistant',
      title: 'แบบประเมินผลการปฏิบัติงาน',
      positionTitle: 'ทั่วไป',
      description: '',
      categories: [],
      totalMaxScore: 100,
    };
  }

  if (!user) return templates[0];

  // 1. Explicitly assigned form template ID
  if (user.formTemplateId) {
    const found = templates.find((t) => t.id === user.formTemplateId);
    if (found) return found;
  }

  // 2. Exact or substring match in positionTitle or code
  const cleanPos = (user.position || '').trim().toLowerCase();

  // Specific check for พนักงานราชการ / ครูผู้สอน (กลุ่มที่ 3)
  if (
    user.positionGroup === 'government_employee_teacher' ||
    cleanPos.includes('พนักงานราชการ') ||
    (cleanPos.includes('ครูผู้สอน') && !cleanPos.includes('ครูผู้ช่วย'))
  ) {
    const govTeacherTemplate = templates.find(
      (t) =>
        t.id === 'form_government_employee_teacher' ||
        t.group === 'government_employee_teacher' ||
        t.code === 'G-01' ||
        t.positionTitle.includes('ครูผู้สอน')
    );
    if (govTeacherTemplate) return govTeacherTemplate;
  }

  // Specific check for ครูผู้ช่วย (กลุ่มที่ 1)
  if (cleanPos.includes('ครูผู้ช่วย')) {
    const teacherTemplate = templates.find(
      (t) => t.id === 'form_teacher_assistant' || t.code === 'T-01' || t.positionTitle.includes('ครูผู้ช่วย')
    );
    if (teacherTemplate) return teacherTemplate;
  }

  // Match by position title
  const matchingByPos = templates.find(
    (t) =>
      cleanPos.includes(t.positionTitle.toLowerCase()) ||
      t.positionTitle.toLowerCase().includes(cleanPos)
  );
  if (matchingByPos) return matchingByPos;

  // 3. Fallback by positionGroup
  if (user.positionGroup) {
    const matchingByGroup = templates.find((t) => t.group === user.positionGroup);
    if (matchingByGroup) return matchingByGroup;
  }

  return templates[0];
}
