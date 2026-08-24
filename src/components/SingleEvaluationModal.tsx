import React, { useRef } from 'react';
import { EvaluationSubmission, GradeThreshold } from '../types';
import { useApp } from '../context/AppContext';
import {
  Printer,
  X,
  FileCheck,
  CheckCircle2,
  Calendar,
  Building,
  UserCheck,
  Award,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';
import { getGradeInfo } from '../utils/evaluationCalculator';

interface SingleEvaluationModalProps {
  submission: EvaluationSubmission | null;
  onClose: () => void;
  thresholds?: GradeThreshold[];
}

export const SingleEvaluationModal: React.FC<SingleEvaluationModalProps> = ({
  submission,
  onClose,
  thresholds,
}) => {
  const { systemSettings, formTemplates } = useApp();
  const printRef = useRef<HTMLDivElement | null>(null);

  if (!submission) return null;

  const form = formTemplates.find((f) => f.id === submission.formId) || formTemplates[0];
  const gradeInfo = getGradeInfo(submission.grade, thresholds);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (Hidden in Print) */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                ใบบันทึกผลการประเมินรายบุคคล (กรรมการรายท่าน)
              </h3>
              <p className="text-[11px] text-slate-300">
                ผู้ประเมิน: {submission.evaluatorName} ({submission.evaluatorPosition})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์ / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              ใบบันทึกคะแนนการประเมินการปฏิบัติงาน
            </h2>
            <p className="text-xs text-slate-600">
              {systemSettings.schoolName} • {systemSettings.evaluationRound} ประจำปีงบประมาณ {systemSettings.academicYear}
            </p>
            <div className="text-xs text-indigo-700 font-semibold pt-1">
              {submission.formTitle}
            </div>
          </div>

          {/* Candidate & Evaluator Meta Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                ข้อมูลผู้รับการประเมิน
              </div>
              <div>
                <span className="text-slate-500">ชื่อ-นามสกุล:</span>{' '}
                <span className="font-bold text-slate-900">{submission.evaluateeName}</span>
              </div>
              <div>
                <span className="text-slate-500">ตำแหน่ง:</span>{' '}
                <span className="font-medium text-slate-800">{submission.evaluateePosition}</span>
              </div>
              <div>
                <span className="text-slate-500">สังกัด/ฝ่าย:</span>{' '}
                <span className="text-slate-700">{submission.evaluateeDepartment}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">
                ข้อมูลคณะกรรมการผู้ประเมิน
              </div>
              <div>
                <span className="text-slate-500">กรรมการผู้ประเมิน:</span>{' '}
                <span className="font-bold text-indigo-700">{submission.evaluatorName}</span>
              </div>
              <div>
                <span className="text-slate-500">ตำแหน่ง:</span>{' '}
                <span className="text-slate-800">{submission.evaluatorPosition}</span>
              </div>
              <div>
                <span className="text-slate-500">วันที่ประเมิน:</span>{' '}
                <span className="text-slate-700">
                  {new Date(submission.submittedAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })} น.
                </span>
              </div>
            </div>
          </div>

          {/* Score Overview Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center">
              <div className="text-xs text-slate-500 font-medium">คะแนนรวมที่ได้</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {submission.totalScore}{' '}
                <span className="text-xs text-slate-400 font-normal">/ {submission.maxScore}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center">
              <div className="text-xs text-slate-500 font-medium">คิดเป็นร้อยละ (%)</div>
              <div className="text-2xl font-black text-blue-700 mt-1">
                {submission.percentage.toFixed(2)}%
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center flex flex-col items-center justify-center">
              <div className="text-xs text-slate-500 font-medium">ระดับผลการประเมิน</div>
              <div className={`mt-1 font-black text-xs px-3 py-1 rounded-full border shadow-2xs ${gradeInfo.badgeBg}`}>
                {submission.grade}
              </div>
            </div>
          </div>

          {/* Detailed Scores by Categories */}
          {form && form.categories && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                รายละเอียดคะแนนรายหมวด/ตัวชี้วัด
              </h4>
              <div className="space-y-3">
                {form.categories.map((cat, catIdx) => {
                  const catScore = submission.categoryScores?.[cat.id];
                  return (
                    <div
                      key={cat.id}
                      className="border border-slate-200 rounded-xl overflow-hidden text-xs"
                    >
                      <div className="bg-slate-100 p-2.5 font-bold text-slate-800 flex items-center justify-between">
                        <span>
                          {catIdx + 1}. {cat.name} (ค่าน้ำหนัก {cat.weightPercentage}%)
                        </span>
                        {catScore && (
                          <span className="font-mono text-blue-800">
                            {catScore.scored.toFixed(2)} / {catScore.max} ({catScore.percentage.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-slate-100">
                        {cat.indicators.map((ind, indIdx) => {
                          const indScore = submission.scores[ind.id] ?? 0;
                          return (
                            <div
                              key={ind.id}
                              className="p-2.5 px-3 flex items-center justify-between hover:bg-slate-50/50"
                            >
                              <div className="pr-4">
                                <span className="font-medium text-slate-700">
                                  {catIdx + 1}.{indIdx + 1} {ind.title}
                                </span>
                                {ind.description && (
                                  <p className="text-[11px] text-slate-400 mt-0.5">{ind.description}</p>
                                )}
                              </div>
                              <div className="font-bold text-indigo-700 shrink-0 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                {indScore} / {ind.weight} คะแนน
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments & Recommendations */}
          <div className="space-y-3 text-xs">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              ความคิดเห็นและข้อเสนอแนะของผู้ประเมิน
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                <div className="font-bold text-emerald-900">จุดเด่น / ผลงานที่โดดเด่น:</div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {submission.comments.strengths || submission.comments.assignedWorkAndSuccess || '-'}
                </p>
              </div>
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                <div className="font-bold text-amber-900">ข้อควรปรับปรุง / พัฒนา:</div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {submission.comments.improvements || submission.comments.improvementsAndTraining || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Signature Box */}
          <div className="pt-4 border-t border-slate-200 flex flex-col items-center justify-center text-xs">
            <div className="h-16 flex items-center justify-center mb-1">
              {submission.signatureDataUrl ? (
                <img
                  src={submission.signatureDataUrl}
                  alt={`Signature ${submission.evaluatorName}`}
                  className="max-h-14 object-contain"
                />
              ) : (
                <div className="italic text-slate-400 font-serif">(ลงนามระบบดิจิทัลอิเล็กทรอนิกส์)</div>
              )}
            </div>
            <div className="font-bold text-slate-900">({submission.evaluatorName})</div>
            <div className="text-[11px] text-slate-500">{submission.evaluatorPosition}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              วันที่ลงนาม: {new Date(submission.submittedAt).toLocaleDateString('th-TH')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
