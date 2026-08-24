import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  Shield,
  KeyRound,
  UserCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Briefcase,
  GraduationCap,
  Users2,
  AlertCircle,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isMandatory = false,
}) => {
  const { users, login, loginAsUser, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'demo' | 'credentials'>('demo');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [demoRoleFilter, setDemoRoleFilter] = useState<'all' | 'admin' | 'evaluator' | 'teacher' | 'support'>('all');

  if (!isOpen) return null;

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim()) {
      setErrorMessage('กรุณาระบุชื่อผู้ใช้งานหรืออีเมล');
      return;
    }

    const res = login(username, password);
    if (!res.success) {
      setErrorMessage(res.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } else {
      if (onClose) onClose();
    }
  };

  const handleQuickDemoLogin = (user: User) => {
    loginAsUser(user);
    if (onClose) onClose();
  };

  const adminUsers = users.filter((u) => u.role === 'admin');
  const evaluatorUsers = users.filter((u) => u.role === 'evaluator');
  const teacherUsers = users.filter((u) => u.role === 'staff' && u.positionGroup === 'teacher_assistant');
  const supportUsers = users.filter((u) => u.role === 'staff' && u.positionGroup !== 'teacher_assistant');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-5 sm:p-6 relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-inner">
                <Award className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  ระบบประเมินการปฏิบัติงานบุคลากร
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  โรงเรียนศึกษาพิเศษชัยนาท (Performance Evaluation System)
                </p>
              </div>
            </div>
            
            {!isMandatory && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition text-sm cursor-pointer"
                title="ปิด"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 mt-5 p-1 bg-black/20 rounded-xl max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'demo'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>โหมดทดลองใช้งาน (Demo 1-Click)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === 'credentials'
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>เข้าสู่ระบบด้วยรหัสผ่าน</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          
          {/* TAB 1: DEMO QUICK LOGIN */}
          {activeTab === 'demo' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-bold">ระบบทดลองใช้งานแบบเลือกบทบาท:</span> คลิกที่โปรไฟล์ด้านล่างเพื่อเข้าสู่ระบบทันที ระบบจะกำหนดสิทธิ์ (Admin / กรรมการ / ผู้รับการประเมิน 13 สายงาน) โดยอัตโนมัติ
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setDemoRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                    demoRoleFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ทั้งหมด ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDemoRoleFilter('admin')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                    demoRoleFilter === 'admin'
                      ? 'bg-purple-700 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  ผู้บริหาร / Admin ({adminUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDemoRoleFilter('evaluator')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                    demoRoleFilter === 'evaluator'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  คณะกรรมการ ({evaluatorUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDemoRoleFilter('teacher')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                    demoRoleFilter === 'teacher'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  กลุ่ม 1: ครูผู้ช่วย ({teacherUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDemoRoleFilter('support')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                    demoRoleFilter === 'support'
                      ? 'bg-amber-700 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  กลุ่ม 2: สายสนับสนุน 12 แบบ ({supportUsers.length})
                </button>
              </div>

              {/* 1. Admin Section */}
              {(demoRoleFilter === 'all' || demoRoleFilter === 'admin') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider">
                    <Shield className="w-4 h-4 text-purple-700" />
                    <span>ผู้บริหารสถานศึกษา & ผู้ดูแลระบบ (Admin)</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {adminUsers.map((user) => {
                      const isCurrent = currentUser?.id === user.id;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleQuickDemoLogin(user)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer group ${
                            isCurrent
                              ? 'border-purple-500 bg-purple-50/80 ring-2 ring-purple-500/20'
                              : 'border-slate-200 hover:border-purple-400 hover:bg-purple-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition overflow-hidden">
                              {(user.avatar || user.avatarUrl) ? (
                                <img src={user.avatar || user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                user.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                {user.name}
                                <span className="text-[10px] font-mono bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                                  {user.employeeCode || 'ADMIN'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-600">{user.position}</div>
                              <div className="text-[11px] text-purple-700 font-medium">{user.department}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isCurrent && <CheckCircle2 className="w-5 h-5 text-purple-600" />}
                            <span className="text-xs font-semibold text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition">
                              {isCurrent ? 'ใช้งานอยู่' : 'เข้าใช้งาน →'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Committee Section */}
              {(demoRoleFilter === 'all' || demoRoleFilter === 'evaluator') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 uppercase tracking-wider">
                    <Users2 className="w-4 h-4 text-blue-700" />
                    <span>คณะกรรมการประเมินผล (Evaluators)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {evaluatorUsers.map((user) => {
                      const isCurrent = currentUser?.id === user.id;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleQuickDemoLogin(user)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer group ${
                            isCurrent
                              ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition overflow-hidden">
                              {(user.avatar || user.avatarUrl) ? (
                                <img src={user.avatar || user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                user.name.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">{user.name}</div>
                              <div className="text-[11px] text-slate-500 truncate">{user.position}</div>
                              <div className="text-[10px] text-blue-700 font-medium truncate">{user.department}</div>
                            </div>
                          </div>
                          {isCurrent ? (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                          ) : (
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2 transition" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Teacher Assistants Section */}
              {(demoRoleFilter === 'all' || demoRoleFilter === 'teacher') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    <span>กลุ่มที่ 1: ลูกจ้างชั่วคราว ตำแหน่งครูผู้ช่วย</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {teacherUsers.map((user) => {
                      const isCurrent = currentUser?.id === user.id;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleQuickDemoLogin(user)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer group ${
                            isCurrent
                              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              {user.employeeCode || 'T-ASSIST'}
                            </span>
                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-1.5 truncate">{user.name}</div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.position}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Support Staff Section (12 Positions) */}
              {(demoRoleFilter === 'all' || demoRoleFilter === 'support') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
                      <Briefcase className="w-4 h-4 text-amber-700" />
                      <span>กลุ่มที่ 2: สายสนับสนุน (จ้างเหมาบริการ 12 ตำแหน่ง)</span>
                    </div>
                    <span className="text-[11px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                      ครบทั้ง 12 สายงาน
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {supportUsers.map((user, idx) => {
                      const isCurrent = currentUser?.id === user.id;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleQuickDemoLogin(user)}
                          className={`p-2.5 rounded-xl border text-left transition cursor-pointer group ${
                            isCurrent
                              ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                              : 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                              {idx + 1}. {user.employeeCode || `S-${idx + 1}`}
                            </span>
                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-1 truncate">{user.name}</div>
                          <div className="text-[10px] text-slate-600 truncate mt-0.5">{user.position}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USERNAME & PASSWORD LOGIN */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 max-w-md mx-auto py-2">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  ยืนยันตัวตนเพื่อเข้าสู่ระบบ
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  กรอกชื่อผู้ใช้งาน (Username) หรืออีเมล และรหัสผ่าน
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ชื่อผู้ใช้งาน / รหัสประจำตัว / อีเมล
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น admin, evaluator1, teacher1, support1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รหัสผ่าน (Password)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่านเริ่มต้น: password123"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-sm outline-none transition"
                  required
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>รหัสผ่านเริ่มต้นสำหรับทดสอบ (Demo Accounts):</span>
                </div>
                <div className="font-mono text-slate-700 pl-5">
                  <div>• Admin: <span className="font-bold text-blue-700">admin</span> / <span className="text-slate-600">password123</span></div>
                  <div>• กรรมการ: <span className="font-bold text-blue-700">evaluator1</span> - <span className="font-bold text-blue-700">evaluator6</span> / <span className="text-slate-600">password123</span></div>
                  <div>• ครูผู้ช่วย: <span className="font-bold text-blue-700">teacher1</span> - <span className="font-bold text-blue-700">teacher3</span> / <span className="text-slate-600">password123</span></div>
                  <div>• สายสนับสนุน: <span className="font-bold text-blue-700">support1</span> - <span className="font-bold text-blue-700">support12</span> / <span className="text-slate-600">password123</span></div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                เข้าสู่ระบบ (Sign In)
              </button>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>เข้าใช้งานปัจจุบัน: <strong className="text-slate-800">{currentUser?.name}</strong></span>
          </div>
          {!isMandatory && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
            >
              ปิด
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
