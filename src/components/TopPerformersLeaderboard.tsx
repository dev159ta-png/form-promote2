import React, { useState } from 'react';
import { AggregatedResult, GradeThreshold } from '../types';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  ChevronRight,
  TrendingUp,
  Star,
  FileText,
  Users,
  GraduationCap,
  Briefcase,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getGradeInfo } from '../utils/evaluationCalculator';

interface TopPerformersLeaderboardProps {
  aggregatedResults: AggregatedResult[];
  gradeThresholds: GradeThreshold[];
  onOpenReport: (result: AggregatedResult) => void;
}

export const TopPerformersLeaderboard: React.FC<TopPerformersLeaderboardProps> = ({
  aggregatedResults,
  gradeThresholds,
  onOpenReport,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'teacher' | 'support' | 'gov_teacher'>('all');
  const [showAllTeacher, setShowAllTeacher] = useState(false);
  const [showAllSupport, setShowAllSupport] = useState(false);
  const [showAllGov, setShowAllGov] = useState(false);

  // Group 1: ครูผู้ช่วย
  const teacherResults = aggregatedResults
    .filter(
      (r) =>
        r.evaluatee.positionGroup === 'teacher_assistant' ||
        (r.evaluatee.position.includes('ครูผู้ช่วย') && !r.evaluatee.position.includes('พนักงานราชการ'))
    )
    .sort((a, b) => b.meanPercentage - a.meanPercentage);

  // Group 2: จ้างเหมาบริการทุกตำแหน่ง
  const supportResults = aggregatedResults
    .filter(
      (r) =>
        r.evaluatee.positionGroup === 'support_staff' ||
        (!r.evaluatee.position.includes('ครูผู้ช่วย') &&
          !r.evaluatee.position.includes('พนักงานราชการ') &&
          r.evaluatee.positionGroup !== 'teacher_assistant' &&
          r.evaluatee.positionGroup !== 'government_employee_teacher')
    )
    .sort((a, b) => b.meanPercentage - a.meanPercentage);

  // Group 3: พนักงานราชการทั่วไป ตำแหน่ง ครูผู้สอน
  const govTeacherResults = aggregatedResults
    .filter(
      (r) =>
        r.evaluatee.positionGroup === 'government_employee_teacher' ||
        r.evaluatee.position.includes('พนักงานราชการ') ||
        (r.evaluatee.position.includes('ครูผู้สอน') && !r.evaluatee.position.includes('ครูผู้ช่วย'))
    )
    .sort((a, b) => b.meanPercentage - a.meanPercentage);

  // Stats for Group 1
  const teacherMaxScore = teacherResults.length > 0 ? teacherResults[0].meanPercentage : 0;
  const teacherAvgScore =
    teacherResults.length > 0
      ? teacherResults.reduce((acc, curr) => acc + curr.meanPercentage, 0) / teacherResults.length
      : 0;

  // Stats for Group 2
  const supportMaxScore = supportResults.length > 0 ? supportResults[0].meanPercentage : 0;
  const supportAvgScore =
    supportResults.length > 0
      ? supportResults.reduce((acc, curr) => acc + curr.meanPercentage, 0) / supportResults.length
      : 0;

  // Stats for Group 3
  const govMaxScore = govTeacherResults.length > 0 ? govTeacherResults[0].meanPercentage : 0;
  const govAvgScore =
    govTeacherResults.length > 0
      ? govTeacherResults.reduce((acc, curr) => acc + curr.meanPercentage, 0) / govTeacherResults.length
      : 0;

  // Helper for rank badge
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-xs flex items-center justify-center shadow-md shadow-amber-500/30 border-2 border-white ring-2 ring-amber-300">
          <Crown className="w-4 h-4 text-amber-900 fill-amber-900" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-300 via-slate-200 to-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center shadow-md border-2 border-white ring-2 ring-slate-300">
          <span className="font-extrabold text-slate-700">2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-md border-2 border-white ring-2 ring-amber-600">
          <span className="font-extrabold text-amber-100">3</span>
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">
        {rank}
      </div>
    );
  };

  // Render a podium card (Top 1 / Top 2 / Top 3)
  const renderPodiumItem = (
    result: AggregatedResult,
    rank: number,
    colorScheme: 'gold' | 'silver' | 'bronze'
  ) => {
    const gradeInfo = getGradeInfo(result.finalGrade, gradeThresholds);
    
    const bgStyles = {
      gold: 'bg-gradient-to-b from-amber-50 via-white to-amber-50/30 border-amber-300/80 shadow-md ring-1 ring-amber-400/30',
      silver: 'bg-gradient-to-b from-slate-50 via-white to-slate-50/30 border-slate-300 shadow-xs',
      bronze: 'bg-gradient-to-b from-amber-900/5 via-white to-amber-900/5 border-amber-700/30 shadow-xs',
    }[colorScheme];

    const rankLabel = {
      gold: 'อันดับที่ 1 (คะแนนสูงสุด)',
      silver: 'อันดับที่ 2',
      bronze: 'อันดับที่ 3',
    }[colorScheme];

    const scoreColor = {
      gold: 'text-amber-700',
      silver: 'text-slate-700',
      bronze: 'text-amber-800',
    }[colorScheme];

    return (
      <div
        key={result.evaluateeId}
        className={`rounded-2xl p-4 border transition hover:shadow-md relative overflow-hidden flex flex-col justify-between ${bgStyles}`}
      >
        {/* Top Header with Rank Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {renderRankBadge(rank)}
            <div>
              <span className="text-[11px] font-bold text-slate-700 block leading-tight">
                {rankLabel}
              </span>
              <span className="text-[10px] text-slate-400">
                กรรมการ {result.submittedCommitteeCount}/{result.totalCommitteeCount} ท่าน
              </span>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${gradeInfo.badgeBg}`}
          >
            {result.finalGrade}
          </span>
        </div>

        {/* Candidate Info */}
        <div className="space-y-1 my-2">
          <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
            {result.evaluatee.name}
          </div>
          <div className="text-xs text-blue-700 font-medium line-clamp-1">
            {result.evaluatee.position}
          </div>
          <div className="text-[11px] text-slate-400 line-clamp-1">
            {result.evaluatee.department}
          </div>
        </div>

        {/* Score & Action Button */}
        <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between gap-2 mt-auto">
          <div>
            <span className="text-[10px] text-slate-500 block">คะแนนเฉลี่ยร้อยละ</span>
            <div className={`text-base sm:text-lg font-black ${scoreColor}`}>
              {result.meanPercentage.toFixed(2)}%
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenReport(result)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-blue-700 text-xs font-semibold shadow-2xs border border-slate-200 transition cursor-pointer"
            title="ดูรายงานผลการประเมิน"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>รายงาน</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Trophy className="w-6 h-6 text-amber-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                อันดับคะแนนสูงสุดจำแนกตามกลุ่มตำแหน่ง (Top Performance Leaderboards)
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-500" />
                ก.พ.ร. มาตรฐาน
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              จัดอันดับผู้มีผลการปฏิบัติงานยอดเยี่ยมประจำรอบประเมิน แยกกลุ่มครูผู้ช่วย และ 12 สายสนับสนุน
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-semibold self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            แสดงทั้ง 3 กลุ่ม
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'teacher'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กลุ่ม 1: ครูผู้ช่วย
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'support'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กลุ่ม 2: จ้างเหมาบริการ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gov_teacher')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'gov_teacher'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            กลุ่ม 3: พนักงานราชการ ครูผู้สอน
          </button>
        </div>
      </div>

      {/* Main 3-Group Comparison Grid */}
      <div
        className={`grid gap-6 ${
          activeTab === 'all' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
        }`}
      >
        {/* ========================================================= */}
        {/* GROUP 1: ครูผู้ช่วย (Teacher Assistant)                    */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'teacher') && (
          <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 p-5 sm:p-6 flex flex-col justify-between space-y-5">
            {/* Group Title & Summary Stats */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">
                      กลุ่มที่ 1 : ตำแหน่ง ครูผู้ช่วย
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      ลูกจ้างชั่วคราว ({teacherResults.length} คน)
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  กลุ่มที่ 1
                </span>
              </div>

              {/* Group Quick Stats Pill */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 mb-5">
                <div className="text-center border-r border-slate-100 pr-2">
                  <span className="text-[10px] text-slate-500 block">คะแนนสูงสุด</span>
                  <span className="text-sm font-extrabold text-blue-700">
                    {teacherMaxScore.toFixed(2)}%
                  </span>
                </div>
                <div className="text-center pl-2">
                  <span className="text-[10px] text-slate-500 block">คะแนนเฉลี่ย</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {teacherAvgScore.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Podium Display (Top 3) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>อันดับคะแนนสูงสุด</span>
                  <span className="text-blue-600 text-[11px]">
                    Top {Math.min(3, teacherResults.length)}
                  </span>
                </div>

                {teacherResults.length > 0 ? (
                  <div className="space-y-2.5">
                    {teacherResults.slice(0, 3).map((res, idx) => {
                      const scheme = idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze';
                      return renderPodiumItem(res, idx + 1, scheme);
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                    ยังไม่มีข้อมูลผลการประเมิน
                  </div>
                )}
              </div>
            </div>

            {/* Toggle View More Button */}
            {teacherResults.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllTeacher(!showAllTeacher)}
                className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{showAllTeacher ? 'ย่อเหลือ Top 3' : `ดูทั้งหมด (${teacherResults.length} คน)`}</span>
                {showAllTeacher ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* GROUP 2: จ้างเหมาบริการทุกตำแหน่ง                          */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'support') && (
          <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 p-5 sm:p-6 flex flex-col justify-between space-y-5">
            {/* Group Title & Summary Stats */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">
                      กลุ่มที่ 2 : จ้างเหมาบริการทุกตำแหน่ง
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      12 สายงาน ({supportResults.length} คน)
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  กลุ่มที่ 2
                </span>
              </div>

              {/* Group Quick Stats Pill */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 mb-5">
                <div className="text-center border-r border-slate-100 pr-2">
                  <span className="text-[10px] text-slate-500 block">คะแนนสูงสุด</span>
                  <span className="text-sm font-extrabold text-emerald-700">
                    {supportMaxScore.toFixed(2)}%
                  </span>
                </div>
                <div className="text-center pl-2">
                  <span className="text-[10px] text-slate-500 block">คะแนนเฉลี่ย</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {supportAvgScore.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Podium Display (Top 3) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>อันดับคะแนนสูงสุด</span>
                  <span className="text-emerald-600 text-[11px]">
                    Top {Math.min(3, supportResults.length)}
                  </span>
                </div>

                {supportResults.length > 0 ? (
                  <div className="space-y-2.5">
                    {supportResults.slice(0, 3).map((res, idx) => {
                      const scheme = idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze';
                      return renderPodiumItem(res, idx + 1, scheme);
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                    ยังไม่มีข้อมูลผลการประเมิน
                  </div>
                )}
              </div>
            </div>

            {/* Toggle View More Button */}
            {supportResults.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllSupport(!showAllSupport)}
                className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{showAllSupport ? 'ย่อเหลือ Top 3' : `ดูทั้งหมด (${supportResults.length} คน)`}</span>
                {showAllSupport ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* GROUP 3: พนักงานราชการทั่วไป ตำแหน่ง ครูผู้สอน            */}
        {/* ========================================================= */}
        {(activeTab === 'all' || activeTab === 'gov_teacher') && (
          <div className="rounded-3xl bg-slate-50/70 border border-slate-200/90 p-5 sm:p-6 flex flex-col justify-between space-y-5">
            {/* Group Title & Summary Stats */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900">
                      กลุ่มที่ 3 : พนักงานราชการ ครูผู้สอน
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      พนักงานราชการทั่วไป ({govTeacherResults.length} คน)
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  กลุ่มที่ 3
                </span>
              </div>

              {/* Group Quick Stats Pill */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 mb-5">
                <div className="text-center border-r border-slate-100 pr-2">
                  <span className="text-[10px] text-slate-500 block">คะแนนสูงสุด</span>
                  <span className="text-sm font-extrabold text-purple-700">
                    {govMaxScore.toFixed(2)}%
                  </span>
                </div>
                <div className="text-center pl-2">
                  <span className="text-[10px] text-slate-500 block">คะแนนเฉลี่ย</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {govAvgScore.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Podium Display (Top 3) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>อันดับคะแนนสูงสุด</span>
                  <span className="text-purple-600 text-[11px]">
                    Top {Math.min(3, govTeacherResults.length)}
                  </span>
                </div>

                {govTeacherResults.length > 0 ? (
                  <div className="space-y-2.5">
                    {govTeacherResults.slice(0, 3).map((res, idx) => {
                      const scheme = idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'bronze';
                      return renderPodiumItem(res, idx + 1, scheme);
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                    ยังไม่มีข้อมูลผลการประเมิน
                  </div>
                )}
              </div>
            </div>

            {/* Toggle View More Button */}
            {govTeacherResults.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllGov(!showAllGov)}
                className="w-full py-2 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-600 border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{showAllGov ? 'ย่อเหลือ Top 3' : `ดูทั้งหมด (${govTeacherResults.length} คน)`}</span>
                {showAllGov ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
