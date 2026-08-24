import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  Calendar,
  History,
} from 'lucide-react';
import { exportToCSV, getGradeInfo } from '../utils/evaluationCalculator';
import { AggregatedResult } from '../types';

interface ReportsCenterViewProps {
  onOpenReport: (result: AggregatedResult) => void;
}

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({ onOpenReport }) => {
  const { aggregatedResults, auditLogs, gradeThresholds } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'audit'>('reports');

  const filteredResults = aggregatedResults.filter(
    (r) =>
      r.evaluatee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.evaluatee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.evaluatee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-700" />
            <h2 className="text-xl font-bold text-slate-900">
              ศูนย์รายงานและเอกสารผลการประเมิน (Reports &amp; Documentation)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            พิมพ์แบบรายงานทางการ (Official Gov Form) และบันทึกประวัติการตรวจสอบย้อนหลัง (Audit Log)
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportToCSV(aggregatedResults)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>ส่งออกสรุปภาพรวมทั้งหมด (Excel)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          เอกสารรายงานรายบุคคล ({aggregatedResults.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ประวัติการตรวจสอบ (Audit Trail: {auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Individual Evaluation Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Search Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้รับการประเมิน หรือ ตำแหน่ง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">
              พร้อมพิมพ์เอกสารรายงานราชการ A4 / PDF
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredResults.map((item) => {
              const gradeInfo = getGradeInfo(item.finalGrade, gradeThresholds);
              return (
                <div
                  key={item.evaluateeId}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {item.evaluatee.name}
                      </h4>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${gradeInfo.badgeBg}`}>
                        {item.finalGrade} ({item.meanPercentage.toFixed(2)}%)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      ตำแหน่ง: <span className="font-semibold text-blue-700">{item.evaluatee.position}</span> | 
                      กลุ่ม: {item.groupName}
                    </p>
                    <div className="text-[11px] text-slate-400">
                      กรรมการส่งคะแนนแล้ว: {item.submittedCommitteeCount} / {item.totalCommitteeCount} ท่าน
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenReport(item)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>เปิดดูแบบรายงานราชการ (Official PDF)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Security & Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>บันทึกความปลอดภัยและประวัติการลงคะแนน (Anti-Tampering Trail)</span>
            </h3>
            <span className="text-xs text-slate-400">ระบบบันทึกเวลาสากล ISO-8601</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-900 font-sans">{log.userName}</span>
                  </div>
                  <div className="text-slate-600 font-sans text-xs">{log.details}</div>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleString('th-TH')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
