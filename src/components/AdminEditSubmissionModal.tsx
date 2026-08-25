import React, { useState, useEffect } from 'react';
import { EvaluationSubmission, FormTemplate, GradeThreshold } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Edit3,
  Trash2,
  Save,
  AlertTriangle,
  Award,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { calculateSubmissionScores, getGradeInfo } from '../utils/evaluationCalculator';

interface AdminEditSubmissionModalProps {
  submission: EvaluationSubmission | null;
  onClose: () => void;
  onDeleted?: () => void;
}

export const AdminEditSubmissionModal: React.FC<AdminEditSubmissionModalProps> = ({
  submission,
  onClose,
  onDeleted,
}) => {
  const { formTemplates, gradeThresholds, updateSubmission, deleteSubmission } = useApp();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [positionNumber, setPositionNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [generalComment, setGeneralComment] = useState('');
  const [assignedWorkAndSuccess, setAssignedWorkAndSuccess] = useState('');
  const [distinctiveCapabilities, setDistinctiveCapabilities] = useState('');
  const [improvementsAndTraining, setImprovementsAndTraining] = useState('');
  const [recommendationDecision, setRecommendationDecision] = useState<'continue' | 'terminate'>('continue');
  const [terminationReason, setTerminationReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (submission) {
      setScores(submission.scores || {});
      setPositionNumber(submission.positionNumber || '');
      setStartDate(submission.startDate || '');
      const c = submission.comments || {};
      setGeneralComment(c.general || '');
      setAssignedWorkAndSuccess(c.assignedWorkAndSuccess || '');
      setDistinctiveCapabilities(c.distinctiveCapabilities || '');
      setImprovementsAndTraining(c.improvementsAndTraining || '');
      if (submission.recommendation) {
        setRecommendationDecision(submission.recommendation.decision === 'terminate' ? 'terminate' : 'continue');
        setTerminationReason(submission.recommendation.terminationReason || '');
      }
    }
  }, [submission]);

  if (!submission) return null;

  const currentForm: FormTemplate | undefined =
    formTemplates.find((f) => f.id === submission.formId) || formTemplates[0];

  // Calculate live scores
  const calculated = calculateSubmissionScores(currentForm, scores, gradeThresholds);
  const gradeInfo = getGradeInfo(calculated.grade, gradeThresholds);

  const handleScoreChange = (indicatorId: string, val: number) => {
    setScores((prev) => ({
      ...prev,
      [indicatorId]: val,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updated: EvaluationSubmission = {
      ...submission,
      positionNumber,
      startDate,
      scores,
      categoryScores: calculated.categoryScores,
      totalScore: calculated.totalScore,
      maxScore: calculated.maxScore,
      percentage: calculated.percentage,
      grade: calculated.grade,
      comments: {
        ...submission.comments,
        general: generalComment,
        assignedWorkAndSuccess,
        distinctiveCapabilities,
        improvementsAndTraining,
      },
      recommendation: {
        decision: recommendationDecision,
        terminationReason: recommendationDecision === 'terminate' ? terminationReason : undefined,
        supervisorName: submission.recommendation?.supervisorName || submission.evaluatorName,
        supervisorPosition: submission.recommendation?.supervisorPosition || submission.evaluatorPosition,
        supervisorSignatureUrl: submission.recommendation?.supervisorSignatureUrl,
        supervisorSignedAt: submission.recommendation?.supervisorSignedAt,
      },
    };

    updateSubmission(updated);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = () => {
    deleteSubmission(submission.id);
    setShowDeleteConfirm(false);
    if (onDeleted) {
      onDeleted();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                จัดการผลคะแนนการประเมิน (สิทธิ์ผู้ดูแลระบบ - Admin)
              </h3>
              <p className="text-[11px] text-amber-100">
                แก้ไขคะแนน หรือ ลบผลการประเมินของกรรมการรายนี้
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1">
          {/* Candidate & Evaluator Header Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200 pb-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>ผู้รับการประเมิน: {submission.evaluateeName}</span>
              </div>
              <div className="text-slate-600">ตำแหน่ง: <span className="font-semibold text-slate-800">{submission.evaluateePosition}</span></div>
              <div className="text-slate-600">สังกัด: <span className="text-slate-700">{submission.evaluateeDepartment}</span></div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-indigo-950 border-b border-slate-200 pb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>กรรมการผู้ประเมิน: {submission.evaluatorName}</span>
              </div>
              <div className="text-slate-600">ตำแหน่งกรรมการ: <span className="text-slate-800 font-medium">{submission.evaluatorPosition}</span></div>
              <div className="text-slate-500 text-[11px]">
                วันที่บันทึก: {new Date(submission.submittedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
              </div>
            </div>
          </div>

          {/* Dynamic Score Calculator Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-5 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-indigo-200 font-semibold">คะแนนคำนวณสดขณะแก้ไข:</div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                {calculated.totalScore} <span className="text-sm font-normal text-slate-300">/ {calculated.maxScore} คะแนน</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-lg sm:text-xl font-bold text-amber-300">{calculated.percentage.toFixed(2)}%</div>
                <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${gradeInfo.badgeBg}`}>
                  {calculated.grade}
                </span>
              </div>
            </div>
          </div>

          {/* Form Meta Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ตำแหน่งเลขที่:
              </label>
              <input
                type="text"
                value={positionNumber}
                onChange={(e) => setPositionNumber(e.target.value)}
                placeholder="เช่น พ-1042"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันที่เริ่มปฏิบัติงาน:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Rubric Score Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>ปรับแก้คะแนนรายตัวชี้วัด ({currentForm?.title})</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                คะแนนรวมทั้งหมด {currentForm?.totalMaxScore} คะแนน
              </span>
            </div>

            {currentForm?.categories.map((category, catIdx) => (
              <div key={category.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100/90 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    {category.name}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                    น้ำหนัก {category.weightPercentage}%
                  </span>
                </div>

                <div className="divide-y divide-slate-100 p-2 sm:p-3 bg-white space-y-2">
                  {category.indicators.map((ind, indIdx) => {
                    const currentScore = scores[ind.id] !== undefined ? scores[ind.id] : 0;
                    return (
                      <div key={ind.id} className="pt-2 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 pr-2">
                          <div className="text-xs font-bold text-slate-900">
                            {catIdx + 1}.{indIdx + 1} {ind.title}
                          </div>
                          <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                            {ind.description}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-xs font-medium text-slate-500">คะแนน:</label>
                          <input
                            type="number"
                            min="0"
                            max={ind.weight}
                            step="0.5"
                            value={currentScore}
                            onChange={(e) => handleScoreChange(ind.id, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1 text-center font-bold text-xs border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none bg-indigo-50/50"
                          />
                          <span className="text-xs text-slate-400 font-medium">/ {ind.weight}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Comments Section */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
              ข้อคิดเห็นและข้อเสนอแนะของกรรมการ
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                (1) งานสำคัญที่ได้รับมอบหมายและผลสัมฤทธิ์
              </label>
              <textarea
                rows={2}
                value={assignedWorkAndSuccess}
                onChange={(e) => setAssignedWorkAndSuccess(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                (2) ความสามารถหรือลักษณะเด่น
              </label>
              <textarea
                rows={2}
                value={distinctiveCapabilities}
                onChange={(e) => setDistinctiveCapabilities(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                (3) ข้อควรปรับปรุง พัฒนา หรือฝึกอบรม
              </label>
              <textarea
                rows={2}
                value={improvementsAndTraining}
                onChange={(e) => setImprovementsAndTraining(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:border-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Decision Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              ความเห็นในการจ้างต่อ:
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="admin_recommendation"
                  checked={recommendationDecision === 'continue'}
                  onChange={() => setRecommendationDecision('continue')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-emerald-800">เห็นควรให้จ้างต่อ</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="admin_recommendation"
                  checked={recommendationDecision === 'terminate'}
                  onChange={() => setRecommendationDecision('terminate')}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold text-rose-800">เห็นควรให้ยุติการจ้าง</span>
              </label>
            </div>

            {recommendationDecision === 'terminate' && (
              <input
                type="text"
                placeholder="ระบุเหตุผลในการยุติการจ้าง..."
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-rose-300 rounded-xl focus:border-rose-600 outline-none mt-2"
              />
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>ลบผลการประเมินนี้</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขคะแนน'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Alert Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  ยืนยันการลบผลการประเมิน?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  คุณต้องการลบผลการประเมินของกรรมการ <span className="font-bold text-slate-900">{submission.evaluatorName}</span> ที่ประเมินให้แก่ <span className="font-bold text-slate-900">{submission.evaluateeName}</span> ใช่หรือไม่?
                </p>
                <p className="text-[11px] text-rose-600 font-semibold pt-1">
                  เมื่อลบแล้ว สถานะของกรรมการท่านนี้จะกลับเป็น "รอประเมิน" และกรรมการสามารถเข้ามากรอกประเมินใหม่ได้
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition cursor-pointer"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
