import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Sparkles,
  Search,
  ArrowRight,
  TrendingUp,
  Award,
  Printer,
  ShieldCheck,
  LayoutGrid,
  List,
  UserCheck,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { exportToCSV, getGradeInfo } from '../utils/evaluationCalculator';
import { AggregatedResult } from '../types';
import { TopPerformersLeaderboard } from './TopPerformersLeaderboard';
import { EvaluateeCard } from './EvaluateeCard';
import { CandidateDetailModal } from './CandidateDetailModal';

interface DashboardProps {
  onOpenReport: (result: AggregatedResult) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenReport }) => {
  const {
    aggregatedResults,
    currentUser,
    committeeGroups,
    setActiveView,
    setSelectedEvaluateeId,
    setSelectedFormId,
    gradeThresholds,
    systemSettings,
  } = useApp();

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [quickFilter, setQuickFilter] = useState<'all' | 'my' | 'teacher' | 'support' | 'gov_teacher'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [aiExecutiveSummary, setAiExecutiveSummary] = useState<string | null>(null);
  const [selectedCandidateForDetails, setSelectedCandidateForDetails] = useState<AggregatedResult | null>(null);

  // Statistics calculation
  const totalEvaluatees = aggregatedResults.length;
  const fullyEvaluatedCount = aggregatedResults.filter((r) => r.isFullyEvaluated).length;
  const inProgressCount = aggregatedResults.filter(
    (r) => !r.isFullyEvaluated && r.submittedCommitteeCount > 0
  ).length;
  const pendingCount = aggregatedResults.filter((r) => r.submittedCommitteeCount === 0).length;

  // Counts for quick filter tabs (3 main groups)
  const myAssignedCount = aggregatedResults.filter((item) => {
    return committeeGroups.find((g) => g.id === item.groupId)?.evaluatorIds.includes(currentUser.id);
  }).length;

  const teacherCount = aggregatedResults.filter(
    (item) =>
      item.evaluatee.positionGroup === 'teacher_assistant' ||
      (item.evaluatee.position.includes('ครูผู้ช่วย') && !item.evaluatee.position.includes('พนักงานราชการ'))
  ).length;

  const govTeacherCount = aggregatedResults.filter(
    (item) =>
      item.evaluatee.positionGroup === 'government_employee_teacher' ||
      item.evaluatee.position.includes('พนักงานราชการ') ||
      (item.evaluatee.position.includes('ครูผู้สอน') && !item.evaluatee.position.includes('ครูผู้ช่วย'))
  ).length;

  const supportCount = aggregatedResults.filter(
    (item) =>
      item.evaluatee.positionGroup === 'support_staff' ||
      (!item.evaluatee.position.includes('ครูผู้ช่วย') &&
        !item.evaluatee.position.includes('พนักงานราชการ') &&
        item.evaluatee.positionGroup !== 'teacher_assistant' &&
        item.evaluatee.positionGroup !== 'government_employee_teacher')
  ).length;

  // Grade distributions for Pie Chart
  const gradeCounts: Record<string, number> = {};
  gradeThresholds.forEach((t) => {
    gradeCounts[t.level] = 0;
  });

  aggregatedResults
    .filter((r) => r.submittedCommitteeCount > 0)
    .forEach((r) => {
      gradeCounts[r.finalGrade] = (gradeCounts[r.finalGrade] || 0) + 1;
    });

  const gradeColors: Record<string, string> = {
    'ระดับดีเด่น': '#10b981',
    'ระดับดี': '#3b82f6',
    'ระดับปกติ': '#f59e0b',
    'งดจ้างต่อ': '#ef4444',
  };

  const pieData = gradeThresholds
    .map((t) => ({
      name: `${t.level} (${t.minScore}-${t.maxScore}%)`,
      shortName: t.level,
      count: gradeCounts[t.level] || 0,
      color: gradeColors[t.level] || '#64748b',
    }))
    .filter((d) => d.count > 0);

  // Department Average Scores for Bar Chart
  const deptMap: Record<string, { totalPct: number; count: number }> = {};
  aggregatedResults
    .filter((r) => r.submittedCommitteeCount > 0)
    .forEach((r) => {
      const dept = r.evaluatee.department.replace('กลุ่มงาน', '').replace('กลุ่มบริหาร', '').trim();
      if (!deptMap[dept]) {
        deptMap[dept] = { totalPct: 0, count: 0 };
      }
      deptMap[dept].totalPct += r.meanPercentage;
      deptMap[dept].count += 1;
    });

  const barData = Object.entries(deptMap).map(([dept, data]) => ({
    department: dept.length > 15 ? dept.substring(0, 14) + '...' : dept,
    avgScore: Number((data.totalPct / data.count).toFixed(2)),
  }));

  // Filtering
  const filteredResults = aggregatedResults.filter((item) => {
    // Search keyword
    const matchesSearch =
      item.evaluatee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.evaluatee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.evaluatee.department.toLowerCase().includes(searchTerm.toLowerCase());

    // Dropdown Group filter
    const matchesGroup = filterGroup === 'all' || item.groupId === filterGroup;

    // Dropdown Status filter
    let matchesStatus = true;
    if (filterStatus === 'completed') matchesStatus = item.isFullyEvaluated;
    if (filterStatus === 'in_progress')
      matchesStatus = !item.isFullyEvaluated && item.submittedCommitteeCount > 0;
    if (filterStatus === 'pending') matchesStatus = item.submittedCommitteeCount === 0;

    // Quick filter tab
    let matchesQuick = true;
    if (quickFilter === 'my') {
      matchesQuick =
        committeeGroups.find((g) => g.id === item.groupId)?.evaluatorIds.includes(currentUser.id) || false;
    } else if (quickFilter === 'teacher') {
      matchesQuick =
        item.evaluatee.positionGroup === 'teacher_assistant' ||
        (item.evaluatee.position.includes('ครูผู้ช่วย') && !item.evaluatee.position.includes('พนักงานราชการ'));
    } else if (quickFilter === 'gov_teacher') {
      matchesQuick =
        item.evaluatee.positionGroup === 'government_employee_teacher' ||
        item.evaluatee.position.includes('พนักงานราชการ') ||
        (item.evaluatee.position.includes('ครูผู้สอน') && !item.evaluatee.position.includes('ครูผู้ช่วย'));
    } else if (quickFilter === 'support') {
      matchesQuick =
        item.evaluatee.positionGroup === 'support_staff' ||
        (!item.evaluatee.position.includes('ครูผู้ช่วย') &&
          !item.evaluatee.position.includes('พนักงานราชการ') &&
          item.evaluatee.positionGroup !== 'teacher_assistant' &&
          item.evaluatee.positionGroup !== 'government_employee_teacher');
    }

    return matchesSearch && matchesGroup && matchesStatus && matchesQuick;
  });

  const handleStartEvaluate = (evaluateeId: string, formId: string) => {
    setSelectedEvaluateeId(evaluateeId);
    setSelectedFormId(formId);
    setActiveView('evaluate');
  };

  // AI Executive Summary Generator via /api/ai/executive-summary
  const generateAiExecutiveSummary = async () => {
    setIsGeneratingAiSummary(true);
    try {
      const response = await fetch('/api/ai/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryStats: {
            totalEvaluatees,
            fullyEvaluatedCount,
            inProgressCount,
            pendingCount,
            gradeCounts,
          },
          departmentStats: barData,
        }),
      });
      const data = await response.json();
      if (data.summary) {
        setAiExecutiveSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
      setAiExecutiveSummary(
        'ภาพรวมผลการประเมินการปฏิบัติงานบุคลากรในรอบนี้ดำเนินการได้อย่างมีประสิทธิภาพ กรรมการทุกท่านได้ลงคะแนนอย่างถี่ถ้วนตามเกณฑ์ตัวชี้วัด 5 ระดับ บุคลากรส่วนใหญ่อยู่ในระดับ ดีมาก ถึง ยอดเยี่ยม'
      );
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Top Banner / Welcome & Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-medium backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {systemSettings.evaluationRound} ประจำปีงบประมาณ {systemSettings.academicYear} • {systemSettings.schoolName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              ยินดีต้อนรับ, {currentUser.name}
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              ตำแหน่ง: <span className="font-semibold text-white">{currentUser.position}</span> | สังกัด: {currentUser.department}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="export-csv-btn"
              onClick={() => exportToCSV(aggregatedResults)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs sm:text-sm border border-white/20 transition cursor-pointer backdrop-blur-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>ส่งออก Excel (CSV)</span>
            </button>

            <button
              id="ai-summary-btn"
              onClick={generateAiExecutiveSummary}
              disabled={isGeneratingAiSummary}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isGeneratingAiSummary ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAiSummary ? 'AI กำลังวิเคราะห์...' : 'สร้างสรุปผู้บริหาร (AI)'}</span>
            </button>
          </div>
        </div>

        {/* AI Executive Summary Card (if generated) */}
        {aiExecutiveSummary && (
          <div className="mt-6 p-5 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-slate-100 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-bold">
                <Sparkles className="w-4 h-4" />
                <span>รายงานสรุปภาพรวมผู้บริหาร (Gemini AI Executive Analysis)</span>
              </div>
              <button
                onClick={() => setAiExecutiveSummary(null)}
                className="text-xs text-slate-300 hover:text-white"
              >
                ปิด
              </button>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-200">
              {aiExecutiveSummary}
            </p>
          </div>
        )}
      </div>

      {/* KPI Stats Cards (4 Primary Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalEvaluatees}</div>
            <div className="text-xs font-medium text-slate-500">ผู้รับการประเมินทั้งหมด</div>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{fullyEvaluatedCount}</div>
            <div className="text-xs font-medium text-slate-500">ประเมินเสร็จสมบูรณ์</div>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{inProgressCount}</div>
            <div className="text-xs font-medium text-slate-500">กำลังดำเนินการ (รอกรรมการ)</div>
          </div>
        </div>

        {/* Card 4: Pending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{pendingCount}</div>
            <div className="text-xs font-medium text-slate-500">ยังไม่ได้รับการประเมิน</div>
          </div>
        </div>
      </div>

      {/* Top Performers Leaderboard */}
      <TopPerformersLeaderboard
        aggregatedResults={aggregatedResults}
        gradeThresholds={gradeThresholds}
        onOpenReport={onOpenReport}
      />

      {/* Visual Analytics Section (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Donut Chart - Grade Distributions */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">สัดส่วนระดับผลการประเมิน</h3>
                <p className="text-xs text-slate-500">จำแนกตามเกณฑ์คะแนนเฉลี่ยคณะกรรมการ (4 ระดับตามแบบฟอร์ม)</p>
              </div>
              <Award className="w-5 h-5 text-blue-600" />
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${val} คน`, 'จำนวน']}
                      contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">ยังไม่มีข้อมูลการส่งผลประเมิน</div>
              )}
            </div>
          </div>

          {/* Legend Table */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate text-[11px] font-medium">
                  {item.name.split(' ')[0]}: {item.count} คน
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bar Chart - Average Scores by Department */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">คะแนนเฉลี่ยร้อยละแยกตามสายงาน (%)</h3>
              <p className="text-xs text-slate-500">วิเคราะห์เปรียบเทียบมาตรฐานผลการปฏิบัติงาน</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-56 w-full">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'คะแนนเฉลี่ย']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    }}
                  />
                  <Bar dataKey="avgScore" fill="#6366f1" radius={[6, 6, 0, 0]} name="คะแนนเฉลี่ย (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                ยังไม่มีข้อมูลคะแนนประเมิน
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Section: Card View (Default) & Table View with Switcher */}
      <div className="space-y-4">
        {/* Section Header & Toolbar Controls */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  รายชื่อผู้รับการประเมินรายบุคคล (Individual Candidates)
                </h3>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {filteredResults.length} คน
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                แสดงข้อมูลผู้รับการประเมินในรูปแบบการ์ด พร้อมสถานะการประเมินของคณะกรรมการ
              </p>
            </div>

            {/* View Switcher Buttons (Card vs Table) */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'card'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="แสดงในรูปแบบการ์ด (Card View)"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>มุมมองการ์ด</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="แสดงในรูปแบบตาราง (Table View)"
                >
                  <List className="w-4 h-4" />
                  <span>มุมมองตาราง</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filter Tabs + Search Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Quick Filter Segmented Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuickFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  quickFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                ทั้งหมด ({totalEvaluatees})
              </button>

              <button
                type="button"
                onClick={() => setQuickFilter('my')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  quickFilter === 'my'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>ของฉัน ({myAssignedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickFilter('teacher')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  quickFilter === 'teacher'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                }`}
                title="กลุ่มที่ 1 : ตำแหน่ง ครูผู้ช่วย (ลูกจ้างชั่วคราว)"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>กลุ่ม 1: ครูผู้ช่วย ({teacherCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickFilter('support')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  quickFilter === 'support'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
                title="กลุ่มที่ 2 : จ้างเหมาบริการทุกตำแหน่ง"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>กลุ่ม 2: จ้างเหมาบริการ ({supportCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickFilter('gov_teacher')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  quickFilter === 'gov_teacher'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
                }`}
                title="กลุ่มที่ 3 : พนักงานราชการทั่วไป ตำแหน่ง ครูผู้สอน"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>กลุ่ม 3: พนักงานราชการ ครูผู้สอน ({govTeacherCount})</span>
              </button>
            </div>

            {/* Dropdown Filters & Search */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, ตำแหน่ง, ฝ่าย..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-44 sm:w-56"
                />
              </div>

              {/* Group Dropdown */}
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="py-1.5 px-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">ทุกกลุ่มกรรมการ</option>
                {committeeGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              {/* Status Dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="py-1.5 px-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="completed">ประเมินครบแล้ว</option>
                <option value="in_progress">กำลังดำเนินการ</option>
                <option value="pending">รอการประเมิน</option>
              </select>
            </div>
          </div>
        </div>

        {/* 1. CARD VIEW (Default View - Matching User's Design Example) */}
        {viewMode === 'card' && (
          <div>
            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredResults.map((item) => {
                  const isUserAssigned =
                    committeeGroups
                      .find((g) => g.id === item.groupId)
                      ?.evaluatorIds.includes(currentUser.id) || false;
                  const hasUserEvaluated = item.submissions.some(
                    (s) => s.evaluatorId === currentUser.id
                  );

                  return (
                    <EvaluateeCard
                      key={item.evaluateeId}
                      item={item}
                      currentUser={currentUser}
                      gradeThresholds={gradeThresholds}
                      evaluationRound={systemSettings.evaluationRound}
                      academicYear={systemSettings.academicYear}
                      isUserAssigned={isUserAssigned}
                      hasUserEvaluated={hasUserEvaluated}
                      onEvaluate={handleStartEvaluate}
                      onOpenReport={onOpenReport}
                      onOpenDetails={setSelectedCandidateForDetails}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  ไม่พบข้อมูลผู้รับการประเมิน
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  ไม่พบรายชื่อผู้รับการประเมินที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือก
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterGroup('all');
                    setFilterStatus('all');
                    setQuickFilter('all');
                  }}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. TABLE VIEW (Alternate View) */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">ผู้รับการประเมิน / ตำแหน่ง</th>
                    <th className="px-5 py-3.5">กลุ่มคณะกรรมการ</th>
                    <th className="px-5 py-3.5 text-center">ความคืบหน้ากรรมการ</th>
                    <th className="px-5 py-3.5 text-right">คะแนนเฉลี่ย</th>
                    <th className="px-5 py-3.5 text-center">ระดับผลการประเมิน</th>
                    <th className="px-5 py-3.5 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((item) => {
                      const gradeInfo = getGradeInfo(item.finalGrade, gradeThresholds);
                      const isUserInGroup = committeeGroups
                        .find((g) => g.id === item.groupId)
                        ?.evaluatorIds.includes(currentUser.id);
                      const hasUserEvaluated = item.submissions.some(
                        (s) => s.evaluatorId === currentUser.id
                      );

                      return (
                        <tr key={item.evaluateeId} className="hover:bg-slate-50/70 transition">
                          {/* Evaluatee Name & Position */}
                          <td
                            className="px-5 py-4 cursor-pointer group/row"
                            onClick={() => setSelectedCandidateForDetails(item)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 group-hover/row:text-teal-700 transition">
                                {item.evaluatee.name}
                              </span>
                              {isUserInGroup && (
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                  ของฉัน
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-indigo-700 font-medium">{item.evaluatee.position}</div>
                            <div className="text-[11px] text-slate-400">{item.evaluatee.department}</div>
                          </td>

                          {/* Committee Group */}
                          <td className="px-5 py-4">
                            <div className="text-xs font-semibold text-slate-800">{item.groupName}</div>
                            <div className="text-[11px] text-slate-500">
                              กรรมการทั้งหมด {item.totalCommitteeCount} ท่าน
                            </div>
                          </td>

                          {/* Progress Tracker (e.g. 2/3 คน) */}
                          <td className="px-5 py-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                                  item.isFullyEvaluated
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : item.submittedCommitteeCount > 0
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}
                              >
                                ประเมินแล้ว {item.submittedCommitteeCount}/{item.totalCommitteeCount} คน
                              </span>
                              {/* Mini Progress Bar */}
                              <div className="w-20 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                                <div
                                  className={`h-full ${
                                    item.isFullyEvaluated
                                      ? 'bg-emerald-500'
                                      : item.submittedCommitteeCount > 0
                                      ? 'bg-amber-500'
                                      : 'bg-slate-300'
                                  }`}
                                  style={{
                                    width: `${
                                      item.totalCommitteeCount > 0
                                        ? (item.submittedCommitteeCount / item.totalCommitteeCount) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Mean Score & Percentage */}
                          <td className="px-5 py-4 text-right">
                            {item.submittedCommitteeCount > 0 ? (
                              <div>
                                <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                                  {item.meanPercentage.toFixed(2)}%
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  (เฉลี่ย {item.meanScore.toFixed(2)} / {item.maxScore})
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>

                          {/* 5-Level Grading Threshold */}
                          <td className="px-5 py-4 text-center">
                            {item.submittedCommitteeCount > 0 ? (
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${gradeInfo.badgeBg}`}
                              >
                                {item.finalGrade}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                รอประเมิน
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Details Modal Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedCandidateForDetails(item)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                                title="ดูรายละเอียดคณะกรรมการ (ประเมินแล้ว/รอประเมิน)"
                              >
                                <Users className="w-3.5 h-3.5 text-slate-600" />
                              </button>

                              {/* Evaluate Action Button */}
                              <button
                                type="button"
                                onClick={() => handleStartEvaluate(item.evaluateeId, item.formId)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                  hasUserEvaluated
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                }`}
                                title={hasUserEvaluated ? 'แก้ไขการลงคะแนนของคุณ' : 'ทำการประเมิน'}
                              >
                                <span>{hasUserEvaluated ? 'แก้ไขคะแนน' : 'ประเมิน'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>

                              {/* View Official Report Modal */}
                              {item.submittedCommitteeCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onOpenReport(item)}
                                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                                  title="เปิดดูแบบรายงานผลทางการ (Official Gov Report)"
                                >
                                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        ไม่พบข้อมูลผู้รับการประเมินที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                แสดงทั้งหมด <span className="font-bold text-slate-800">{filteredResults.length}</span> จาก{' '}
                <span className="font-bold text-slate-800">{aggregatedResults.length}</span> รายการ
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  เกณฑ์ประเมินตามแบบฟอร์ม: งดจ้างต่อ (&lt;60%) | ระดับปกติ (60-69.99%) | ระดับดี (70-89.99%) | ระดับดีเด่น (90-100%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Drill-down Details Modal (Requirement 2 & Image 2) */}
      {selectedCandidateForDetails && (
        <CandidateDetailModal
          item={selectedCandidateForDetails}
          onClose={() => setSelectedCandidateForDetails(null)}
          onOpenSummaryReport={onOpenReport}
          onEvaluate={handleStartEvaluate}
          gradeThresholds={gradeThresholds}
        />
      )}
    </div>
  );
};
