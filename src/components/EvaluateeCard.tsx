import React from 'react';
import {
  GraduationCap,
  Calendar,
  Users,
  Printer,
  CheckCircle2,
  Clock,
  Award,
  UserCheck,
  Tag,
  BookOpen,
  Info,
  ClipboardCheck,
  Hourglass,
  ArrowRight,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import { AggregatedResult, GradeThreshold, User } from '../types';
import { getGradeInfo } from '../utils/evaluationCalculator';
import { useApp } from '../context/AppContext';

interface EvaluateeCardProps {
  item: AggregatedResult;
  currentUser: User;
  gradeThresholds: GradeThreshold[];
  evaluationRound?: string;
  academicYear?: string;
  isUserAssigned: boolean;
  hasUserEvaluated: boolean;
  onEvaluate: (evaluateeId: string, formId: string) => void;
  onOpenReport: (item: AggregatedResult) => void;
  onOpenDetails?: (item: AggregatedResult) => void;
}

export const EvaluateeCard: React.FC<EvaluateeCardProps> = ({
  item,
  currentUser,
  gradeThresholds,
  evaluationRound = 'รอบที่ 2',
  academicYear = '2569',
  isUserAssigned,
  hasUserEvaluated,
  onEvaluate,
  onOpenReport,
  onOpenDetails,
}) => {
  const { users, committeeGroups } = useApp();
  const {
    evaluatee,
    formTitle,
    groupName,
    submittedCommitteeCount,
    totalCommitteeCount,
    isFullyEvaluated,
    submissions,
  } = item;
  const gradeInfo = getGradeInfo(item.finalGrade, gradeThresholds);

  // Find committee group and evaluators
  const group = committeeGroups.find((g) => g.id === item.groupId);
  const groupEvaluators: User[] = (group?.evaluatorIds || [])
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is User => Boolean(u));

  // Percentage of committee completion
  const progressPercent =
    totalCommitteeCount > 0 ? (submittedCommitteeCount / totalCommitteeCount) * 100 : 0;

  // Format evaluation date
  const evaluationDateStr =
    submissions.length > 0
      ? new Date(submissions[0].submittedAt).toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'short',
          year: '2-digit',
        })
      : '14 ส.ค. 69';

  return (
    <div
      id={`evaluatee-card-${evaluatee.id}`}
      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-sky-300"
    >
      {/* 1. TOP GREEN / TEAL HEADER BANNER (Matching Image 1) */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-2.5 text-white flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium shadow-xs">
        <div className="flex items-center gap-3">
          {/* Committee Group Name */}
          <div className="flex items-center gap-1.5 font-bold">
            <Users className="w-3.5 h-3.5 text-emerald-200" />
            <span className="truncate max-w-[170px] sm:max-w-[200px]" title={groupName}>
              {groupName}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-emerald-100">
            <Calendar className="w-3.5 h-3.5 text-emerald-200" />
            <span>{evaluationDateStr}</span>
          </div>
        </div>

        {/* Academic Year Tag */}
        <div className="text-emerald-100 bg-black/15 px-2 py-0.5 rounded-full text-[10px]">
          ปีการศึกษา {academicYear} • ภาคเรียนที่ 1
        </div>
      </div>

      {/* 2. CARD BODY */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Candidate Info + Score Row (Clickable to open details modal) */}
        <div
          onClick={() => onOpenDetails && onOpenDetails(item)}
          className="flex items-start justify-between gap-3 cursor-pointer group/header"
        >
          {/* Candidate Avatar + Name + Tags */}
          <div className="flex items-start gap-3 min-w-0">
            {/* Avatar Circle */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0 overflow-hidden group-hover/header:scale-105 transition-transform">
              {(evaluatee.avatar || evaluatee.avatarUrl) ? (
                <img
                  src={evaluatee.avatar || evaluatee.avatarUrl}
                  alt={evaluatee.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                evaluatee.name.charAt(0)
              )}
            </div>

            {/* Name and Tags */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover/header:text-teal-700 transition truncate">
                  {evaluatee.name}
                </h4>
                {isUserAssigned && (
                  <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    <UserCheck className="w-2.5 h-2.5" />
                    <span>ของฉัน</span>
                  </span>
                )}
              </div>

              {/* Tags Row */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium truncate max-w-[140px]">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>{evaluatee.department}</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md font-medium truncate max-w-[150px]">
                  <GraduationCap className="w-3 h-3 text-teal-600" />
                  <span>{evaluatee.position.replace('ลูกจ้างชั่วคราว ตำแหน่ง', '').replace('ลูกจ้างจ้างเหมาบริการ ตำแหน่ง', '').trim()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Score Box (Image 1 Style) */}
          <div className="text-right shrink-0">
            {submittedCommitteeCount > 0 ? (
              <div className="bg-teal-50/80 border border-teal-100 rounded-2xl p-2 sm:px-3 text-center min-w-[85px]">
                <div className="text-base sm:text-lg font-black text-teal-800 leading-none">
                  {item.meanPercentage.toFixed(item.meanPercentage % 1 === 0 ? 0 : 2)}%
                </div>
                <div className="text-[10px] text-teal-600 font-bold mt-0.5">
                  {item.finalGrade}
                </div>
                <div className="text-[9px] text-slate-400">เฉลี่ย</div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 px-3 text-center min-w-[85px]">
                <div className="text-xs font-bold text-slate-600">รอประเมิน</div>
                <div className="text-[9px] text-slate-400 mt-0.5">ยังไม่มีคะแนน</div>
              </div>
            )}
          </div>
        </div>

        {/* 3. PROGRESS / SUMMARY SUB-BAR */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              ประเมินแล้ว {submittedCommitteeCount} จาก {totalCommitteeCount} ท่าน คะแนนรวม
            </span>
            <span className="font-mono text-slate-500 font-bold">
              {submittedCommitteeCount}/{totalCommitteeCount}
            </span>
          </div>

          {/* Horizontal Progress Track */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isFullyEvaluated
                  ? 'bg-emerald-500'
                  : submittedCommitteeCount > 0
                  ? 'bg-teal-500'
                  : 'bg-slate-300'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 4. COMMITTEE MEMBERS MINI CARDS (Requirement 1 & Image 1) */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>รายชื่อคณะกรรมการ</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (คลิกการ์ดเพื่อดูรายละเอียด)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {groupEvaluators.map((evaluator) => {
              const submission = submissions.find((s) => s.evaluatorId === evaluator.id);
              const isEvaluated = Boolean(submission);

              if (isEvaluated && submission) {
                return (
                  <div
                    key={evaluator.id}
                    onClick={() => onOpenDetails && onOpenDetails(item)}
                    className="p-2.5 rounded-xl bg-white border border-slate-200/90 border-l-4 border-l-teal-500 shadow-2xs hover:border-teal-400 transition cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Evaluator Avatar */}
                        <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
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
                        <span className="text-xs font-bold text-slate-800 truncate" title={evaluator.name}>
                          {evaluator.name}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {new Date(submission.submittedAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-500">ผลคะแนน</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-teal-700">
                          {submission.percentage.toFixed(1)}%
                        </span>
                        <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                          {submission.grade}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Waiting / Pending Evaluator Mini Card (Image 1)
              return (
                <div
                  key={evaluator.id}
                  onClick={() => onOpenDetails && onOpenDetails(item)}
                  className="p-2.5 rounded-xl bg-slate-50/70 border border-dashed border-amber-300 shadow-2xs hover:border-amber-400 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Evaluator Avatar Placeholder */}
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                        {(evaluator.avatar || evaluator.avatarUrl) ? (
                          <img
                            src={evaluator.avatar || evaluator.avatarUrl}
                            alt={evaluator.name}
                            className="w-full h-full object-cover grayscale opacity-70"
                          />
                        ) : (
                          evaluator.name.charAt(0)
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-700 truncate" title={evaluator.name}>
                        {evaluator.name}
                      </span>
                    </div>

                    <Hourglass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-200/50 text-[11px]">
                    <span className="text-slate-400 text-[10px]">ยังไม่บันทึก</span>
                    <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded text-[10px]">
                      รอประเมิน
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. CARD FOOTER ACTION BUTTONS (Image 1) */}
      <div className="border-t border-slate-100 p-3 sm:px-4 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2">
        {/* Left Side: Detail & Print Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Button 1: พิมพ์สรุปคะแนน (Green button with Print icon) */}
          <button
            type="button"
            onClick={() => onOpenReport(item)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            title="พิมพ์แบบสรุปผลการประเมินทางการ"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์สรุปคะแนน</span>
          </button>

          {/* Button 2: รายละเอียดแผน (Outline button with info icon) */}
          <button
            type="button"
            onClick={() => onOpenDetails && onOpenDetails(item)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="ดูรายละเอียดแผนและรายชื่อคณะกรรมการทั้งหมด"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>รายละเอียดแผน</span>
          </button>
        </div>

        {/* Right Side: Direct Evaluation Button (for Evaluator) */}
        {isUserAssigned && (
          <button
            type="button"
            onClick={() => onEvaluate(evaluatee.id, item.formId)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              hasUserEvaluated
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white'
            }`}
          >
            {hasUserEvaluated ? (
              <>
                <Edit3 className="w-3 h-3" />
                <span>แก้ไขคะแนน</span>
              </>
            ) : (
              <>
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>ประเมิน</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
