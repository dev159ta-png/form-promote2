import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Clock,
  HardDrive,
  FileSpreadsheet,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Users,
  FileText,
  Calendar,
  Eye,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LocalSnapshotItem, SystemBackupData } from '../types';
import { validateBackupData, BackupValidationResult } from '../utils/backupUtils';

export const BackupAndRestoreCenter: React.FC = () => {
  const {
    users,
    committeeGroups,
    formTemplates,
    submissions,
    auditLogs,
    systemSettings,
    aggregatedResults,
    localSnapshots,
    createLocalSnapshot,
    deleteLocalSnapshot,
    restoreFromSnapshot,
    restoreSystemBackup,
    downloadBackupFile,
    downloadSurveyArchive,
  } = useApp();

  // Create Snapshot State
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);

  // File Upload & Preview State
  const [uploadedBackupData, setUploadedBackupData] = useState<SystemBackupData | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore Modal State
  const [selectedSnapshotForRestore, setSelectedSnapshotForRestore] = useState<LocalSnapshotItem | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreSource, setRestoreSource] = useState<'snapshot' | 'file'>('snapshot');

  // Selective Restore Options
  const [restoreOptions, setRestoreOptions] = useState({
    restoreUsersAndGroups: true,
    restoreSubmissions: true,
    restoreForms: true,
    restoreSettings: true,
    restoreThresholds: true,
    restoreTargetGroups: true,
  });

  // Action status message
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setStatusFeedback({ type, message });
    setTimeout(() => {
      setStatusFeedback(null);
    }, 6000);
  };

  const handleCreateSnapshot = () => {
    try {
      const name = snapshotName.trim() || `จุดสำรองข้อมูล (${new Date().toLocaleString('th-TH')})`;
      const created = createLocalSnapshot(name, snapshotNotes.trim() || undefined, false);
      setSnapshotName('');
      setSnapshotNotes('');
      setIsCreatingSnapshot(false);
      showFeedback('success', `สร้างจุดสำรองข้อมูล "${created.name}" เรียบร้อยแล้ว (ปลอดภัยในเครื่อง)`);
    } catch (err: any) {
      showFeedback('error', 'ไม่สามารถสร้างจุดสำรองข้อมูลได้: ' + (err?.message || ''));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const val = validateBackupData(parsed);
        setValidationResult(val);
        if (val.isValid) {
          setUploadedBackupData(parsed);
          showFeedback('info', `ตรวจสอบไฟล์สำรองเรียบร้อย: พบผู้ใช้ ${val.stats?.usersCount} คน, ผลประเมิน ${val.stats?.submissionsCount} รายการ`);
        } else {
          setUploadedBackupData(null);
          showFeedback('error', 'ไฟล์สำรองข้อมูลไม่ถูกต้อง: ' + val.errors.join(', '));
        }
      } catch (err: any) {
        setUploadedBackupData(null);
        setValidationResult(null);
        showFeedback('error', 'ไม่สามารถอ่านไฟล์ JSON ได้: ' + (err?.message || 'รูปแบบไฟล์เสียหาย'));
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    setIsProcessing(true);
    try {
      let result;
      if (restoreSource === 'snapshot' && selectedSnapshotForRestore) {
        result = await restoreFromSnapshot(selectedSnapshotForRestore.id, restoreOptions);
      } else if (restoreSource === 'file' && uploadedBackupData) {
        result = await restoreSystemBackup(uploadedBackupData, restoreOptions);
      }

      if (result?.success) {
        showFeedback('success', result.message || 'กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว');
        setIsRestoreModalOpen(false);
        setSelectedSnapshotForRestore(null);
        setUploadedBackupData(null);
        setValidationResult(null);
        setUploadFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showFeedback('error', result?.message || 'เกิดข้อผิดพลาดในการกู้คืน');
      }
    } catch (err: any) {
      showFeedback('error', 'การกู้คืนล้มเหลว: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div id="backup-restore-center-container" className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Security Shield */}
      <div
        id="backup-hero-banner"
        className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>เกราะป้องกันข้อมูลสูญหาย (Data Shield Active)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              ศูนย์สำรองข้อมูล & คลังจัดเก็บผลสำรวจ
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              ป้องกันข้อมูลผู้ใช้ รายชื่อกรรมการ และผลการประเมินรีเซ็ต พร้อมระบบกู้คืนในเครื่อง (Local Snapshots)
              และส่งออกชุดข้อมูลสำรวจตามระเบียบราชการ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-quick-create-snapshot"
              onClick={() => setIsCreatingSnapshot(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm shadow-md transition-all active:scale-95"
            >
              <HardDrive className="w-4 h-4" />
              <span>สร้างจุดสำรองในเครื่อง</span>
            </button>
            <button
              id="btn-quick-download-backup"
              onClick={() => downloadBackupFile('สำรองข้อมูลฉบับเต็มโดยผู้ใช้')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดไฟล์สำรอง (.json)</span>
            </button>
            <button
              id="btn-quick-download-survey"
              onClick={downloadSurveyArchive}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/30 hover:bg-teal-500/40 text-teal-200 font-medium text-sm border border-teal-400/40 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>จัดเก็บผลสำรวจ (CSV/JSON)</span>
            </button>
          </div>
        </div>

        {/* Current Database Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-400">ผู้ใช้งานในระบบ</p>
            <p className="text-xl font-bold text-white mt-0.5">{users.length} <span className="text-xs font-normal text-slate-400">คน</span></p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-400">กลุ่มคณะกรรมการ</p>
            <p className="text-xl font-bold text-white mt-0.5">{committeeGroups.length} <span className="text-xs font-normal text-slate-400">ชุด</span></p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-400">แบบฟอร์มประเมิน</p>
            <p className="text-xl font-bold text-white mt-0.5">{formTemplates.length} <span className="text-xs font-normal text-slate-400">ฟอร์ม</span></p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-400">ผลประเมิน/สำรวจ</p>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">{submissions.length} <span className="text-xs font-normal text-slate-400">รายการ</span></p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-400">จุดสำรองในเครื่อง</p>
            <p className="text-xl font-bold text-teal-300 mt-0.5">{localSnapshots.length} <span className="text-xs font-normal text-slate-400">จุด</span></p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <p className="text-xs text-slate-400">ปีงบประมาณ</p>
            <p className="text-xl font-bold text-amber-300 mt-0.5">{systemSettings.academicYear}</p>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusFeedback && (
        <div
          id="backup-status-feedback"
          className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusFeedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-sky-50 text-sky-800 border border-sky-200'
          }`}
        >
          {statusFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : statusFeedback.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{statusFeedback.message}</p>
        </div>
      )}

      {/* Modal / Form: Create Snapshot */}
      {isCreatingSnapshot && (
        <div
          id="create-snapshot-card"
          className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-lg space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-base">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>สร้างจุดสำรองข้อมูลด่วนในเครื่อง (Save Safety Snapshot)</span>
            </div>
            <button
              onClick={() => setIsCreatingSnapshot(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium"
            >
              ยกเลิก
            </button>
          </div>
          <p className="text-xs text-slate-500">
            ระบบจะบันทึกสถานะปัจจุบันทั้งหมด (ผู้ใช้, รูปโปรไฟล์, กลุ่มกรรมการ, แบบประเมิน, และผลคะแนน) ไว้ในเครื่องของท่าน
            เพื่อให้สามารถกู้คืนกลับมาได้ในคลิกเดียว แม้ระบบมีการรีเซ็ต
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ชื่อจุดสำรองข้อมูล *</label>
              <input
                id="input-snapshot-name"
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder={`เช่น: จัดกลุ่มกรรมการและใส่รูปโปรไฟล์เรียบร้อย (${new Date().toLocaleDateString('th-TH')})`}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">บันทึกเพิ่มเติม (ไม่บังคับ)</label>
              <input
                id="input-snapshot-notes"
                type="text"
                value={snapshotNotes}
                onChange={(e) => setSnapshotNotes(e.target.value)}
                placeholder="เช่น: ปรับสิทธิ์กรรมการ EV-101 ถึง EV-302"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsCreatingSnapshot(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              ยกเลิก
            </button>
            <button
              id="btn-save-snapshot-confirm"
              onClick={handleCreateSnapshot}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow"
            >
              บันทึกจุดสำรองข้อมูล
            </button>
          </div>
        </div>
      )}

      {/* Grid: 2 Columns (Local Snapshots vs Import/Restore) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Local Snapshots (2 cols wide on LG) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 text-base">
                    จุดสำรองข้อมูลในเครื่อง (Local Safety Snapshots)
                  </h2>
                  <p className="text-xs text-slate-500">
                    จุดบันทึกความปลอดภัยที่เก็บไว้ในเบราว์เซอร์ กู้คืนได้ทันทีโดยไม่ต้องต่ออินเทอร์เน็ต
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200/70 text-slate-700 w-fit">
                ทั้งหมด {localSnapshots.length} จุดสำรอง
              </span>
            </div>

            {/* Snapshots Table / List */}
            {localSnapshots.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <HardDrive className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-600">ยังไม่มีจุดสำรองข้อมูลในเครื่อง</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  กดปุ่ม "สร้างจุดสำรองในเครื่อง" ด้านบนเพื่อบันทึกสถานะผู้ใช้งานและผลประเมินปัจจุบันไว้
                </p>
                <button
                  onClick={() => setIsCreatingSnapshot(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>สร้างจุดแรกเลย</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                {localSnapshots.map((item) => (
                  <div
                    key={item.id}
                    id={`snapshot-item-${item.id}`}
                    className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 text-sm">{item.name}</span>
                        {item.autoCreated ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            ระบบสร้างอัตโนมัติ
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            บันทึกโดยผู้ใช้
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(item.createdAt).toLocaleString('th-TH')}
                        </span>
                        <span>•</span>
                        <span>ผู้ใช้ {item.totalUsers} คน</span>
                        <span>•</span>
                        <span>ผลประเมิน {item.totalSubmissions} รายการ</span>
                        <span>•</span>
                        <span>ขนาด {formatBytes(item.sizeBytes)}</span>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-600 italic bg-slate-100/70 px-2.5 py-1 rounded-md w-fit">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        id={`btn-restore-snapshot-${item.id}`}
                        onClick={() => {
                          setSelectedSnapshotForRestore(item);
                          setRestoreSource('snapshot');
                          setIsRestoreModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition-colors"
                        title="กู้คืนข้อมูลจากจุดนี้"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>กู้คืนจุดนี้</span>
                      </button>
                      <button
                        id={`btn-export-snapshot-${item.id}`}
                        onClick={() => {
                          const dateStr = item.createdAt.split('T')[0];
                          downloadBackupFile(`สำรองจากจุด: ${item.name} (${dateStr})`);
                        }}
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="ดาวน์โหลดเป็นไฟล์ JSON"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-delete-snapshot-${item.id}`}
                        onClick={() => {
                          if (confirm(`ยืนยันการลบจุดสำรอง "${item.name}"?`)) {
                            deleteLocalSnapshot(item.id);
                            showFeedback('info', 'ลบจุดสำรองข้อมูลเรียบร้อยแล้ว');
                          }
                        }}
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบจุดสำรอง"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Import & File Restore */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 text-base">
                  นำเข้าและกู้คืนไฟล์สำรอง (Upload & Restore)
                </h2>
                <p className="text-xs text-slate-500">
                  อัปโหลดไฟล์สำรองข้อมูลฉบับเต็ม (.json) เพื่อกู้คืนสถานะ
                </p>
              </div>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <FileJson className="w-8 h-8 text-slate-400 hover:text-emerald-600 mx-auto mb-2 transition-colors" />
              <p className="text-xs font-semibold text-slate-700">
                {uploadFileName ? uploadFileName : 'คลิกเลือกไฟล์สำรองข้อมูล (.json)'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                ไฟล์ที่เคยดาวน์โหลดผ่านระบบ PES Backup
              </p>
            </div>

            {/* Validation Preview Card */}
            {validationResult && validationResult.isValid && uploadedBackupData && (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ไฟล์สำรองถูกต้องและพร้อมกู้คืน</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-white/70 p-2.5 rounded-lg">
                  <div>
                    <span className="text-slate-500">ผู้ส่งออก:</span>{' '}
                    <span className="font-medium">{validationResult.stats?.exportedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">วันที่ส่งออก:</span>{' '}
                    <span className="font-medium">
                      {new Date(validationResult.stats?.exportedAt || '').toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">ผู้ใช้งาน:</span>{' '}
                    <span className="font-semibold text-emerald-700">{validationResult.stats?.usersCount} คน</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ผลประเมิน:</span>{' '}
                    <span className="font-semibold text-emerald-700">{validationResult.stats?.submissionsCount} รายการ</span>
                  </div>
                </div>

                <button
                  id="btn-trigger-file-restore"
                  onClick={() => {
                    setRestoreSource('file');
                    setIsRestoreModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>เริ่มขั้นตอนกู้คืนข้อมูลจากไฟล์นี้</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-5 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-600" />
              <span>ความปลอดภัยสูงสุด</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ทุกครั้งก่อนระบบทำการกู้คืนข้อมูล จะมีการสร้าง <strong>"จุดกู้คืนฉุกเฉินอัตโนมัติ"</strong> ไว้เสมอ
              หากเกิดข้อผิดพลาด สามารถย้อนกลับมายังสถานะเดิมก่อนกู้คืนได้ 100%
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Survey & Evaluation Archiving (จัดเก็บข้อมูลสำรวจและประเมินผล) */}
      <div id="survey-archiving-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100 text-teal-800">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">
                คลังจัดเก็บข้อมูลสำรวจและประเมินผล (Survey & Evaluation Data Archiving)
              </h2>
              <p className="text-xs text-slate-500">
                รวบรวมข้อมูลการประเมิน ข้อคิดเห็นกรรมการ บันทึกวันลาป่วย/ลากิจ และมติการจ้างต่อในรอบปีงบประมาณ {systemSettings.academicYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-archive-csv"
              onClick={downloadSurveyArchive}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ส่งออก Excel/CSV (ภาษาไทย)</span>
            </button>
            <button
              id="btn-archive-json"
              onClick={downloadSurveyArchive}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs shadow transition-colors"
            >
              <FileJson className="w-4 h-4" />
              <span>ส่งออก JSON Dataset</span>
            </button>
          </div>
        </div>

        {/* Survey Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500">ผู้รับการประเมินทั้งหมด</span>
            <p className="text-xl font-bold text-slate-900">
              {aggregatedResults.length} <span className="text-xs font-normal text-slate-500">ท่าน</span>
            </p>
            <p className="text-[11px] text-slate-400">กลุ่มลูกจ้างชั่วคราวและจ้างเหมา</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500">ประเมินเสร็จสมบูรณ์</span>
            <p className="text-xl font-bold text-emerald-600">
              {aggregatedResults.filter((r) => r.isFullyEvaluated).length} <span className="text-xs font-normal text-slate-500">ท่าน</span>
            </p>
            <p className="text-[11px] text-emerald-600">
              {aggregatedResults.length > 0
                ? ((aggregatedResults.filter((r) => r.isFullyEvaluated).length / aggregatedResults.length) * 100).toFixed(0)
                : 0}% ของทั้งหมด
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500">คะแนนเฉลี่ยทั้งโรงเรียน</span>
            <p className="text-xl font-bold text-teal-600">
              {aggregatedResults.length > 0
                ? (
                    aggregatedResults.reduce((acc, r) => acc + r.meanPercentage, 0) /
                    aggregatedResults.length
                  ).toFixed(2)
                : '0.00'}
              %
            </p>
            <p className="text-[11px] text-slate-400">จากคะแนนประเมินทุกตัวชี้วัด</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-xs text-slate-500">มติเห็นควรจ้างต่อ</span>
            <p className="text-xl font-bold text-blue-600">
              {
                aggregatedResults.filter((r) => {
                  const sub = r.submissions[0];
                  return !sub?.recommendation?.decision || sub?.recommendation?.decision === 'continue';
                }).length
              }{' '}
              <span className="text-xs font-normal text-slate-500">ท่าน</span>
            </p>
            <p className="text-[11px] text-slate-400">ตามข้อคิดเห็นกรรมการ</p>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-teal-50/50 border border-teal-100 p-4 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-teal-900">แนวทางการจัดเก็บข้อมูลสำรวจและประเมินผลตามระเบียบราชการ:</p>
            <p className="leading-relaxed">
              ไฟล์ CSV ที่ดาวน์โหลดจากระบบถูกเข้ารหัสด้วย <strong>UTF-8 with BOM</strong> ทำให้สามารถเปิดด้วย Microsoft Excel
              ภาษาไทยได้ถูกต้อง 100% โดยสระและวรรณยุกต์ไม่เพี้ยน สามารถนำไปใช้ทำสรุปเสนอ ผู้อำนวยการโรงเรียนศึกษาพิเศษชัยนาท
              และจัดส่ง สำนักบริหารงานการศึกษาพิเศษ สพฐ. ได้ทันที
            </p>
          </div>
        </div>
      </div>

      {/* Selective Restore Modal */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            id="restore-confirmation-modal"
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  ยืนยันการกู้คืนข้อมูลระบบ
                </h3>
                <p className="text-xs text-slate-500">
                  {restoreSource === 'snapshot'
                    ? `กู้คืนจากจุดสำรอง: "${selectedSnapshotForRestore?.name}"`
                    : `กู้คืนจากไฟล์: "${uploadFileName}"`}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-700">เลือกประเภทข้อมูลที่ต้องการกู้คืน:</p>

              <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreUsersAndGroups}
                    onChange={(e) =>
                      setRestoreOptions((prev) => ({ ...prev, restoreUsersAndGroups: e.target.checked }))
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>ข้อมูลผู้ใช้งาน รูปโปรไฟล์ และกลุ่มคณะกรรมการ (Users & Committee)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreSubmissions}
                    onChange={(e) =>
                      setRestoreOptions((prev) => ({ ...prev, restoreSubmissions: e.target.checked }))
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>ผลคะแนนการประเมินและแบบสำรวจ (Evaluations & Surveys)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreForms}
                    onChange={(e) =>
                      setRestoreOptions((prev) => ({ ...prev, restoreForms: e.target.checked }))
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>แบบฟอร์มการประเมิน 13 สายงาน (Evaluation Form Templates)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restoreOptions.restoreSettings}
                    onChange={(e) =>
                      setRestoreOptions((prev) => ({ ...prev, restoreSettings: e.target.checked }))
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>การตั้งค่าระบบและโลโก้โรงเรียน (System Settings & Logos)</span>
                </label>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                ระบบจะสร้าง <strong>"จุดกู้คืนฉุกเฉินอัตโนมัติ"</strong> ของสถานะปัจจุบันก่อนเริ่มกู้คืน
                เพื่อให้ท่านสามารถย้อนกลับได้เสมอ
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                disabled={isProcessing}
                onClick={() => setIsRestoreModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                id="btn-execute-restore"
                disabled={isProcessing}
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังกู้คืนข้อมูล...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ยืนยันและดำเนินการกู้คืน</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
