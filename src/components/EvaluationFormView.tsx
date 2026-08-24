import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Calendar,
  Layers,
  Building,
  Clock,
  Briefcase,
  User,
  FileText,
  ChevronDown,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DigitalSignaturePad } from './DigitalSignaturePad';
import { calculateSubmissionScores, getGradeInfo, getFormTemplateForUser } from '../utils/evaluationCalculator';
import { FormTemplate, LeaveStats, DetailedComments, RecommendationSummary } from '../types';

interface EvaluationFormViewProps {
  onEvaluationCompleted?: () => void;
}

export const EvaluationFormView: React.FC<EvaluationFormViewProps> = ({ onEvaluationCompleted }) => {
  const {
    currentUser,
    users,
    formTemplates,
    committeeGroups,
    selectedFormId,
    setSelectedFormId,
    selectedEvaluateeId,
    setSelectedEvaluateeId,
    submitEvaluation,
    saveDraftEvaluation,
    getDraftEvaluation,
    submissions,
    gradeThresholds,
  } = useApp();

  const evaluatees = users.filter((u) => u.role === 'staff');
  const currentEvaluatee = evaluatees.find((u) => u.id === selectedEvaluateeId) || evaluatees[0];

  // Auto-sync form template with current evaluatee whenever evaluatee changes or mounts
  useEffect(() => {
    if (currentEvaluatee) {
      const template = getFormTemplateForUser(currentEvaluatee, formTemplates);
      if (template && (!selectedFormId || !formTemplates.some(t => t.id === selectedFormId) || currentEvaluatee.formTemplateId === template.id)) {
        setSelectedFormId(template.id);
      }
    }
  }, [currentEvaluatee?.id, currentEvaluatee?.formTemplateId, formTemplates]);

  const currentForm = formTemplates.find((t) => t.id === selectedFormId) || (currentEvaluatee ? getFormTemplateForUser(currentEvaluatee, formTemplates) : formTemplates[0]);

  // User's group for this candidate
  const assignedGroup =
    committeeGroups.find((g) => g.assignedEvaluateeIds.includes(currentEvaluatee?.id || '')) ||
    committeeGroups[0];

  // Form State
  const [scores, setScores] = useState<Record<string, number>>({});
  const [positionNumber, setPositionNumber] = useState('พ-1042');
  const [startDate, setStartDate] = useState('2024-05-15');

  // Leave Stats (7 Categories: มาสาย, ลาป่วย, ลากิจส่วนตัว, ลาคลอดบุตร, ลาอุปสมบท/ฮัจย์, ขาดราชการ, อื่น ๆ)
  const defaultLeaveStats: LeaveStats = {
    late: { days: 0, times: 0 },
    sick: { days: 0, times: 0 },
    personal: { days: 0, times: 0 },
    maternity: { days: 0, times: 0 },
    ordinationOrHajj: { days: 0, times: 0 },
    absent: { days: 0, times: 0 },
    other: { days: 0, times: 0 },
    notes: '',
  };

  const [leaveStats, setLeaveStats] = useState<LeaveStats>(defaultLeaveStats);
  const [isLeaveStatsFromAdmin, setIsLeaveStatsFromAdmin] = useState(false);

  // Comments (Standard & Detailed)
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [generalComment, setGeneralComment] = useState('');
  const [assignedWorkAndSuccess, setAssignedWorkAndSuccess] = useState('');
  const [assignedWorkSupervisorComment, setAssignedWorkSupervisorComment] = useState('');
  const [distinctiveCapabilities, setDistinctiveCapabilities] = useState('');
  const [distinctiveCapabilitiesSupervisorComment, setDistinctiveCapabilitiesSupervisorComment] = useState('');
  const [improvementsAndTraining, setImprovementsAndTraining] = useState('');
  const [improvementsSupervisorComment, setImprovementsSupervisorComment] = useState('');

  // Recommendation
  const [recommendationDecision, setRecommendationDecision] = useState<'continue' | 'discontinue'>('continue');
  const [recommendationReason, setRecommendationReason] = useState('');

  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedResult, setLastSubmittedResult] = useState<any>(null);

  // Load existing submission or draft when evaluatee or form changes
  useEffect(() => {
    if (!currentEvaluatee || !currentForm) return;

    // Check if evaluatee has pre-filled leave stats from Admin
    const prefilledStats = currentEvaluatee.leaveStats
      ? {
          late: currentEvaluatee.leaveStats.late || { days: 0, times: 0 },
          sick: currentEvaluatee.leaveStats.sick || { days: 0, times: 0 },
          personal: currentEvaluatee.leaveStats.personal || { days: 0, times: 0 },
          maternity: currentEvaluatee.leaveStats.maternity || { days: 0, times: 0 },
          ordinationOrHajj: currentEvaluatee.leaveStats.ordinationOrHajj || { days: 0, times: 0 },
          absent: currentEvaluatee.leaveStats.absent || { days: 0, times: 0 },
          other: currentEvaluatee.leaveStats.other || { days: 0, times: 0 },
          notes: currentEvaluatee.leaveStats.notes || '',
        }
      : null;

    // 1. Check if user already submitted for this candidate
    const existingSubmission = submissions.find(
      (s) =>
        s.evaluateeId === currentEvaluatee.id &&
        s.formId === currentForm.id &&
        s.evaluatorId === currentUser.id
    );

    if (existingSubmission) {
      setScores(existingSubmission.scores);
      setPositionNumber(existingSubmission.positionNumber || currentEvaluatee.employeeCode || 'พ-1042');
      setStartDate(existingSubmission.startDate || '2024-05-15');
      if (existingSubmission.leaveStats) {
        setLeaveStats({
          late: existingSubmission.leaveStats.late || { days: 0, times: 0 },
          sick: existingSubmission.leaveStats.sick || existingSubmission.leaveStats.sickAndPersonal || { days: 0, times: 0 },
          personal: existingSubmission.leaveStats.personal || { days: 0, times: 0 },
          maternity: existingSubmission.leaveStats.maternity || { days: 0, times: 0 },
          ordinationOrHajj: existingSubmission.leaveStats.ordinationOrHajj || { days: 0, times: 0 },
          absent: existingSubmission.leaveStats.absent || { days: 0, times: 0 },
          other: existingSubmission.leaveStats.other || { days: 0, times: 0 },
          notes: existingSubmission.leaveStats.notes || '',
        });
        setIsLeaveStatsFromAdmin(false);
      } else if (prefilledStats) {
        setLeaveStats(prefilledStats);
        setIsLeaveStatsFromAdmin(true);
      }
      
      const c = existingSubmission.comments;
      setStrengths(c.strengths || '');
      setImprovements(c.improvements || '');
      setGeneralComment(c.general || '');
      setAssignedWorkAndSuccess(c.assignedWorkAndSuccess || '');
      setAssignedWorkSupervisorComment(c.assignedWorkSupervisorComment || '');
      setDistinctiveCapabilities(c.distinctiveCapabilities || '');
      setDistinctiveCapabilitiesSupervisorComment(c.distinctiveCapabilitiesSupervisorComment || '');
      setImprovementsAndTraining(c.improvementsAndTraining || '');
      setImprovementsSupervisorComment(c.improvementsSupervisorComment || '');

      if (existingSubmission.recommendation) {
        setRecommendationDecision(existingSubmission.recommendation.decision);
        setRecommendationReason(existingSubmission.recommendation.reason || '');
      }

      setSignatureDataUrl(existingSubmission.signatureDataUrl || '');
      return;
    }

    // 2. Check draft in localStorage
    const draft = getDraftEvaluation(currentEvaluatee.id, currentForm.id);
    if (draft) {
      setScores(draft.scores || {});
      setPositionNumber(draft.positionNumber || currentEvaluatee.employeeCode || 'พ-1042');
      setStartDate(draft.startDate || '2024-05-15');
      if (draft.leaveStats) {
        setLeaveStats({
          late: draft.leaveStats.late || { days: 0, times: 0 },
          sick: draft.leaveStats.sick || draft.leaveStats.sickAndPersonal || { days: 0, times: 0 },
          personal: draft.leaveStats.personal || { days: 0, times: 0 },
          maternity: draft.leaveStats.maternity || { days: 0, times: 0 },
          ordinationOrHajj: draft.leaveStats.ordinationOrHajj || { days: 0, times: 0 },
          absent: draft.leaveStats.absent || { days: 0, times: 0 },
          other: draft.leaveStats.other || { days: 0, times: 0 },
          notes: draft.leaveStats.notes || '',
        });
        setIsLeaveStatsFromAdmin(false);
      } else if (prefilledStats) {
        setLeaveStats(prefilledStats);
        setIsLeaveStatsFromAdmin(true);
      }

      const c = draft.comments || {};
      setStrengths(c.strengths || '');
      setImprovements(c.improvements || '');
      setGeneralComment(c.general || '');
      setAssignedWorkAndSuccess(c.assignedWorkAndSuccess || '');
      setAssignedWorkSupervisorComment(c.assignedWorkSupervisorComment || '');
      setDistinctiveCapabilities(c.distinctiveCapabilities || '');
      setDistinctiveCapabilitiesSupervisorComment(c.distinctiveCapabilitiesSupervisorComment || '');
      setImprovementsAndTraining(c.improvementsAndTraining || '');
      setImprovementsSupervisorComment(c.improvementsSupervisorComment || '');

      if (draft.recommendation) {
        setRecommendationDecision(draft.recommendation.decision);
        setRecommendationReason(draft.recommendation.reason || '');
      }

      setSignatureDataUrl(draft.signatureDataUrl || '');
      setDraftSavedTime(new Date(draft.submittedAt).toLocaleTimeString('th-TH'));
      return;
    }

    // 3. Default clean form
    setScores({});
    setPositionNumber(currentEvaluatee.employeeCode || 'พ-1042');
    setStartDate('2024-05-15');
    if (prefilledStats) {
      setLeaveStats(prefilledStats);
      setIsLeaveStatsFromAdmin(true);
    } else {
      setLeaveStats(defaultLeaveStats);
      setIsLeaveStatsFromAdmin(false);
    }
    setStrengths('');
    setImprovements('');
    setGeneralComment('');
    setAssignedWorkAndSuccess('');
    setAssignedWorkSupervisorComment('');
    setDistinctiveCapabilities('');
    setDistinctiveCapabilitiesSupervisorComment('');
    setImprovementsAndTraining('');
    setImprovementsSupervisorComment('');
    setRecommendationDecision('continue');
    setRecommendationReason('');
    setSignatureDataUrl('');
  }, [currentEvaluatee?.id, currentEvaluatee?.leaveStats, currentForm?.id, currentUser.id, submissions]);

  // Real-time calculation
  const calculated = calculateSubmissionScores(currentForm, scores, gradeThresholds);
  const gradeInfo = getGradeInfo(calculated.grade, gradeThresholds);

  // Total indicators count and filled count
  const allIndicators = currentForm.categories.flatMap((c) => c.indicators);
  const totalIndicators = allIndicators.length;
  const scoredCount = Object.keys(scores).filter((k) => scores[k] && scores[k] > 0).length;
  const isAllScored = scoredCount === totalIndicators && totalIndicators > 0;

  // Handle score change
  const handleScoreChange = (indicatorId: string, value: number) => {
    const updated = { ...scores, [indicatorId]: value };
    setScores(updated);

    // Auto save draft to LocalStorage
    saveDraftEvaluation({
      evaluateeId: currentEvaluatee.id,
      evaluateeName: currentEvaluatee.name,
      evaluateePosition: currentEvaluatee.position,
      evaluateeDepartment: currentEvaluatee.department,
      formId: currentForm.id,
      formTitle: currentForm.title,
      groupId: assignedGroup?.id || 'group_1',
      evaluatorId: currentUser.id,
      evaluatorName: currentUser.name,
      evaluatorPosition: currentUser.position,
      positionNumber,
      startDate,
      leaveStats,
      scores: updated,
      categoryScores: calculated.categoryScores,
      totalScore: calculated.totalScore,
      maxScore: calculated.maxScore,
      percentage: calculated.percentage,
      grade: calculated.grade,
      comments: {
        strengths,
        improvements,
        general: generalComment,
        assignedWorkAndSuccess,
        assignedWorkSupervisorComment,
        distinctiveCapabilities,
        distinctiveCapabilitiesSupervisorComment,
        improvementsAndTraining,
        improvementsSupervisorComment,
      },
      recommendation: {
        decision: recommendationDecision,
        reason: recommendationReason,
        supervisorName: currentUser.name,
        supervisorPosition: currentUser.position,
      },
      signatureDataUrl,
      isDraft: true,
    });
    setDraftSavedTime(new Date().toLocaleTimeString('th-TH'));
  };

  // AI Feedback Generator via /api/ai/analyze-evaluation
  const generateAiFeedback = async () => {
    if (scoredCount === 0) {
      alert('กรุณากรอกคะแนนในแบบประเมินอย่างน้อยบางส่วนก่อนใช้ AI สร้างข้อเสนอแนะ');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const response = await fetch('/api/ai/analyze-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: currentEvaluatee,
          scoresSummary: calculated,
          formTitle: currentForm.title,
          strengths,
          improvements,
        }),
      });
      const data = await response.json();
      if (data.feedback) {
        if (data.feedback.strengthsSummary) {
          setStrengths(data.feedback.strengthsSummary);
          setDistinctiveCapabilities(data.feedback.strengthsSummary);
        }
        if (data.feedback.improvementAreas) {
          setImprovements(data.feedback.improvementAreas);
          setImprovementsAndTraining(data.feedback.improvementAreas);
        }
        if (data.feedback.overallComment) {
          setGeneralComment(data.feedback.overallComment);
        }
        if (!assignedWorkAndSuccess) {
          setAssignedWorkAndSuccess(`ปฏิบัติหน้าที่ตามตำแหน่ง${currentEvaluatee.position} และงานที่ได้รับมอบหมายตามแผนงานประจำปี`);
        }
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อระบบ AI ได้ กำลังใช้ข้อเสนอแนะมาตรฐาน');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Submit Evaluation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAllScored) {
      alert(`กรุณาให้คะแนนให้ครบทุกตัวชี้วัด (ประเมินแล้ว ${scoredCount}/${totalIndicators} ข้อ)`);
      return;
    }

    if (!signatureDataUrl) {
      alert('กรุณาลงลายมือชื่อดิจิทัล (Digital Signature) ก่อนส่งผลการประเมิน');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitEvaluation({
        evaluateeId: currentEvaluatee.id,
        evaluateeName: currentEvaluatee.name,
        evaluateePosition: currentEvaluatee.position,
        evaluateeDepartment: currentEvaluatee.department,
        formId: currentForm.id,
        formTitle: currentForm.title,
        groupId: assignedGroup?.id || 'group_1',
        evaluatorId: currentUser.id,
        evaluatorName: currentUser.name,
        evaluatorPosition: currentUser.position,
        positionNumber,
        startDate,
        leaveStats,
        scores,
        categoryScores: calculated.categoryScores,
        totalScore: calculated.totalScore,
        maxScore: calculated.maxScore,
        percentage: calculated.percentage,
        grade: calculated.grade,
        comments: {
          strengths,
          improvements,
          general: generalComment,
          assignedWorkAndSuccess,
          assignedWorkSupervisorComment,
          distinctiveCapabilities,
          distinctiveCapabilitiesSupervisorComment,
          improvementsAndTraining,
          improvementsSupervisorComment,
        },
        recommendation: {
          decision: recommendationDecision,
          reason: recommendationReason,
          supervisorName: currentUser.name,
          supervisorPosition: currentUser.position,
          supervisorSignedAt: new Date().toISOString(),
        },
        signatureDataUrl,
        isDraft: false,
      });

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setLastSubmittedResult(result);
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-16">
      
      {/* 1. Form Selector Header (3 กลุ่มหลัก 14 ตำแหน่ง) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-700" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                เลือกแบบฟอร์มการประเมิน (14 ตำแหน่ง / 3 กลุ่มหลัก)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ยึดตามเกณฑ์แบบฟอร์มการประเมินเพื่อพิจารณาจ้างต่อ/งดจ้างต่อ และประเมินผลการปฏิบัติงาน (100 คะแนนเต็ม)
            </p>
          </div>

          {/* Group 1 vs Group 2 vs Group 3 Fast Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">กลุ่มหลัก:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 flex-wrap gap-1">
              <button
                type="button"
                onClick={() => {
                  const teacherForm = formTemplates.find((t) => t.group === 'teacher_assistant');
                  if (teacherForm) setSelectedFormId(teacherForm.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentForm.group === 'teacher_assistant'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                กลุ่มที่ 1: ครูผู้ช่วย
              </button>
              <button
                type="button"
                onClick={() => {
                  const supportForm = formTemplates.find((t) => t.group === 'support_staff');
                  if (supportForm) setSelectedFormId(supportForm.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentForm.group === 'support_staff'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                กลุ่มที่ 2: จ้างเหมาบริการ
              </button>
              <button
                type="button"
                onClick={() => {
                  const govForm = formTemplates.find((t) => t.group === 'government_employee_teacher' || t.id === 'form_government_employee_teacher');
                  if (govForm) setSelectedFormId(govForm.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentForm.group === 'government_employee_teacher'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                กลุ่มที่ 3: พนักงานราชการ (ครูผู้สอน)
              </button>
            </div>
          </div>
        </div>

        {/* Position Select Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. เลือกแบบประเมินตำแหน่งงาน (14 ตำแหน่ง / 3 กลุ่มหลัก):
            </label>
            <select
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white font-medium text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <optgroup label="กลุ่มที่ 1 : ตำแหน่ง ครูผู้ช่วย (ลูกจ้างชั่วคราว)">
                {formTemplates
                  .filter((t) => t.group === 'teacher_assistant')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.title}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="กลุ่มที่ 2 : จ้างเหมาบริการทุกตำแหน่ง (12 ตำแหน่ง)">
                {formTemplates
                  .filter((t) => t.group === 'support_staff')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.title}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="กลุ่มที่ 3 : พนักงานราชการทั่วไป ตำแหน่ง ครูผู้สอน">
                {formTemplates
                  .filter((t) => t.group === 'government_employee_teacher')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.title}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. เลือกบุคลากรผู้รับการประเมิน:
            </label>
            <select
              value={selectedEvaluateeId}
              onChange={(e) => {
                const newEvalId = e.target.value;
                setSelectedEvaluateeId(newEvalId);
                const targetEval = evaluatees.find((u) => u.id === newEvalId);
                if (targetEval) {
                  const targetTemplate = getFormTemplateForUser(targetEval, formTemplates);
                  if (targetTemplate) {
                    setSelectedFormId(targetTemplate.id);
                  }
                }
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white font-medium text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {evaluatees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.position}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Anti-Impersonation & Evaluator Information Card (Read-only Auto-fill) */}
      <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-50 border-2 border-blue-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/60 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-blue-950 text-sm sm:text-base">
              ข้อมูลคณะกรรมการผู้ประเมิน (ระบบล็อคตัวตนเพื่อป้องกันการสวมรอย)
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-800 bg-blue-100/80 px-3 py-1 rounded-full border border-blue-300">
            <UserCheck className="w-3.5 h-3.5" />
            Auto-fill &amp; Read-Only
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
            <span className="text-slate-500 block text-[11px]">ชื่อ-นามสกุล กรรมการผู้ประเมิน:</span>
            <span className="font-bold text-slate-900">{currentUser.name}</span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
            <span className="text-slate-500 block text-[11px]">ตำแหน่งในคณะกรรมการ:</span>
            <span className="font-bold text-slate-900">{currentUser.position}</span>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
            <span className="text-slate-500 block text-[11px]">กลุ่มคณะกรรมการที่สังกัด:</span>
            <span className="font-bold text-blue-900">{assignedGroup?.name || 'คณะกรรมการประจำสถาบัน'}</span>
          </div>
        </div>
      </div>

      {/* 3. Candidate Summary & Dynamic Score Preview Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Candidate Info */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              ผู้รับการประเมิน
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {currentEvaluatee?.name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              {currentEvaluatee?.position} | {currentEvaluatee?.department}
            </p>
            <div className="pt-1 text-xs text-slate-500">
              แบบประเมิน: <span className="font-medium text-slate-700">{currentForm.title}</span>
            </div>
          </div>

          {/* Dynamic Score & Grade Badge */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">คะแนนรวมที่ได้</div>
              <div className="text-2xl font-black text-slate-900">
                {calculated.totalScore} <span className="text-xs text-slate-400 font-normal">/ {calculated.maxScore}</span>
              </div>
              <div className="text-xs font-bold text-blue-700">{calculated.percentage.toFixed(2)}%</div>
            </div>

            <div className="h-10 w-px bg-slate-200" />

            <div className="flex flex-col items-center">
              <span className="text-[11px] text-slate-500 font-medium mb-1">ระดับผลประเมิน</span>
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-xs ${gradeInfo.badgeBg}`}>
                {calculated.grade}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar of filled indicators */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            ให้คะแนนแล้ว: <span className="font-bold text-slate-800">{scoredCount}</span> / {totalIndicators} ข้อ
          </div>
          {draftSavedTime && (
            <div className="flex items-center gap-1 text-emerald-600 font-medium">
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกแบบร่างอัตโนมัติแล้วเมื่อ {draftSavedTime}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Form Content Sections */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        
        {/* ตอนที่ 1: ข้อมูลของผู้รับการประเมินและสถิติการมาทำงาน */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm sm:text-base text-white">
                ตอนที่ 1: ข้อมูลของผู้รับการประเมินและสถิติการมาทำงาน (รอบ 6 เดือน)
              </h3>
            </div>
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-slate-200">
              ข้อมูลประกอบการพิจารณา
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* General Profile fields - Removed workplaceLocation & supervisorMentorName as requested */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่งเลขที่:</label>
                <input
                  type="text"
                  value={positionNumber}
                  onChange={(e) => setPositionNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">วันที่เริ่มปฏิบัติงาน:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>

            {/* Leave statistics Table - 7 categories with Days / Times */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-800">
                  สถิติการมาทำงาน การลา และการมาสายในรอบการประเมิน:
                </label>
                {isLeaveStatsFromAdmin ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ดึงข้อมูลสถิติวันลาที่แอดมินบันทึกไว้ล่วงหน้าอัตโนมัติ
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    กรรมการสามารถตรวจสอบและปรับแก้จำนวนวัน/ครั้งได้ตามจริง
                  </span>
                )}
              </div>
              
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">ประเภทการลา / การมาสาย</th>
                      <th className="p-3 text-center w-28">จำนวน (วัน)</th>
                      <th className="p-3 text-center w-28">จำนวน (ครั้ง)</th>
                      <th className="p-3">หมายเหตุ / ข้อมูลเพิ่มเติม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* 1. มาสาย */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-900">1. มาสาย</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.late?.days ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, late: { ...leaveStats.late, days: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.late?.times ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, late: { ...leaveStats.late, times: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="ระบุเหตุผลหรือหมายเหตุ..."
                          value={leaveStats.notes || ''}
                          onChange={(e) => setLeaveStats({ ...leaveStats, notes: e.target.value })}
                          className="w-full p-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    </tr>

                    {/* 2. ลาป่วย */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-900">2. ลาป่วย</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.sick?.days ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, sick: { ...leaveStats.sick, days: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.sick?.times ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, sick: { ...leaveStats.sick, times: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-slate-500 italic text-[11px]">ลาป่วยตามสิทธิการจ้าง</td>
                    </tr>

                    {/* 3. ลากิจส่วนตัว */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-900">3. ลากิจส่วนตัว</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.personal?.days ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, personal: { ...leaveStats.personal, days: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.personal?.times ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, personal: { ...leaveStats.personal, times: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-slate-500 italic text-[11px]">ลากิจส่วนตัวตามระเบียบ</td>
                    </tr>

                    {/* 4. ลาคลอดบุตร */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-900">4. ลาคลอดบุตร</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.maternity?.days ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, maternity: { ...leaveStats.maternity, days: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.maternity?.times ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, maternity: { ...leaveStats.maternity, times: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-slate-500 italic text-[11px]">ตามสิทธิการลาคลอดบุตร</td>
                    </tr>

                    {/* 5. ลาอุปสมบท / ประกอบพิธีฮัจย์ */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-900">5. ลาอุปสมบท / ประกอบพิธีฮัจย์</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.ordinationOrHajj?.days ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, ordinationOrHajj: { ...leaveStats.ordinationOrHajj, days: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.ordinationOrHajj?.times ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, ordinationOrHajj: { ...leaveStats.ordinationOrHajj, times: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-slate-500 italic text-[11px]">ตามระเบียบการลาทางศาสนา</td>
                    </tr>

                    {/* 6. ขาดราชการ */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-900">6. ขาดราชการ</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.absent?.days ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, absent: { ...leaveStats.absent, days: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-rose-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.absent?.times ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, absent: { ...leaveStats.absent, times: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-rose-500"
                        />
                      </td>
                      <td className="p-2 text-rose-600 font-semibold text-[11px]">ขาดงานเกินกำหนดมีผลต่องดจ้างต่อ</td>
                    </tr>

                    {/* 7. อื่น ๆ */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-900">7. อื่น ๆ</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.other?.days ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, other: { ...leaveStats.other, days: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="0"
                          value={leaveStats.other?.times ?? 0}
                          onChange={(e) => setLeaveStats({ ...leaveStats, other: { ...leaveStats.other, times: Number(e.target.value) } })}
                          className="w-20 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 text-slate-500 italic text-[11px]">การลาประเภทอื่นๆ ที่ได้รับอนุมัติ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ตอนที่ 2: การประเมินผลการปฏิบัติงานตามตัวชี้วัด (100 คะแนน) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">
                ตอนที่ 2: การประเมินผลการปฏิบัติงานตามตัวชี้วัด (รวม 100 คะแนน)
              </h3>
              <p className="text-xs text-slate-500">
                ประเมินตามเกณฑ์แบบฟอร์มมาตรฐานจำแนกเป็น 3 หมวด
              </p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
              คะแนนเต็ม 100 คะแนน
            </span>
          </div>

          {currentForm.categories.map((category, catIdx) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-white">{category.name}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {category.indicators.length} ตัวชี้วัด | คะแนนเต็มประจำหมวด {category.indicators.reduce((acc, i) => acc + i.weight, 0)} คะแนน
                  </p>
                </div>
                <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-blue-200 border border-white/10">
                  สัดส่วน {category.weightPercentage}%
                </span>
              </div>

              {/* Indicators Table */}
              <div className="divide-y divide-slate-100">
                {category.indicators.map((indicator, indIdx) => {
                  const currentScore = scores[indicator.id] || 0;
                  const isWeight20 = indicator.weight === 20;
                  const isWeight15 = indicator.weight === 15;
                  const isWeight10 = indicator.weight === 10;

                  return (
                    <div
                      key={indicator.id}
                      className={`p-4 sm:p-5 transition ${
                        currentScore > 0 ? 'bg-white' : 'bg-amber-50/20'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        
                        {/* Title & Description */}
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {indicator.title}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                              (เต็ม {indicator.weight} คะแนน)
                            </span>
                            {currentScore > 0 && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {indicator.description}
                          </p>
                        </div>

                        {/* Interactive Score Selector */}
                        {isWeight20 ? (
                          /* 20-point scale selector */
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {[20, 19, 18, 17, 16, 15, 14, 12, 10, 5].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleScoreChange(indicator.id, val)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                    currentScore === val
                                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-400/20'
                                      : 'bg-slate-50 hover:bg-purple-50 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                            
                            {/* Manual precision number input */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500 font-medium">ระบุคะแนน (0-20):</span>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={currentScore || ''}
                                onChange={(e) => handleScoreChange(indicator.id, Math.min(20, Math.max(0, Number(e.target.value))))}
                                className="w-16 p-1.5 text-center text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="0-20"
                              />
                              <span className="text-xs font-bold text-slate-700">/ 20</span>
                            </div>
                          </div>
                        ) : isWeight15 ? (
                          /* 15-point scale selector */
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {[15, 14, 13, 12, 11, 10, 8, 5].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleScoreChange(indicator.id, val)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                    currentScore === val
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/20'
                                      : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                            
                            {/* Manual precision number input */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500 font-medium">ระบุคะแนน (0-15):</span>
                              <input
                                type="number"
                                min="0"
                                max="15"
                                value={currentScore || ''}
                                onChange={(e) => handleScoreChange(indicator.id, Math.min(15, Math.max(0, Number(e.target.value))))}
                                className="w-16 p-1.5 text-center text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="0-15"
                              />
                              <span className="text-xs font-bold text-slate-700">/ 15</span>
                            </div>
                          </div>
                        ) : isWeight10 ? (
                          /* 10-point scale selector (for Support Staff positions) */
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-1 flex-wrap justify-end">
                              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleScoreChange(indicator.id, val)}
                                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center ${
                                    currentScore === val
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/20 font-extrabold'
                                      : val >= 8
                                      ? 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200'
                                      : val >= 6
                                      ? 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200'
                                      : 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                            
                            {/* Direct score input */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500 font-medium">ระบุคะแนน (0-10):</span>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={currentScore || ''}
                                onChange={(e) => handleScoreChange(indicator.id, Math.min(10, Math.max(0, Number(e.target.value))))}
                                className="w-16 p-1.5 text-center text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="0-10"
                              />
                              <span className="text-xs font-bold text-slate-700">/ 10</span>
                            </div>
                          </div>
                        ) : (
                          /* Standard 1 - 5 Rating Chips */
                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {[
                              { val: 1, label: '1 (ปรับปรุง)', bg: 'hover:bg-rose-50 hover:text-rose-700' },
                              { val: 2, label: '2 (พอใช้)', bg: 'hover:bg-orange-50 hover:text-orange-700' },
                              { val: 3, label: '3 (ดี)', bg: 'hover:bg-amber-50 hover:text-amber-700' },
                              { val: 4, label: '4 (ดีมาก)', bg: 'hover:bg-blue-50 hover:text-blue-700' },
                              { val: 5, label: '5 (ยอดเยี่ยม)', bg: 'hover:bg-emerald-50 hover:text-emerald-700' },
                            ].map((option) => {
                              const isSelected = currentScore === option.val;
                              return (
                                <button
                                  key={option.val}
                                  type="button"
                                  onClick={() => handleScoreChange(indicator.id, option.val)}
                                  className={`px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex flex-col items-center justify-center min-w-[48px] sm:min-w-[56px] ${
                                    isSelected
                                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                                      : `bg-slate-50 text-slate-700 border-slate-200 ${option.bg}`
                                  }`}
                                >
                                  <span className="text-sm sm:text-base font-extrabold">{option.val}</span>
                                  <span className="text-[9px] font-normal opacity-80">
                                    {option.val === 5
                                      ? 'ดีเด่น'
                                      : option.val === 4
                                      ? 'ดีมาก'
                                      : option.val === 3
                                      ? 'ดี'
                                      : option.val === 2
                                      ? 'ปกติ'
                                      : 'ปรับปรุง'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ตอนที่ 3: สรุปผลงาน ความรู้ความสามารถ จุดเด่น และเรื่องที่ควรพัฒนา */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                ตอนที่ 3: สรุปผลงาน ความรู้ความสามารถ จุดเด่น และเรื่องที่ควรพัฒนา
              </h3>
              <p className="text-xs text-slate-500">
                บันทึกผลสัมฤทธิ์ของงาน พร้อมความเห็นของผู้ควบคุมการปฏิบัติงาน
              </p>
            </div>

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={generateAiFeedback}
              disabled={isGeneratingAi}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? 'AI กำลังประมวลผล...' : 'AI ช่วยร่างข้อคิดเห็น'}</span>
            </button>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* 3.1 Assigned Work */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-900">
                3.1 สรุปงานที่ได้รับมอบหมายและผลสัมฤทธิ์ของงาน:
              </label>
              <textarea
                rows={2}
                value={assignedWorkAndSuccess}
                onChange={(e) => setAssignedWorkAndSuccess(e.target.value)}
                placeholder="ระบุภาระงานที่ได้รับมอบหมายและผลสัมฤทธิ์ เช่น จัดการเรียนการสอน งานธุรการ งานโครงการ..."
                className="w-full p-2.5 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                  ความเห็นของผู้ควบคุมการปฏิบัติงาน:
                </span>
                <input
                  type="text"
                  value={assignedWorkSupervisorComment}
                  onChange={(e) => setAssignedWorkSupervisorComment(e.target.value)}
                  placeholder="ความเห็นของผู้ควบคุม..."
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            {/* 3.2 Distinctive Capabilities */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-900">
                3.2 ความรู้ ความสามารถ ทักษะ หรือสมรรถนะที่เป็นจุดเด่น:
              </label>
              <textarea
                rows={2}
                value={distinctiveCapabilities}
                onChange={(e) => {
                  setDistinctiveCapabilities(e.target.value);
                  setStrengths(e.target.value);
                }}
                placeholder="ระบุจุดเด่น ทักษะเฉพาะทาง หรือความสามารถที่โดดเด่นเป็นแบบอย่าง..."
                className="w-full p-2.5 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                  ความเห็นของผู้ควบคุมการปฏิบัติงาน:
                </span>
                <input
                  type="text"
                  value={distinctiveCapabilitiesSupervisorComment}
                  onChange={(e) => setDistinctiveCapabilitiesSupervisorComment(e.target.value)}
                  placeholder="ความเห็นของผู้ควบคุม..."
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>

            {/* 3.3 Improvements and Training */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block font-bold text-slate-900">
                3.3 เรื่องที่ควรปรับปรุงพัฒนา หรือควรได้รับการฝึกอบรม (IDP):
              </label>
              <textarea
                rows={2}
                value={improvementsAndTraining}
                onChange={(e) => {
                  setImprovementsAndTraining(e.target.value);
                  setImprovements(e.target.value);
                }}
                placeholder="ระบุทักษะที่ควรพัฒนาเพิ่มเติม หรือหัวข้ออบรมที่จำเป็น..."
                className="w-full p-2.5 bg-white rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600 block mb-1">
                  ความเห็นของผู้ควบคุมการปฏิบัติงาน:
                </span>
                <input
                  type="text"
                  value={improvementsSupervisorComment}
                  onChange={(e) => setImprovementsSupervisorComment(e.target.value)}
                  placeholder="ความเห็นของผู้ควบคุม..."
                  className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ตอนที่ 4: ความเห็นและข้อเสนอแนะของผู้บังคับบัญชา */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              ตอนที่ 4: ความเห็นและข้อเสนอแนะของผู้บังคับบัญชา / คณะกรรมการ
            </h3>
            <p className="text-xs text-slate-500">
              พิจารณาเสนอแนะการจ้างต่อหรือการยุติการจ้างตามเกณฑ์ผลการประเมิน
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Continue */}
              <button
                type="button"
                onClick={() => setRecommendationDecision('continue')}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  recommendationDecision === 'continue'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  recommendationDecision === 'continue' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400'
                }`}>
                  {recommendationDecision === 'continue' && <Check className="w-3 h-3" />}
                </div>
                <div>
                  <div className="font-bold text-emerald-900 text-sm sm:text-base">
                    [ / ] สมควรจ้างต่อ
                  </div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    เนื่องจากมีผลการประเมินผ่านเกณฑ์มาตรฐาน (ระดับปกติ, ดี, หรือ ดีเด่น)
                  </div>
                </div>
              </button>

              {/* Option 2: Discontinue */}
              <button
                type="button"
                onClick={() => setRecommendationDecision('discontinue')}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-start gap-3 ${
                  recommendationDecision === 'discontinue'
                    ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  recommendationDecision === 'discontinue' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-400'
                }`}>
                  {recommendationDecision === 'discontinue' && <Check className="w-3 h-3" />}
                </div>
                <div>
                  <div className="font-bold text-rose-900 text-sm sm:text-base">
                    [ / ] งดจ้างต่อ
                  </div>
                  <div className="text-xs text-rose-700 mt-0.5">
                    เนื่องจากมีผลการประเมินไม่ผ่านเกณฑ์มาตรฐาน (คะแนนต่ำกว่า 60 คะแนน)
                  </div>
                </div>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ระบุเหตุผล / ข้อสังเกตเพิ่มเติมของผู้บังคับบัญชา:
              </label>
              <textarea
                rows={2}
                value={recommendationReason}
                onChange={(e) => setRecommendationReason(e.target.value)}
                placeholder="ระบุเหตุผลประกอบข้อเสนอแนะ..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ตอนที่ 5: Digital Signature Pad */}
        <DigitalSignaturePad
          signerName={currentUser.name}
          signerPosition={currentUser.position}
          onSave={(url) => setSignatureDataUrl(url)}
          initialSignature={signatureDataUrl}
        />

        {/* Action Submission Bar */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-sm font-bold text-white">
              พร้อมบันทึกผลการประเมินของ {currentUser.name}
            </div>
            <div className="text-xs text-slate-400">
              สถานะ: {isAllScored ? 'คะแนนครบถ้วน 100 คะแนน' : `ยังขาดอีก ${totalIndicators - scoredCount} ข้อ`} | 
              {signatureDataUrl ? ' ลงลายมือชื่อแล้ว' : ' ยังไม่ลงลายมือชื่อ'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !isAllScored || !signatureDataUrl}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'บันทึกและส่งผลการประเมิน'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && lastSubmittedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">
                บันทึกผลการประเมินเรียบร้อยแล้ว
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                ระบบได้คำนวณคะแนนตามเกณฑ์แบบฟอร์มทางการ (100 คะแนน) และรวมผลเข้าสู่คณะกรรมการ
              </p>
            </div>

            {/* Score Summary Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">ผู้รับการประเมิน:</span>
                <span className="font-bold text-slate-900">{lastSubmittedResult.evaluateeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">กรรมการผู้ประเมิน:</span>
                <span className="font-bold text-blue-900">{lastSubmittedResult.evaluatorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">คะแนนที่ให้:</span>
                <span className="font-bold text-slate-900">{lastSubmittedResult.percentage.toFixed(2)}% ({lastSubmittedResult.totalScore}/{lastSubmittedResult.maxScore} คะแนน)</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-semibold">ระดับผลการประเมิน:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-full">
                  {lastSubmittedResult.grade}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onEvaluationCompleted) onEvaluationCompleted();
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                กลับสู่หน้าแดชบอร์ด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
