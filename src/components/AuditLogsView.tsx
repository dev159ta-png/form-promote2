import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  UserCheck,
  Key,
  LogIn,
  Layers,
  FileSpreadsheet,
  FileJson,
  ArrowRight,
  Info,
  Clock,
  Shield,
  UserX,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuditLog, AuditActionCategory, UserRole } from '../types';
import { generateAuditLogCsv, downloadCsvFile, downloadJsonFile } from '../utils/backupUtils';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, currentUser, clearAuditLogs, users } = useApp();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<AuditLog | null>(null);

  // Category Configuration
  const categories: { id: string; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'ALL', label: 'ทั้งหมด', icon: <Layers className="w-4 h-4" />, color: 'bg-slate-100 text-slate-700' },
    { id: 'PERMISSION', label: 'สิทธิ์และบทบาท (Permissions)', icon: <Key className="w-4 h-4" />, color: 'bg-amber-100 text-amber-800' },
    { id: 'AUTH', label: 'การเข้าสู่ระบบ (Authentication)', icon: <LogIn className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800' },
    { id: 'EVALUATION', label: 'การประเมินผล (Evaluations)', icon: <FileText className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-800' },
    { id: 'USER_MANAGEMENT', label: 'จัดการผู้ใช้ (Users)', icon: <UserCheck className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-800' },
    { id: 'BACKUP', label: 'สำรองและกู้คืน (Backups)', icon: <Shield className="w-4 h-4" />, color: 'bg-teal-100 text-teal-800' },
    { id: 'SYSTEM', label: 'ระบบ (System)', icon: <RefreshCw className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800' },
  ];

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: auditLogs.length };
    auditLogs.forEach((log) => {
      const cat = log.category || 'SYSTEM';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [auditLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      // Category filter
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }

      // Role filter
      if (selectedRole !== 'ALL' && log.userRole !== selectedRole) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && (log.status || 'SUCCESS') !== selectedStatus) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchAction = log.action.toLowerCase().includes(query);
        const matchDetails = log.details.toLowerCase().includes(query);
        const matchUser = log.userName.toLowerCase().includes(query);
        const matchTarget = log.targetUserName?.toLowerCase().includes(query) || false;
        return matchAction || matchDetails || matchUser || matchTarget;
      }

      return true;
    });
  }, [auditLogs, selectedCategory, selectedRole, selectedStatus, searchQuery]);

  const handleExportCsv = () => {
    const csvContent = generateAuditLogCsv(filteredLogs);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsvFile(csvContent, `ประวัติการใช้งานและสิทธิ์_${dateStr}.csv`);
  };

  const handleExportJson = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    downloadJsonFile(filteredLogs, `ประวัติการใช้งานและสิทธิ์_${dateStr}.json`);
  };

  const handleClearHistory = () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการใช้งานระบบทั้งหมด?')) {
      clearAuditLogs();
    }
  };

  const renderCategoryBadge = (cat?: AuditActionCategory) => {
    switch (cat) {
      case 'PERMISSION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Key className="w-3 h-3 text-amber-600" />
            <span>สิทธิ์และบทบาท</span>
          </span>
        );
      case 'AUTH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <LogIn className="w-3 h-3 text-blue-600" />
            <span>เข้าสู่ระบบ</span>
          </span>
        );
      case 'EVALUATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <FileText className="w-3 h-3 text-emerald-600" />
            <span>ประเมินผล</span>
          </span>
        );
      case 'USER_MANAGEMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <UserCheck className="w-3 h-3 text-indigo-600" />
            <span>จัดการผู้ใช้</span>
          </span>
        );
      case 'BACKUP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <Shield className="w-3 h-3 text-teal-600" />
            <span>สำรองข้อมูล</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>ระบบ</span>
          </span>
        );
    }
  };

  const renderRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            แอดมิน / ผู้บริหาร
          </span>
        );
      case 'evaluator':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            คณะกรรมการ
          </span>
        );
      case 'staff':
        return (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200">
            ผู้รับการประเมิน
          </span>
        );
      default:
        return <span className="text-[11px] text-slate-400">-</span>;
    }
  };

  return (
    <div id="audit-logs-view-container" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>บันทึกความมั่นคงปลอดภัย & การจัดการสิทธิ์ (Audit Trail)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              ประวัติการใช้งานและบันทึกสิทธิ์ผู้ใช้
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              เก็บบันทึกการเข้าสู่ระบบ, การเปลี่ยนสิทธิ์และบทบาท, การสลับตัวตน, การส่งผลคะแนนประเมิน,
              และการสำรองกู้คืน เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้ 100%
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-export-audit-csv"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>ส่งออก CSV (ภาษาไทย)</span>
            </button>
            <button
              id="btn-export-audit-json"
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all active:scale-95"
            >
              <FileJson className="w-4 h-4 text-indigo-400" />
              <span>ส่งออก JSON</span>
            </button>
            {currentUser?.role === 'admin' && (
              <button
                id="btn-clear-audit-logs"
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium text-xs border border-rose-500/30 transition-all active:scale-95"
                title="ล้างประวัติบันทึก"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างประวัติ</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-slate-400">บันทึกทั้งหมด</span>
            <p className="text-xl font-bold text-white mt-0.5">{auditLogs.length} รายการ</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-amber-400">การเปลี่ยนสิทธิ์และบทบาท</span>
            <p className="text-xl font-bold text-amber-300 mt-0.5">
              {categoryCounts['PERMISSION'] || 0} รายการ
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-blue-400">การเข้าสู่ระบบ & สลับสิทธิ์</span>
            <p className="text-xl font-bold text-blue-300 mt-0.5">
              {categoryCounts['AUTH'] || 0} รายการ
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-emerald-400">การประเมินและการสำรอง</span>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">
              {(categoryCounts['EVALUATION'] || 0) + (categoryCounts['BACKUP'] || 0)} รายการ
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
              <span
                className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {categoryCounts[cat.id] || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="input-search-audit"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อผู้ใช้, กิจกรรม, หรือรายละเอียด..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">บทบาท:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">ทุกลำดับสิทธิ์</option>
              <option value="admin">แอดมิน / ผู้บริหาร</option>
              <option value="evaluator">คณะกรรมการประเมิน</option>
              <option value="staff">ผู้รับการประเมิน</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">สถานะ:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">ทุกสถานะผลลัพธ์</option>
              <option value="SUCCESS">สำเร็จ (Success)</option>
              <option value="WARNING">แจ้งเตือน (Warning)</option>
              <option value="ERROR">ข้อผิดพลาด (Error)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-semibold text-slate-700">
            แสดง {filteredLogs.length} จาก {auditLogs.length} เหตุการณ์
          </span>
          <span className="text-[11px] text-slate-400">
            เรียงลำดับจากล่าสุดไปเก่าสุด (Real-time Audit Log)
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium text-slate-700">ไม่พบรายการบันทึกที่ตรงกับเงื่อนไข</p>
            <p className="text-xs text-slate-400">ลองล้างคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const isPermissionChange =
                log.category === 'PERMISSION' ||
                log.action.includes('ROLE') ||
                log.action.includes('PERMISSION');

              return (
                <div
                  key={log.id}
                  id={`audit-log-row-${log.id}`}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-start md:justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderCategoryBadge(log.category)}
                      <span className="font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      {log.status === 'WARNING' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span>เตือน</span>
                        </span>
                      )}
                      {log.status === 'ERROR' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-500" />
                          <span>ข้อผิดพลาด</span>
                        </span>
                      )}
                    </div>

                    {/* Details and Context */}
                    <p className="text-slate-800 font-medium text-xs sm:text-sm leading-relaxed">
                      {log.details}
                    </p>

                    {/* Permission Diff Box if available */}
                    {isPermissionChange && (log.previousValue || log.newValue) && (
                      <div className="inline-flex items-center gap-2 bg-amber-50/80 border border-amber-200 px-3 py-1 rounded-lg text-xs text-amber-900 mt-1">
                        <Key className="w-3.5 h-3.5 text-amber-700" />
                        <span>การเปลี่ยนสิทธิ์:</span>
                        {log.previousValue && (
                          <span className="line-through text-slate-500">{log.previousValue}</span>
                        )}
                        {log.previousValue && log.newValue && <ArrowRight className="w-3 h-3 text-amber-700" />}
                        {log.newValue && (
                          <span className="font-bold text-emerald-700">{log.newValue}</span>
                        )}
                      </div>
                    )}

                    {/* Actor and Target User */}
                    <div className="flex items-center gap-3 text-slate-500 flex-wrap pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-slate-400">ผู้ดำเนินการ:</span>
                        <strong className="text-slate-700 font-semibold">{log.userName}</strong>
                        {renderRoleBadge(log.userRole)}
                      </span>

                      {log.targetUserName && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-400">เป้าหมาย:</span>
                            <strong className="text-slate-700 font-semibold">{log.targetUserName}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Timestamp and inspect button */}
                  <div className="flex items-center md:flex-col md:items-end gap-2 md:gap-1 text-slate-400 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </span>
                    <button
                      onClick={() => setSelectedLogForDetail(log)}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline ml-auto md:ml-0"
                    >
                      <Eye className="w-3 h-3" />
                      <span>ดูรายละเอียด</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLogForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            id="audit-log-detail-modal"
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">รายละเอียดบันทึกการใช้งาน</h3>
              </div>
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-400">Log ID:</span> {selectedLogForDetail.id}
                </div>
                <div>
                  <span className="text-slate-400">Timestamp:</span> {new Date(selectedLogForDetail.timestamp).toISOString()}
                </div>
                <div>
                  <span className="text-slate-400">Action:</span> {selectedLogForDetail.action}
                </div>
                <div>
                  <span className="text-slate-400">Category:</span> {selectedLogForDetail.category || 'SYSTEM'}
                </div>
                <div>
                  <span className="text-slate-400">Actor:</span> {selectedLogForDetail.userName} ({selectedLogForDetail.userId})
                </div>
                <div>
                  <span className="text-slate-400">Actor Role:</span> {selectedLogForDetail.userRole || '-'}
                </div>
                {selectedLogForDetail.targetUserName && (
                  <div>
                    <span className="text-slate-400">Target User:</span> {selectedLogForDetail.targetUserName} ({selectedLogForDetail.targetUserId})
                  </div>
                )}
                {selectedLogForDetail.deviceInfo && (
                  <div>
                    <span className="text-slate-400">Client / Device:</span> {selectedLogForDetail.deviceInfo}
                  </div>
                )}
              </div>

              <div>
                <p className="text-slate-500 font-semibold mb-1">คำอธิบายรายละเอียด:</p>
                <div className="p-3 bg-indigo-50/60 rounded-xl text-slate-800 leading-relaxed border border-indigo-100">
                  {selectedLogForDetail.details}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLogForDetail(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
