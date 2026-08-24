import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings,
  Image as ImageIcon,
  Building2,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  Sparkles,
  School,
  FileText,
  ShieldCheck,
  Award,
  Calendar,
  Layers,
  HelpCircle,
  Eye,
  Trash2,
  Check,
  Link,
  Download,
  FileImage,
  Database,
  RefreshCw,
  Cloud,
  CloudCheck,
} from 'lucide-react';
import { PRESET_LOGOS, PES_GOLD_LOGO } from '../data/presetLogos';
import { TargetPositionGroupModal } from './TargetPositionGroupModal';

export const SystemSettingsView: React.FC = () => {
  const {
    systemSettings,
    targetPositionGroups,
    updateSystemSettings,
    resetSystemSettings,
    currentUser,
    isFirebaseSyncing,
    isFirebaseConnected,
    syncAllToFirebase,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    appName: systemSettings.appName,
    appShortName: systemSettings.appShortName,
    schoolName: systemSettings.schoolName,
    schoolAffiliation: systemSettings.schoolAffiliation,
    logoUrl: systemSettings.logoUrl || '',
    isDemoMode: systemSettings.isDemoMode,
    academicYear: systemSettings.academicYear,
    evaluationRound: systemSettings.evaluationRound,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'logo' | 'demo' | 'round' | 'groups'>('general');
  const [isDragging, setIsDragging] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Handle Logo Upload (File Picker or Drag & Drop)
  const processUploadedFile = (file: File) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('กรุณาเลือกไฟล์ภาพโลโก้ขนาดไม่เกิน 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setFormData((prev) => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processUploadedFile(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setFormData((prev) => ({ ...prev, logoUrl: customUrlInput.trim() }));
      setCustomUrlInput('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleReset = () => {
    if (window.confirm('คุณต้องการรีเซ็ตการตั้งค่าระบบทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      resetSystemSettings();
      setFormData({
        appName: 'ระบบประเมินผลการปฏิบัติงานลูกจ้างชั่วคราว',
        appShortName: 'PES v3.0',
        schoolName: 'โรงเรียนศึกษาพิเศษชัยนาท',
        schoolAffiliation:
          'สังกัดสำนักบริหารงานการศึกษาพิเศษ สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',
        logoUrl: '',
        isDemoMode: true,
        academicYear: '2569',
        evaluationRound: 'รอบที่ 2 (1 เมษายน 2569 – 30 กันยายน 2569)',
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <Settings className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">ตั้งค่าระบบ (System Settings)</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-300/30">
                  ผู้ดูแลระบบ
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-150 mt-1">
                กำหนดค่าชื่อระบบ โลโก้สถานศึกษา ชื่อโรงเรียน สังกัด และเปิด/ปิดโหมดทดสอบ (Demo Mode)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              disabled={isSyncingManual || isFirebaseSyncing}
              onClick={async () => {
                try {
                  setIsSyncingManual(true);
                  await syncAllToFirebase();
                  setSyncSuccessMsg('ซิงค์ข้อมูลทั้งหมดขึ้นฐานข้อมูล Firebase สำเร็จเรียบร้อย');
                  setTimeout(() => setSyncSuccessMsg(''), 4000);
                } catch (e) {
                  alert('เกิดข้อผิดพลาดในการเชื่อมต่อ Firebase');
                } finally {
                  setIsSyncingManual(false);
                }
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600/60 hover:bg-blue-600 text-white text-xs font-semibold transition border border-blue-400/30 cursor-pointer"
              title="ซิงค์ข้อมูลทั้งหมดขึ้นฐานข้อมูล Firebase Firestore Cloud"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingManual || isFirebaseSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncingManual ? 'กำลังซิงค์ Cloud...' : 'ซิงค์ข้อมูลขึ้น Firebase'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>คืนค่าเริ่มต้น</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            ชื่อระบบและสถานศึกษา
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logo')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'logo'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            โลโก้ประจำระบบ (Logo)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            โหมดทดสอบ (Demo Switcher)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('round')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'round'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            รอบและปีงบประมาณ
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`px-3.5 py-1.5 rounded-xl font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'groups'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            กลุ่มสายงานเป้าหมาย ({targetPositionGroups.length})
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {syncSuccessMsg && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm">ฐานข้อมูล Firebase Firestore เชื่อมต่อสมบูรณ์</h4>
              <p className="text-[11px] text-blue-700">{syncSuccessMsg}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSyncSuccessMsg('')}
            className="text-xs text-blue-700 font-bold hover:underline"
          >
            ปิด
          </button>
        </div>
      )}

      {isSaved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm">บันทึกการตั้งค่าระบบสำเร็จแล้ว</h4>
              <p className="text-[11px] text-emerald-700">
                ข้อมูลโลโก้ ชื่อระบบ ชื่อสถานศึกษา และโหมด Demo ได้รับการอัปเดตทั่วทั้งระบบทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSaved(false)}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Main Settings Form Grid */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Logo Management */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-2xs">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    1. โลโก้และตราสัญลักษณ์ประจำระบบ (System Logo)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    เลือกตราสัญลักษณ์มาตรฐาน 4 แบบ หรืออัปโหลดไฟล์รูปภาพของหน่วยงานท่านเอง
                  </p>
                </div>
              </div>
            </div>

            {/* Current Active Logo Showcase */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/90 flex flex-col sm:flex-row items-center gap-5">
              {/* Logo Preview Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 flex items-center justify-center p-3 shadow-md border-2 border-white overflow-hidden shrink-0">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo Preview"
                      className="w-full h-full object-contain filter drop-shadow-md"
                    />
                  ) : (
                    <Award className="w-12 h-12 text-amber-300" />
                  )}
                </div>
                {formData.logoUrl && (
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs border-2 border-white">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {PRESET_LOGOS.find((p) => p.dataUrl === formData.logoUrl)?.name ||
                      (formData.logoUrl
                        ? 'โลโก้ที่อัปโหลดเอง (Custom Upload)'
                        : 'ตราสัญลักษณ์มาตรฐาน (PES Gold)')}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    ใช้งานอยู่
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ตราสัญลักษณ์นี้จะแสดงผลบนแถบเมนูด้านบน (Header), หน้าต่างประเมินผล และหัวเอกสารรายงานทางการ
                </p>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>อัปโหลดรูปภาพใหม่</span>
                  </button>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: '' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-medium border border-rose-200 transition cursor-pointer"
                      title="รีเซ็ตเป็นตราเริ่มต้น"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>รีเซ็ตค่า</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Drag and Drop Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed text-center transition cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jfif,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center mb-2 shadow-2xs">
                <FileImage className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-slate-800">
                ลากและวางไฟล์รูปภาพที่นี่ หรือ <span className="text-blue-600 underline">คลิกเพื่อเลือกไฟล์</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                รองรับไฟล์ PNG (พื้นหลังโปร่งใส), JPG, JFIF, WebP หรือ SVG (ขนาดไฟล์ไม่เกิน 5MB)
              </p>
            </div>

            {/* 4 Preset Logos Selection Grid (Requested by User) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>เลือกจากตราสัญลักษณ์มาตรฐาน 4 รูปแบบ:</span>
                </label>
                <span className="text-[10px] text-slate-400">คลิกที่การ์ดเพื่อนำไปใช้ทันที</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_LOGOS.map((preset) => {
                  const isSelected =
                    (preset.dataUrl === PES_GOLD_LOGO && !formData.logoUrl) ||
                    formData.logoUrl === preset.dataUrl;

                  return (
                    <div
                      key={preset.id}
                      onClick={() => setFormData({ ...formData, logoUrl: preset.dataUrl })}
                      className={`p-3.5 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition relative group ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Logo Icon / Image thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center p-1.5 border border-slate-300/80 shrink-0 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
                        <img
                          src={preset.dataUrl}
                          alt={preset.name}
                          className="w-full h-full object-contain filter drop-shadow-xs"
                        />
                      </div>

                      {/* Info & Radio check */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {preset.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>

                      {/* Selection Checkmark */}
                      <div className="absolute top-3.5 right-3.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'border-2 border-slate-300 text-transparent group-hover:border-slate-400'
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct Logo URL Input */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-slate-500" />
                <span>หรือระบุ URL รูปภาพโลโก้โดยตรง (Image URL)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customUrlInput || formData.logoUrl}
                  onChange={(e) => {
                    setCustomUrlInput(e.target.value);
                    setFormData({ ...formData, logoUrl: e.target.value });
                  }}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono bg-white"
                  placeholder="https://example.com/images/school-logo.png"
                />
                {customUrlInput && (
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    นำไปใช้
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: App Name & School Name */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    2. ข้อมูลระบบและชื่อสถานศึกษา
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    กำหนดชื่อระบบที่จะแสดงบนหน้าจอและข้อความส่วนหัวในรายงานราชการ
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อระบบประเมิน (App Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.appName}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium"
                  placeholder="เช่น ระบบประเมินผลการปฏิบัติงานลูกจ้างชั่วคราว"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อย่อ / รหัสเวอร์ชัน (Short Code)
                </label>
                <input
                  type="text"
                  value={formData.appShortName}
                  onChange={(e) => setFormData({ ...formData, appShortName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono"
                  placeholder="เช่น PES v3.0"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อสถานศึกษา / หน่วยงาน (School Name) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-medium"
                    placeholder="เช่น โรงเรียนศึกษาพิเศษชัยนาท"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หน่วยงานต้นสังกัด (Affiliation)
                </label>
                <input
                  type="text"
                  value={formData.schoolAffiliation}
                  onChange={(e) =>
                    setFormData({ ...formData, schoolAffiliation: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="เช่น สังกัดสำนักบริหารงานการศึกษาพิเศษ สพฐ."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Demo Mode Toggle */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    3. การตั้งค่าโหมดทดสอบ (Demo Switcher Mode)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ควบคุมการแสดงแถบสลับบทบาทจำลอง (Demo Switcher) บนแถบเมนู
                  </p>
                </div>
              </div>
            </div>

            {/* Toggle Card */}
            <div
              onClick={() => setFormData({ ...formData, isDemoMode: !formData.isDemoMode })}
              className={`p-5 rounded-2xl border-2 flex items-start sm:items-center justify-between gap-4 cursor-pointer transition ${
                formData.isDemoMode
                  ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300/50'
                  : 'bg-slate-50 border-slate-300'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    สถานะโหมดทดสอบ: {formData.isDemoMode ? '🟢 เปิดใช้งาน (ON)' : '🔴 ปิดใช้งาน (OFF / Production)'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      formData.isDemoMode
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {formData.isDemoMode ? 'Demo Enabled' : 'Production Mode'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {formData.isDemoMode
                    ? 'แสดงแถบสลับผู้ใช้งานด่วน (Admin / กรรมการ 6 ท่าน / ผู้รับการประเมิน 15 ตำแหน่ง) เพื่อให้คณะกรรมการและผู้ตรวจการทดสอบระบบได้อย่างสะดวก'
                    : 'ซ่อนแถบสลับตัวตนจำลองทั้งหมด ผู้ใช้งานทุกคนจะต้องเข้าสู่ระบบผ่าน Username และ Password ของตนเองเท่านั้น'}
                </p>
              </div>

              <div className="shrink-0 pt-1 sm:pt-0">
                {formData.isDemoMode ? (
                  <ToggleRight className="w-10 h-10 text-amber-600" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-400" />
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Evaluation Period & Round */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    4. รอบการประเมินและปีงบประมาณ
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    กำหนดรอบเวลาและปีงบประมาณที่จะระบุในหัวเอกสารและรายงานทางการ
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ปีงบประมาณ (พ.ศ.)
                </label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono"
                  placeholder="2567"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รอบการประเมิน
                </label>
                <input
                  type="text"
                  value={formData.evaluationRound}
                  onChange={(e) => setFormData({ ...formData, evaluationRound: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="รอบที่ 2 (1 เมษายน 2567 – 30 กันยายน 2567)"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Target Job Groups */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    5. จัดการกลุ่มสายงานเป้าหมาย (Target Job Groups)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    เพิ่ม ลบ แก้ไข เปลี่ยนชื่อ กำหนดสีแท็ก และจัดหมวดหมู่กลุ่มสายงานสำหรับคณะกรรมการและบุคลากร
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-open-target-modal-from-settings"
                onClick={() => setIsTargetModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>จัดการ/เพิ่มกลุ่มสายงาน ({targetPositionGroups.length})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {targetPositionGroups.map((tg, idx) => (
                <div
                  key={tg.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/30 transition text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{tg.name}</span>
                        {tg.code && tg.code !== tg.name && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                            {tg.code}
                          </span>
                        )}
                      </div>
                      {tg.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{tg.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTargetModalOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                  >
                    แก้ไข
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live Preview & Summary Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/90 space-y-4 sticky top-24">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <Eye className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm">ตัวอย่างการแสดงผลจริง (Live Preview)</h3>
            </div>

            {/* Mock Navbar Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500">ส่วนหัวระบบ (Header Mockup):</span>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 flex items-center justify-center p-1.5 shadow-xs">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Award className="w-5 h-5 text-amber-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {formData.appName || 'ระบบประเมินการปฏิบัติงาน'}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {formData.appShortName || 'PES'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {formData.schoolName || 'โรงเรียนศึกษาพิเศษชัยนาท'}
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Report Header Preview */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-500">
                หัวเอกสารราชการ (Official Document Mockup):
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-center space-y-1.5 font-serif text-slate-800">
                <div className="w-10 h-10 mx-auto rounded-full bg-white border border-slate-300 flex items-center justify-center p-1 shadow-inner">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[11px] font-bold text-slate-700">ตรา</span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 font-sans">
                  แบบสรุปผลการประเมินการปฏิบัติงานของลูกจ้างชั่วคราว
                </div>
                <div className="text-[10px] text-slate-600 font-sans">
                  {formData.evaluationRound} ประจำปีงบประมาณ {formData.academicYear}
                </div>
                <div className="text-[10px] text-slate-500 font-sans">
                  {formData.schoolName} ({formData.schoolAffiliation})
                </div>
              </div>
            </div>

            {/* Firebase Database Connection Status */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-500" />
                  <span>ฐานข้อมูล Firebase Firestore</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  เชื่อมต่อแล้ว
                </span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Project ID:</span>
                  <span className="font-mono font-semibold text-slate-700">promote-b4836</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Database:</span>
                  <span className="font-semibold text-slate-700">Firestore (Realtime Sync)</span>
                </div>
              </div>
            </div>

            {/* Quick Status Info */}
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>การบันทึกข้อมูลแบบเรียลไทม์ (Cloud Sync)</span>
              </div>
              <p className="text-[11px] text-blue-700">
                ข้อมูลการประเมิน ผลคะแนน ผู้ใช้งาน และการตั้งค่าจะถูกจัดเก็บบน Firebase Firestore และอัปเดตแบบ Realtime ทุกอุปกรณ์
              </p>
            </div>

            {/* Primary Save Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-700/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่าทั้งหมด</span>
            </button>
          </div>
        </div>
      </form>

      {/* Target Position Group Modal */}
      <TargetPositionGroupModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
      />
    </div>
  );
};
