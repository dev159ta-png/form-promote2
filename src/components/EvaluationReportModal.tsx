import React, { useRef } from 'react';
import { AggregatedResult, GradeThreshold } from '../types';
import { useApp } from '../context/AppContext';
import {
  Printer,
  Download,
  CheckCircle2,
  Award,
  ShieldCheck,
  FileText,
  Building2,
  Calendar,
  X,
} from 'lucide-react';
import { getGradeInfo } from '../utils/evaluationCalculator';

interface EvaluationReportModalProps {
  result: AggregatedResult | null;
  onClose: () => void;
  thresholds?: GradeThreshold[];
}

export const EvaluationReportModal: React.FC<EvaluationReportModalProps> = ({
  result,
  onClose,
  thresholds,
}) => {
  const { systemSettings } = useApp();
  const reportRef = useRef<HTMLDivElement | null>(null);

  if (!result) return null;

  const gradeInfo = getGradeInfo(result.finalGrade, thresholds);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocx = () => {
    // Generate text document export formatted cleanly
    const content = `
แบบรายงานสรุปผลการประเมินการปฏิบัติงาน (Official Evaluation Report)
${systemSettings.evaluationRound} ประจำปีงบประมาณ ${systemSettings.academicYear}
สถานศึกษา: ${systemSettings.schoolName} (${systemSettings.schoolAffiliation})

1. ข้อมูลผู้รับการประเมิน
- ชื่อ-นามสกุล: ${result.evaluatee.name}
- ตำแหน่ง: ${result.evaluatee.position}
- สังกัด/ฝ่าย: ${result.evaluatee.department}
- แบบประเมิน: ${result.formTitle}
- คณะกรรมการชุดที่ประเมิน: ${result.groupName}

2. สรุปผลการประเมินจากคณะกรรมการ (${result.submittedCommitteeCount}/${result.totalCommitteeCount} ท่าน)
- คะแนนเฉลี่ยรวม: ${result.meanScore.toFixed(2)} จาก ${result.maxScore} คะแนน
- คิดเป็นร้อยละเฉลี่ย: ${result.meanPercentage.toFixed(2)}%
- ระดับผลการประเมิน: ${result.finalGrade}

3. รายละเอียดคะแนนจากกรรมการแต่ละท่าน:
${result.submissions
  .map(
    (s, idx) =>
      `  กรรมการท่านที่ ${idx + 1}: ${s.evaluatorName} (${s.evaluatorPosition})
   - คะแนนที่ให้: ${s.totalScore}/${s.maxScore} (${s.percentage.toFixed(2)}%) [${s.grade}]
   - จุดเด่น: ${s.comments.strengths || '-'}
   - ข้อควรปรับปรุง: ${s.comments.improvements || '-'}
   - ลงชื่อวันที่: ${new Date(s.submittedAt).toLocaleDateString('th-TH')}`
  )
  .join('\n\n')}

4. การลงนามรับรองผล
รับรองว่าการประเมินเป็นไปตามเกณฑ์มาตรฐานและข้อบังคับของสถานศึกษาทุกประการ
    `;

    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานผลการประเมิน_${result.evaluatee.name}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Modal Toolbar (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base">
              แบบรายงานผลการประเมินการปฏิบัติงานรายบุคคล (Official Report)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสาร (Print / PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadDocx}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer border border-white/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด .DOC</span>
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

        {/* Printable Official Form Body */}
        <div
          ref={reportRef}
          className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-900 font-sans leading-normal bg-white"
        >
          {/* Official Document Header */}
          <div className="text-center space-y-2 border-b-2 border-slate-900 pb-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-white border border-slate-300 flex items-center justify-center font-serif text-slate-800 shadow-inner overflow-hidden p-1">
              {systemSettings.logoUrl ? (
                <img
                  src={systemSettings.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xl font-bold">ครุฑ</span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
              แบบสรุปผลการประเมินการปฏิบัติงานของลูกจ้างชั่วคราว
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              {systemSettings.evaluationRound} ประจำปีงบประมาณ {systemSettings.academicYear}
            </p>
            <div className="text-xs text-slate-600 font-medium">
              สถานศึกษา: {systemSettings.schoolName} ({systemSettings.schoolAffiliation})
            </div>
          </div>

          {/* Section 1: Candidate Information */}
          <div className="space-y-2 text-xs sm:text-sm">
            <h4 className="font-bold text-slate-900 bg-slate-100 p-2 rounded border border-slate-200">
              ตอนที่ 1: ข้อมูลของผู้รับการประเมิน
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
              <div>
                <span className="text-slate-500">ชื่อ-นามสกุล:</span>{' '}
                <span className="font-bold text-slate-900">{result.evaluatee.name}</span>
              </div>
              <div>
                <span className="text-slate-500">ตำแหน่ง:</span>{' '}
                <span className="font-bold text-blue-900">{result.evaluatee.position}</span>
              </div>
              <div>
                <span className="text-slate-500">ฝ่าย/กลุ่มงาน:</span>{' '}
                <span className="font-semibold text-slate-800">{result.evaluatee.department}</span>
              </div>
              <div>
                <span className="text-slate-500">ชุดคณะกรรมการผู้ประเมิน:</span>{' '}
                <span className="font-semibold text-slate-800">{result.groupName}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Aggregated Mean Scoring & 5-tier Threshold Result */}
          <div className="space-y-3 text-xs sm:text-sm">
            <h4 className="font-bold text-slate-900 bg-slate-100 p-2 rounded border border-slate-200">
              ตอนที่ 2: สรุปผลคะแนนรวมเฉลี่ยและการตัดเกณฑ์ระดับผลการประเมิน (Mean Scoring)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <div className="text-xs text-slate-500 font-medium">คะแนนเฉลี่ยรวม</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {result.meanScore.toFixed(2)}{' '}
                  <span className="text-xs text-slate-400 font-normal">/ {result.maxScore}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center">
                <div className="text-xs text-slate-500 font-medium">คิดเป็นร้อยละเฉลี่ย (%)</div>
                <div className="text-2xl font-black text-blue-700 mt-1">
                  {result.meanPercentage.toFixed(2)}%
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center flex flex-col items-center justify-center">
                <div className="text-xs text-slate-500 font-medium">ระดับผลการประเมิน (5 ระดับ)</div>
                <div className={`mt-1 font-black text-sm px-4 py-1 rounded-full border ${gradeInfo.badgeBg}`}>
                  {result.finalGrade}
                </div>
              </div>
            </div>

            {/* Threshold Criterion Reference */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-700">เกณฑ์การตัดระดับผลการประเมินตามแบบฟอร์ม:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                {(thresholds && thresholds.length > 0 ? thresholds : [
                  { level: 'ระดับดีเด่น', minScore: 90, maxScore: 100 },
                  { level: 'ระดับดี', minScore: 70, maxScore: 89.99 },
                  { level: 'ระดับปกติ', minScore: 60, maxScore: 69.99 },
                  { level: 'งดจ้างต่อ', minScore: 0, maxScore: 59.99 },
                ]).map((t) => (
                  <div key={t.level}>• {t.level} ({t.minScore.toFixed(2)} - {t.maxScore.toFixed(2)}%)</div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Itemized Breakdown from Each Committee Member */}
          <div className="space-y-2 text-xs sm:text-sm">
            <h4 className="font-bold text-slate-900 bg-slate-100 p-2 rounded border border-slate-200">
              ตอนที่ 3: รายละเอียดคะแนนและข้อคิดเห็นจากกรรมการรายบุคคล ({result.submissions.length} ท่าน)
            </h4>

            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {result.submissions.map((sub, idx) => (
                <div key={sub.id} className="p-4 bg-white space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-slate-900">
                      กรรมการท่านที่ {idx + 1}: {sub.evaluatorName} ({sub.evaluatorPosition})
                    </div>
                    <div className="font-mono text-blue-700 font-bold">
                      คะแนน: {sub.totalScore}/{sub.maxScore} ({sub.percentage.toFixed(2)}%) — ระดับ: {sub.grade}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded">
                    <div>
                      <span className="font-bold text-slate-800">จุดเด่น:</span> {sub.comments.strengths || '-'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">ข้อควรพัฒนา:</span> {sub.comments.improvements || '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Committee Signatures & Audit Seal */}
          <div className="space-y-3 pt-4 text-xs">
            <h4 className="font-bold text-slate-900 bg-slate-100 p-2 rounded border border-slate-200">
              ตอนที่ 4: การลงนามรับรองผลของคณะกรรมการประเมิน
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {result.submissions.map((sub, idx) => (
                <div
                  key={sub.id}
                  className="p-3 border border-slate-200 rounded-xl text-center flex flex-col items-center justify-between min-h-[160px] bg-slate-50/50"
                >
                  <div className="h-16 flex items-center justify-center">
                    {sub.signatureDataUrl ? (
                      <img
                        src={sub.signatureDataUrl}
                        alt={`Signature ${sub.evaluatorName}`}
                        className="max-h-14 object-contain"
                      />
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">(ลงนามดิจิทัล)</span>
                    )}
                  </div>
                  <div className="border-t border-slate-300 w-full pt-1.5">
                    <div className="font-bold text-slate-900 text-xs">({sub.evaluatorName})</div>
                    <div className="text-[10px] text-slate-500 truncate">{sub.evaluatorPosition}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                      {new Date(sub.submittedAt).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Approval Box */}
          <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-center">
            <div className="space-y-4">
              <div className="font-bold text-slate-800">ผู้รับการประเมินรับทราบผล</div>
              <div className="h-12 border-b border-dashed border-slate-400 w-48 mx-auto" />
              <div>
                <div>({result.evaluatee.name})</div>
                <div className="text-slate-500">วันที่ ......../......../............</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="font-bold text-slate-800">ผู้อำนวยการสถานศึกษา / ผู้มีอำนาจสั่งจ้าง</div>
              <div className="h-12 border-b border-dashed border-slate-400 w-48 mx-auto" />
              <div>
                <div>(นายปรัชญา สมณะช้างเผือก)</div>
                <div className="text-slate-500">ผู้อำนวยการโรงเรียนศึกษาพิเศษชัยนาท</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
