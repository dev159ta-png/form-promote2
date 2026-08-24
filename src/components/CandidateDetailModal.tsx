import React, { useState } from 'react';
import { AggregatedResult, GradeThreshold, User, EvaluationSubmission } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Printer,
  Calendar,
  BookOpen,
  Users,
  Bookmark,
  GraduationCap,
  Clock,
  CheckCircle2,
  Hourglass,
  Eye,
  Award,
  ChevronRight,
  Sparkles,
  Info,
  ShieldCheck,
  UserCheck,
  Edit3,
} from 'lucide-react';
import { getGradeInfo } from '../utils/evaluationCalculator';
import { SingleEvaluationModal } from './SingleEvaluationModal';

interface CandidateDetailModalProps {
  item: AggregatedResult | null;
  onClose: () => void;
  onOpenSummaryReport: (result: AggregatedResult) => void;
  onEvaluate: (evaluateeId: string, formId: string) => void;
  gradeThresholds: GradeThreshold[];
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  item,
  onClose,
  onOpenSummaryReport,
  onEvaluate,
  gradeThresholds,
}) => {
  const { users, committeeGroups, currentUser, systemSettings } = useApp();
  const [selectedSubmission, setSelectedSubmission] = useState<EvaluationSubmission | null>(null);

  if (!item) return null;

  const { evaluatee, submissions, submittedCommitteeCount, totalCommitteeCount, isFullyEvaluated } = item;
  const gradeInfo = getGradeInfo(item.finalGrade, gradeThresholds);

  // Find committee group
  const group = committeeGroups.find((g) => g.id === item.groupId) || committeeGroups[0];
  
  // List of all evaluators assigned in this committee group
  const groupEvaluators: User[] = (group?.evaluatorIds || [])
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => Boolean(u));

  // Progress percentage
  const progressPercent = totalCommitteeCount > 0 ? (submittedCommitteeCount / totalCommitteeCount) * 100 : 0;

  // Format date helper
  const evaluationDateStr = submissions.length > 0 
    ? new Date(submissions[0].submittedAt).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '19 สิงหาคม 2569';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
        <div className="bg-white rounded-3xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          
          {/* Top Title Bar with Close Button */}
          <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold tracking-wide">
                รายละเอียดแผนการประเมินผลการปฏิบัติงานรายบุคคล
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Container */}
          <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
            
            {/* Top Cyan / Blue Header Banner (Matching Image 2 Style) */}
            <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                {/* Candidate Info + Avatar */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center text-2xl font-bold shadow-inner shrink-0 overflow-hidden">
                    {(evaluatee.avatar || evaluatee.avatarUrl) ? (
                      <img src={evaluatee.avatar || evaluatee.avatarUrl} alt={evaluatee.name} className="w-full h-full object-cover" />
                    ) : (
                      evaluatee.name.charAt(0)
                    )}
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      {evaluatee.name}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-sky-100 font-medium">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-sky-200" />
                        <span>{evaluatee.department}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-200" />
                        <span>{evaluationDateStr}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Large Score Display Box (Image 2) */}
                <div className="bg-white/95 rounded-2xl p-3 sm:px-5 sm:py-3 text-center shadow-md min-w-[120px] shrink-0 self-stretch sm:self-auto flex sm:flex-col justify-between sm:justify-center items-center">
                  {submittedCommitteeCount > 0 ? (
                    <>
                      <div className="text-2xl sm:text-3xl font-black text-sky-700 leading-tight">
                        {item.meanPercentage.toFixed(item.meanPercentage % 1 === 0 ? 0 : 2)}%
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="inline-block bg-sky-100 text-sky-800 text-[11px] font-bold px-2 py-0.5 rounded-full mt-0.5">
                          {item.finalGrade}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium mt-0.5">คะแนนเฉลี่ย</span>
                      </div>
                    </>
                  ) : (
                    <div className="py-1">
                      <div className="text-sm font-bold text-slate-700">รอประเมิน</div>
                      <div className="text-[10px] text-slate-400">ยังไม่มีคะแนน</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar Section (Image 2) */}
              <div className="mt-5 pt-4 border-t border-white/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sky-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-200" />
                    <span>ความคืบหน้าการประเมิน</span>
                  </div>
                  <span className="font-mono text-white">
                    {submittedCommitteeCount}/{totalCommitteeCount} ท่าน
                  </span>
                </div>

                {/* Horizontal Progress Track */}
                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Action Button: Print Summary (Image 2) */}
              <div className="mt-4 pt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => onOpenSummaryReport(item)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 px-6 rounded-xl shadow-md transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์สรุปคะแนนคณะกรรมการ</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: ข้อมูลแผน / ข้อมูลการประเมิน (Image 2) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <div className="w-1 h-3.5 bg-blue-600 rounded-full" />
                <Info className="w-4 h-4 text-blue-600" />
                <span>ข้อมูลแผน</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. คณะกรรมการ */}
                <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400 font-medium">คณะกรรมการ</div>
                    <div className="text-xs font-bold text-slate-900 truncate" title={group?.name}>
                      {group?.name || 'คณะกรรมการประเมินผล'}
                    </div>
                  </div>
                </div>

                {/* 2. ปี/ภาคเรียน */}
                <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400 font-medium">ปี/ภาคเรียน</div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      ปีการศึกษา {systemSettings.academicYear} • ภาคเรียนที่ 1
                    </div>
                  </div>
                </div>

                {/* 3. ระดับชั้น / สังกัด */}
                <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400 font-medium">ระดับชั้น / ตำแหน่ง</div>
                    <div className="text-xs font-bold text-slate-900 truncate" title={evaluatee.position}>
                      {evaluatee.position.replace('ลูกจ้างชั่วคราว ตำแหน่ง', '').replace('ลูกจ้างจ้างเหมาบริการ ตำแหน่ง', '').trim()}
                    </div>
                  </div>
                </div>

                {/* 4. เวลา / รอบการประเมิน */}
                <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400 font-medium">เวลา / รอบการประเมิน</div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      09:30 - 16:30 น. (รอบที่ 2)
                    </div>
                  </div>
                </div>
              </div>

              {/* สถิติการมาทำงาน การลา และการมาสาย (7 รายการ) */}
              {evaluatee.leaveStats && (
                <div className="mt-4 p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-indigo-600 rounded-full" />
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>สถิติการมาทำงาน การลา และการมาสายในรอบการประเมิน (ข้อมูลจากผู้ดูแลระบบ)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                    {[
                      { label: 'มาสาย', val: evaluatee.leaveStats.late, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                      { label: 'ลาป่วย', val: evaluatee.leaveStats.sick, color: 'text-rose-700 bg-rose-50 border-rose-200' },
                      { label: 'ลากิจส่วนตัว', val: evaluatee.leaveStats.personal, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                      { label: 'ลาคลอดบุตร', val: evaluatee.leaveStats.maternity, color: 'text-purple-700 bg-purple-50 border-purple-200' },
                      { label: 'ลาอุปสมบท/ฮัจย์', val: evaluatee.leaveStats.ordinationOrHajj, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                      { label: 'ขาดราชการ', val: evaluatee.leaveStats.absent, color: 'text-red-700 bg-red-50 border-red-200' },
                      { label: 'อื่นๆ', val: evaluatee.leaveStats.other, color: 'text-slate-700 bg-slate-100 border-slate-200' },
                    ].map((st, i) => (
                      <div key={i} className={`p-2 rounded-xl border ${st.color}`}>
                        <div className="text-[10px] font-medium text-slate-500">{st.label}</div>
                        <div className="text-xs font-bold mt-0.5">
                          {st.val?.days || 0} วัน / {st.val?.times || 0} ครั้ง
                        </div>
                      </div>
                    ))}
                  </div>

                  {evaluatee.leaveStats.notes && (
                    <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700">หมายเหตุ:</span> {evaluatee.leaveStats.notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: คณะกรรมการการนิเทศ & การให้คะแนน (Image 2) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <div className="w-1 h-3.5 bg-blue-600 rounded-full" />
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>คณะกรรมการการประเมิน & การให้คะแนน</span>
                </div>
                <span className="text-xs text-slate-500">
                  ประเมินแล้ว {submittedCommitteeCount} จาก {totalCommitteeCount} ท่าน
                </span>
              </div>

              {/* Grid of Evaluator Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupEvaluators.map((evaluator) => {
                  // Check if this evaluator has submitted
                  const submission = submissions.find(
                    (s) => s.evaluatorId === evaluator.id
                  );
                  const isEvaluated = Boolean(submission);
                  const isCurrentLoggedUser = currentUser.id === evaluator.id;

                  if (isEvaluated && submission) {
                    const evalGradeInfo = getGradeInfo(submission.grade, gradeThresholds);
                    return (
                      <div
                        key={evaluator.id}
                        className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-sky-500 p-4 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Evaluator Avatar & Info */}
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-base font-bold shadow-2xs shrink-0 overflow-hidden">
                              {(evaluator.avatar || evaluator.avatarUrl) ? (
                                <img
                                  src={evaluator.avatar || evaluator.avatarUrl}
                                  alt={evaluator.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                evaluator.name.charAt(0)
                              )}
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                                {evaluator.name}
                              </h4>
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <CheckCircle2 className="w-3 h-3 text-sky-600 shrink-0" />
                                <span className="truncate max-w-[180px] sm:max-w-[220px]">
                                  {evaluator.position}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Score Percentage (Top Right) */}
                          <div className="text-right shrink-0">
                            <div className="text-base sm:text-lg font-black text-sky-600">
                              {submission.percentage.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        {/* Middle: Grade & Raw Score Tag */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 rounded-lg">
                            <span>{submission.grade}</span>
                            <span>•</span>
                            <span className="font-mono">
                              {submission.totalScore}/{submission.maxScore}
                            </span>
                          </span>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(submission.submittedAt).toLocaleDateString('th-TH')}
                          </span>
                        </div>

                        {/* Action Buttons: View & Print (Image 2) */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSubmission(submission)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                              title="ดูรายละเอียดใบบันทึกคะแนน"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>ดู</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedSubmission(submission)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                              title="พิมพ์ใบคะแนนกรรมการ"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              <span>พิมพ์</span>
                            </button>
                          </div>

                          {isCurrentLoggedUser && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onEvaluate(evaluatee.id, item.formId);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>แก้ไข</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Pending Evaluator Card (Image 2)
                  return (
                    <div
                      key={evaluator.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Evaluator Avatar & Info */}
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-base font-bold shadow-2xs shrink-0 overflow-hidden">
                            {evaluator.avatarUrl ? (
                              <img
                                src={evaluator.avatarUrl}
                                alt={evaluator.name}
                                className="w-full h-full object-cover grayscale opacity-80"
                              />
                            ) : (
                              evaluator.name.charAt(0)
                            )}
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                              {evaluator.name}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <span className="truncate max-w-[180px] sm:max-w-[220px]">
                                {evaluator.position}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top-Right: Amber Hourglass Icon */}
                        <div className="shrink-0 text-amber-500 p-1">
                          <Hourglass className="w-5 h-5 text-amber-400" />
                        </div>
                      </div>

                      {/* Status Badges: รอประเมิน & ยังไม่บันทึก (Image 2) */}
                      <div className="space-y-1 pt-1">
                        <div>
                          <span className="inline-flex items-center text-xs font-bold text-amber-900 bg-amber-100/90 px-3 py-1 rounded-lg">
                            รอประเมิน
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">ยังไม่บันทึก</div>
                      </div>

                      {/* Evaluator Direct Action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 italic">
                          {isCurrentLoggedUser ? 'คุณเป็นกรรมการชุดนี้' : 'รอกรรมการลงคะแนน'}
                        </span>

                        {isCurrentLoggedUser && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEvaluate(evaluatee.id, item.formId);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            <span>ประเมินตอนนี้</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Evaluator Score Sheet Modal */}
      {selectedSubmission && (
        <SingleEvaluationModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          thresholds={gradeThresholds}
        />
      )}
    </>
  );
};
