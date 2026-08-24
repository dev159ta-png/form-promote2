import React, { useState, useRef, useEffect } from 'react';
import { useApp, ViewType } from '../context/AppContext';
import {
  Award,
  BarChart3,
  ClipboardCheck,
  Users,
  FileText,
  Database,
  Sliders,
  UserCheck,
  ChevronDown,
  Shield,
  LogOut,
  Building2,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  UserCog,
  FileEdit,
  GraduationCap,
  Layers,
  Home,
  UserCircle,
  Settings,
  Camera,
  School,
  Lock,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { LoginModal } from './LoginModal';
import { CommitteeProfileModal } from './CommitteeProfileModal';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    users,
    activeView,
    setActiveView,
    committeeGroups,
    submissions,
    logout,
    systemSettings,
    isFirebaseSyncing,
    isFirebaseConnected,
    syncAllToFirebase,
  } = useApp();

  const [syncToast, setSyncToast] = useState<string | null>(null);

  const handleManualSync = async () => {
    try {
      setSyncToast('กำลังเชื่อมต่อและซิงค์ข้อมูลกับ Firebase Cloud...');
      await syncAllToFirebase();
      setSyncToast('ซิงค์ข้อมูลตรงกันทุกอุปกรณ์สำเร็จ!');
      setTimeout(() => setSyncToast(null), 3000);
    } catch (e) {
      setSyncToast('เกิดข้อผิดพลาดในการซิงค์ข้อมูล');
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-purple-100 text-purple-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
            ผู้บริหาร / Admin
          </span>
        );
      case 'evaluator':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
            คณะกรรมการประเมิน
          </span>
        );
      default:
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
            ผู้รับการประเมิน
          </span>
        );
    }
  };

  // Nav Items customized per role
  const getNavItems = () => {
    if (currentUser.role === 'admin') {
      return [
        { id: 'dashboard', label: 'แดชบอร์ดสรุปผล', icon: BarChart3 },
        { id: 'users', label: 'จัดการผู้ใช้งาน', icon: UserCog },
        { id: 'forms_admin', label: 'จัดการแบบฟอร์ม (14 ตำแหน่ง)', icon: FileEdit },
        { id: 'groups', label: 'จัดการกลุ่มกรรมการ', icon: Users },
        { id: 'reports', label: 'รายงาน & Export', icon: FileText },
        { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings },
        { id: 'schema', label: 'DB & ER Schema', icon: Database },
      ];
    } else if (currentUser.role === 'evaluator') {
      return [
        { id: 'dashboard', label: 'แดชบอร์ดสรุปผล', icon: BarChart3 },
        { id: 'evaluate', label: 'แบบประเมินผล', icon: ClipboardCheck },
        { id: 'reports', label: 'รายงาน & Export', icon: FileText },
        { id: 'templates', label: 'เกณฑ์ 14 ตำแหน่ง (3 กลุ่ม)', icon: Award },
      ];
    } else {
      // Staff (Evaluatee)
      return [
        { id: 'my_evaluation', label: 'ผลการประเมินของฉัน', icon: Award },
        { id: 'templates', label: 'เกณฑ์มาตรฐาน 14 ตำแหน่ง', icon: Layers },
      ];
    }
  };

  const navItems = getNavItems();

  const mySubmissionsCount = submissions.filter((s) => s.evaluatorId === currentUser?.id).length;

  const handleNavClick = (viewId: ViewType) => {
    setActiveView(viewId);
    setIsMobileMenuOpen(false);
  };

  const isEvaluatorOrAdmin = currentUser.role === 'evaluator' || currentUser.role === 'admin';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            
            {/* Left: Mobile Hamburger + Custom Logo */}
            <div className="flex items-center gap-3">
              {/* Hamburger Button for Mobile */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                aria-label="เปิดเมนูหลัก"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo & School Title */}
              <div
                onClick={() => setActiveView(currentUser.role === 'staff' ? 'my_evaluation' : 'dashboard')}
                className="flex items-center gap-3 cursor-pointer select-none group"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 flex items-center justify-center text-white shadow-md shadow-blue-700/25 group-hover:scale-105 transition overflow-hidden p-1.5">
                  {systemSettings.logoUrl ? (
                    <img
                      src={systemSettings.logoUrl}
                      alt={systemSettings.appName}
                      className="w-full h-full object-contain filter drop-shadow-xs"
                    />
                  ) : (
                    <Award className="w-6 h-6 text-amber-300" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                      {systemSettings.appName || 'ระบบประเมินการปฏิบัติงาน'}
                    </h1>
                    <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-wider bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                      {systemSettings.appShortName || 'PES v3.0'}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block truncate max-w-sm">
                    {systemSettings.schoolName || 'โรงเรียนศึกษาพิเศษชัยนาท'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Demo Switcher & User Profile Menu */}
            <div className="flex items-center gap-2">
              {/* Cloud Realtime Sync Indicator / Button */}
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isFirebaseSyncing}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-95 border border-slate-200/80 text-[11px] font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
                title="คลิกเพื่อซิงค์ข้อมูลล่าสุดกับ Firebase Cloud ทันที (เชื่อมต่อสด PC, iOS, Android)"
              >
                {isFirebaseSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                ) : (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-600 text-[11px]">
                  {isFirebaseSyncing ? 'กำลังซิงค์...' : 'Cloud Realtime'}
                </span>
              </button>

              {/* Sync Toast Popup */}
              {syncToast && (
                <div className="fixed top-16 right-4 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  <span>{syncToast}</span>
                </div>
              )}

              {/* Quick Demo Switcher Button (Only shown if isDemoMode is TRUE) */}
              {systemSettings.isDemoMode && (
                <button
                  type="button"
                  onClick={() => setIsPersonaModalOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-bold transition cursor-pointer shadow-2xs"
                  title="คลิกเพื่อสลับบทบาททดลองใช้งานด่วน (Demo Mode เปิดใช้งานอยู่)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>สลับตัวตน (Demo)</span>
                </button>
              )}

              {/* User Persona Profile Card with Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  id="user-persona-btn"
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition cursor-pointer"
                >
                  {/* User Avatar (Photo if uploaded, else initial) */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs overflow-hidden ${
                      (currentUser?.avatar || currentUser?.avatarUrl)
                        ? 'border border-white/60'
                        : currentUser?.role === 'admin'
                        ? 'bg-purple-600'
                        : currentUser?.role === 'evaluator'
                        ? 'bg-blue-700'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {(currentUser?.avatar || currentUser?.avatarUrl) ? (
                      <img
                        src={currentUser.avatar || currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentUser?.name?.charAt(0) || 'U'
                    )}
                  </div>

                  <div className="hidden md:block">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 max-w-[130px] truncate">
                        {currentUser?.name}
                      </span>
                      {getRoleBadge(currentUser?.role || 'staff')}
                    </div>
                    <div className="text-[10px] text-slate-500 max-w-[160px] truncate">
                      {currentUser?.position}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {currentUser.position}
                      </div>
                      <div className="mt-1">{getRoleBadge(currentUser.role)}</div>
                    </div>

                    <div className="p-1 space-y-0.5">
                      {/* Committee Profile (For Evaluator & Admin) */}
                      {isEvaluatorOrAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setIsProfileModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-blue-600" />
                          <span>โปรไฟล์และรูปภาพกรรมการ</span>
                        </button>
                      )}

                      {/* System Settings for Admin */}
                      {currentUser.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setActiveView('settings');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>ตั้งค่าระบบ (System Settings)</span>
                        </button>
                      )}

                      {/* Demo Switcher */}
                      {systemSettings.isDemoMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setIsPersonaModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>สลับตัวตนจำลอง (Demo Switcher)</span>
                        </button>
                      )}

                      {/* Logout */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setIsPersonaModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer border-t border-slate-100 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>สลับผู้ใช้ / ออกจากระบบ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1.5 py-2 overflow-x-auto border-t border-slate-100 scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => handleNavClick(item.id as any)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.id === 'evaluate' && currentUser.role === 'evaluator' && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      ส่งแล้ว {mySubmissionsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>
      </header>

      {/* Mobile Drawer (Native Feel Hamburger Navigation) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Slide-out Drawer */}
          <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
            
            {/* Drawer Header */}
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-base text-amber-300 overflow-hidden">
                  {(currentUser?.avatar || currentUser?.avatarUrl) ? (
                    <img src={currentUser.avatar || currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name?.charAt(0)
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white truncate max-w-[170px]">
                    {currentUser?.name}
                  </div>
                  <div className="text-[11px] text-blue-100 truncate max-w-[170px]">
                    {currentUser?.position}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Role Badge inside drawer */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">สถานะสิทธิ์ในระบบ:</span>
              {getRoleBadge(currentUser?.role || 'staff')}
            </div>

            {/* Drawer Nav Items */}
            <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
                เมนูหลัก
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id as any)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.id === 'evaluate' && currentUser.role === 'evaluator' && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {mySubmissionsCount} ฟอร์ม
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Committee Profile option in mobile menu */}
              {isEvaluatorOrAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-50 transition cursor-pointer border border-blue-100 mt-2"
                >
                  <Camera className="w-5 h-5 text-blue-600" />
                  <span>โปรไฟล์และรูปภาพกรรมการ</span>
                </button>
              )}
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
              {/* Cloud Sync Status on Mobile */}
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isFirebaseSyncing}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-100/80 active:scale-95 border border-slate-200 text-xs transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {isFirebaseSyncing ? (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="font-semibold text-slate-700">Firebase Firestore</span>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {isFirebaseSyncing ? 'กำลังซิงค์...' : 'แตะเพื่อซิงค์สด'}
                </span>
              </button>

              {systemSettings.isDemoMode && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsPersonaModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>โหมดสลับตัวตนทดสอบ (Demo)</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Native App Style) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 pb-safe flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setActiveView(currentUser.role === 'staff' ? 'my_evaluation' : 'dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeView === 'dashboard' || activeView === 'my_evaluation'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">หน้าหลัก</span>
        </button>

        {currentUser.role !== 'staff' && (
          <button
            type="button"
            onClick={() => setActiveView(currentUser.role === 'admin' ? 'forms_admin' : 'evaluate')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
              activeView === 'evaluate' || activeView === 'forms_admin'
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{currentUser.role === 'admin' ? 'แบบฟอร์ม' : 'ประเมิน'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveView(currentUser.role === 'staff' ? 'templates' : 'reports')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
            activeView === 'reports' || activeView === 'templates'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{currentUser.role === 'staff' ? 'เกณฑ์' : 'รายงาน'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isEvaluatorOrAdmin) {
              setIsProfileModalOpen(true);
            } else {
              setIsPersonaModalOpen(true);
            }
          }}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-blue-600 transition cursor-pointer"
        >
          <UserCircle className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">โปรไฟล์</span>
        </button>
      </div>

      {/* Login / Demo Persona Modal */}
      <LoginModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />

      {/* Committee Profile Modal */}
      <CommitteeProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

