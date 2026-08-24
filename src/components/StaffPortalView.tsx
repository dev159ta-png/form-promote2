import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  UserCheck,
  Printer,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { AggregatedResult } from '../types';

interface StaffPortalViewProps {
  onOpenReport: (result: AggregatedResult) => void;
}

export const StaffPortalView: React.FC<StaffPortalViewProps> = ({ onOpenReport }) => {
  const { currentUser, aggregatedResults, submissions, committeeGroups } = useApp();

  // Find result for current user
  const myResult = aggregatedResults.find((r) => r.evaluatee.id === currentUser.id);
  const mySubmissions = submissions.filter((s) => s.evaluateeId === currentUser.id);
  const myGroup = committeeGroups.find((g) => g.assignedEvaluateeIds.includes(currentUser.id));

  const totalEvaluatorsCount = myGroup?.evaluatorIds.length || 3;
  const isCompleted = mySubmissions.length >= totalEvaluatorsCount;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl text-amber-300 shadow-inner overflow-hidden shrink-0">
              {(currentUser.avatar || currentUser.avatarUrl) ? (
                <img src={currentUser.avatar || currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-300/30 px-2 py-0.5 rounded-full">
                  {currentUser.employeeCode || 'STAFF'}
                </span>
                <span className="text-xs text-blue-200">ระบบรายงานผลการประเมินส่วนบุคคล</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
                ยินดีต้อนรับ, {currentUser.name}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 mt-0.5">
                {currentUser.position} • {currentUser.department}
              </p>
            </div>
          </div>

          {/* Quick Print Official Report Button */}
          {myResult && (
            <button
              type="button"
              onClick={() => onOpenReport(myResult)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4 text-blue-700" />
              <span>พิมพ์แบบสรุปผลการประเมิน (ก.พ.ร.)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Score Overview Cards */}
      {myResult ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* 1. Grade Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ระดับผลการประเมิน
              </span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="my-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {myResult.gradeLevel}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {myResult.gradeLevel === 'งดจ้างต่อ' ? 'ไม่ผ่านเกณฑ์การประเมิน' : 'ผ่านเกณฑ์การพิจารณาจ้างต่อสัญญา'}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">ผลการตัดสิน</span>
              <span className={`font-bold px-2.5 py-1 rounded-full ${
                myResult.gradeLevel === 'งดจ้างต่อ'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {myResult.gradeLevel === 'งดจ้างต่อ' ? 'งดจ้างต่อ' : 'สมควรจ้างต่อ'}
              </span>
            </div>
          </div>

          {/* 2. Score Percentage Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                คะแนนเฉลี่ยรวม (100 คะแนน)
              </span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="my-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-700">
                {myResult.overallPercentage.toFixed(2)}%
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(myResult.overallPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>คะแนนเฉลี่ย</span>
              <span className="font-bold text-slate-800">{myResult.averageScore.toFixed(2)} / 100 คะแนน</span>
            </div>
          </div>

          {/* 3. Progress / Status Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                สถานะคณะกรรมการ
              </span>
              <UserCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="my-4">
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                {mySubmissions.length} / {totalEvaluatorsCount} ท่าน
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isCompleted ? 'คณะกรรมการประเมินครบถ้วนแล้ว' : 'อยู่ระหว่างรอการประเมินจากกรรมการ'}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">สถานะฟอร์ม</span>
              <span className={`font-bold px-2.5 py-1 rounded-full ${
                isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isCompleted ? 'ประเมินเสร็จสมบูรณ์' : 'กำลังดำเนินการ'}
              </span>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">อยู่ระหว่างรอบการประเมินผล</h3>
          <p className="text-xs text-slate-400 mt-1">ยังไม่มีผลคะแนนที่ได้รับการบันทึกในรอบนี้</p>
        </div>
      )}

      {/* Committee Evaluations Details */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              รายละเอียดผลการประเมินจากคณะกรรมการ
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {myGroup?.name || 'คณะกรรมการชุดที่รับผิดชอบ'}
            </p>
          </div>
        </div>

        {mySubmissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mySubmissions.map((sub, idx) => (
              <div
                key={sub.id}
                className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                    กรรมการท่านที่ {idx + 1}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(sub.submittedAt).toLocaleDateString('th-TH')}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{sub.evaluatorName}</h4>
                  <p className="text-[11px] text-slate-500">{sub.evaluatorPosition}</p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">คะแนนรวม</span>
                  <span className="text-base font-bold text-blue-700">
                    {sub.percentage.toFixed(1)}% ({sub.grade})
                  </span>
                </div>

                {sub.feedbackComments && (
                  <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                      <MessageSquare className="w-3 h-3 text-blue-600" />
                      <span>ข้อคิดเห็น/ข้อเสนอแนะ:</span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      "{sub.feedbackComments}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            ยังไม่มีคณะกรรมการส่งผลการประเมินในขณะนี้
          </div>
        )}
      </div>

    </div>
  );
};
