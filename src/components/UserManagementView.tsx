import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Edit2,
  Trash2,
  Key,
  CheckCircle2,
  X,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Sparkles,
  Lock,
  UserCheck,
  Layers,
  FileText,
  FileSpreadsheet,
  Check,
  Camera,
  Upload,
  Image as ImageIcon,
  Calendar,
  Clock,
  ClipboardList,
} from 'lucide-react';
import { User, UserRole, PositionGroup, LeaveStats } from '../types';
import { STANDARD_POSITIONS_13 } from '../data/formTemplates';
import { TargetPositionGroupModal } from './TargetPositionGroupModal';
import { getFormTemplateForUser } from '../utils/evaluationCalculator';
import { compressAndResizeImage } from '../utils/imageUtils';

const defaultLeaveStats: LeaveStats = {
  late: { days: 0, times: 0 },
  sick: { days: 0, times: 0 },
  personal: { days: 0, times: 0 },
  maternity: { days: 0, times: 0 },
  ordinationOrHajj: { days: 0, times: 0 },
  absent: { days: 0, times: 0 },
  other: { days: 0, times: 0 },
  notes: '',
};

interface AvatarPickerProps {
  avatar: string;
  onChange: (avatarUrl: string) => void;
  role: UserRole;
  name: string;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({ avatar, onChange, role, name }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressAndResizeImage(file, 480, 480, 0.85);
        onChange(compressed);
      } catch (err) {
        console.error('Failed to compress avatar:', err);
        alert('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ');
      }
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center gap-4">
      <div className="relative shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name || 'Profile'}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm ring-2 ring-blue-500/20"
          />
        ) : (
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-sm ${
              role === 'admin'
                ? 'bg-purple-600'
                : role === 'evaluator'
                ? 'bg-blue-700'
                : 'bg-emerald-600'
            }`}
          >
            {name ? name.charAt(0) : <Camera className="w-6 h-6 text-white/80" />}
          </div>
        )}
        {avatar && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center text-xs shadow-xs transition"
            title="ลบรูปภาพ"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 text-center sm:text-left space-y-1">
        <label className="block text-xs font-bold text-slate-800">
          รูปประจำตัว / รูปโปรไฟล์ (Profile Picture)
        </label>
        <p className="text-[11px] text-slate-500">
          สำหรับแสดงในรายชื่อคณะกรรมการผู้ประเมิน และผู้รับการประเมิน (ไฟล์ JPG, PNG ไม่เกิน 2MB)
        </p>
        <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl shadow-2xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>{avatar ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดรูปภาพ'}</span>
          </button>
          {avatar && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 transition cursor-pointer"
            >
              ลบรูป
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface LeaveStatsEditorProps {
  leaveStats: LeaveStats;
  onChange: (stats: LeaveStats) => void;
  candidateName?: string;
}

const LeaveStatsEditor: React.FC<LeaveStatsEditorProps> = ({ leaveStats, onChange, candidateName }) => {
  const updateCategory = (
    key: keyof Omit<LeaveStats, 'notes' | 'sickAndPersonal'>,
    field: 'days' | 'times',
    value: number
  ) => {
    const safeVal = Math.max(0, isNaN(value) ? 0 : value);
    onChange({
      ...leaveStats,
      [key]: {
        ...(leaveStats[key] || { days: 0, times: 0 }),
        [field]: safeVal,
      },
    });
  };

  const categories = [
    { key: 'late', label: '1. มาสาย', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { key: 'sick', label: '2. ลาป่วย', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { key: 'personal', label: '3. ลากิจส่วนตัว', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { key: 'maternity', label: '4. ลาคลอดบุตร', color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { key: 'ordinationOrHajj', label: '5. ลาอุปสมบท / พิธีฮัจย์', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { key: 'absent', label: '6. ขาดราชการ', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { key: 'other', label: '7. อื่น ๆ', color: 'text-slate-700 bg-slate-100 border-slate-200' },
  ] as const;

  const totalDays = categories.reduce((sum, c) => sum + (leaveStats[c.key]?.days || 0), 0);
  const totalTimes = categories.reduce((sum, c) => sum + (leaveStats[c.key]?.times || 0), 0);

  return (
    <div className="bg-emerald-50/60 border-2 border-emerald-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
              สถิติการมาทำงาน การลา และการมาสาย (ข้อมูลจากแอดมิน)
            </h4>
            <p className="text-[11px] text-emerald-800/80">
              บันทึกล่วงหน้าเพื่อดึงเข้าสู่แบบประเมินของกรรมการโดยอัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs">
          <span className="text-slate-600">รวมทั้งหมด:</span>
          <span className="text-emerald-700">{totalDays} วัน</span>
          <span className="text-slate-300">/</span>
          <span className="text-blue-700">{totalTimes} ครั้ง</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        {categories.map((cat) => {
          const item = leaveStats[cat.key] || { days: 0, times: 0 };
          return (
            <div
              key={cat.key}
              className="bg-white p-2.5 rounded-xl border border-slate-200/90 flex items-center justify-between gap-2 shadow-2xs"
            >
              <span className="font-semibold text-slate-800 truncate">{cat.label}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={item.days === 0 ? '' : item.days}
                    onChange={(e) => updateCategory(cat.key, 'days', parseFloat(e.target.value))}
                    placeholder="0"
                    className="w-12 px-1.5 py-1 text-center font-bold text-slate-900 border border-slate-300 rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-[11px] text-slate-500">วัน</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={item.times === 0 ? '' : item.times}
                    onChange={(e) => updateCategory(cat.key, 'times', parseInt(e.target.value, 10))}
                    placeholder="0"
                    className="w-12 px-1.5 py-1 text-center font-bold text-slate-900 border border-slate-300 rounded-lg focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <span className="text-[11px] text-slate-500">ครั้ง</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          หมายเหตุเพิ่มเติมเกี่ยวกับสถิติวันลา
        </label>
        <input
          type="text"
          value={leaveStats.notes || ''}
          onChange={(e) => onChange({ ...leaveStats, notes: e.target.value })}
          placeholder="เช่น มีใบรับรองแพทย์ครบถ้วน, ลากิจไปราชการ"
          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:border-emerald-600 outline-none"
        />
      </div>
    </div>
  );
};

export const UserManagementView: React.FC = () => {
  const {
    users,
    targetPositionGroups,
    formTemplates,
    addUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    currentUser,
    loginAsUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [groupFilter, setGroupFilter] = useState<'all' | string>('all');
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('password123');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: 'password123',
    role: 'staff' as UserRole,
    positionGroup: 'support_staff' as PositionGroup,
    position: 'ลูกจ้างชั่วคราว ตำแหน่งคนงาน',
    department: 'กลุ่มบริหารงานบริการและอาคารสถานที่',
    email: '',
    phone: '',
    employeeCode: '',
    formTemplateId: 'form_support_laborer',
    avatar: '',
    leaveStats: defaultLeaveStats,
  });

  const resetForm = () => {
    const defaultForm = formTemplates[0]?.id || 'form_teacher_assistant';
    setFormData({
      name: '',
      username: '',
      password: 'password123',
      role: 'staff',
      positionGroup: 'support_staff',
      position: 'ลูกจ้างชั่วคราว ตำแหน่งคนงาน',
      department: 'กลุ่มบริหารงานบริการและอาคารสถานที่',
      email: '',
      phone: '',
      employeeCode: '',
      formTemplateId: defaultForm,
      avatar: '',
      leaveStats: defaultLeaveStats,
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    const defaultForm = getFormTemplateForUser(user, formTemplates);
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username || '',
      password: user.password || 'password123',
      role: user.role,
      positionGroup: user.positionGroup || (user.position.includes('ครูผู้ช่วย') ? 'teacher_assistant' : 'support_staff'),
      position: user.position,
      department: user.department,
      email: user.email || '',
      phone: user.phone || '',
      employeeCode: user.employeeCode || '',
      formTemplateId: user.formTemplateId || defaultForm.id,
      avatar: user.avatar || '',
      leaveStats: user.leaveStats
        ? {
            late: user.leaveStats.late || { days: 0, times: 0 },
            sick: user.leaveStats.sick || user.leaveStats.sickAndPersonal || { days: 0, times: 0 },
            personal: user.leaveStats.personal || { days: 0, times: 0 },
            maternity: user.leaveStats.maternity || { days: 0, times: 0 },
            ordinationOrHajj: user.leaveStats.ordinationOrHajj || { days: 0, times: 0 },
            absent: user.leaveStats.absent || { days: 0, times: 0 },
            other: user.leaveStats.other || { days: 0, times: 0 },
            notes: user.leaveStats.notes || '',
          }
        : defaultLeaveStats,
    });
  };

  // Image Upload helper (converts to base64 Data URL)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพต้องไม่เกิน 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addUser({
      name: formData.name,
      username: formData.username || `user_${Date.now().toString(36)}`,
      password: formData.password || 'password123',
      role: formData.role,
      positionGroup: formData.role === 'staff' ? formData.positionGroup : undefined,
      position: formData.position,
      department: formData.department,
      email: formData.email || `${formData.username || 'user'}@school.ac.th`,
      phone: formData.phone,
      employeeCode: formData.employeeCode,
      avatar: formData.avatar || undefined,
      leaveStats: formData.role === 'staff' ? formData.leaveStats : undefined,
      formTemplateId: formData.role === 'staff' ? formData.formTemplateId : undefined,
    });

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !formData.name.trim()) return;

    updateUser({
      ...editingUser,
      name: formData.name,
      username: formData.username,
      password: formData.password,
      role: formData.role,
      positionGroup: formData.role === 'staff' ? formData.positionGroup : undefined,
      position: formData.position,
      department: formData.department,
      email: formData.email,
      phone: formData.phone,
      employeeCode: formData.employeeCode,
      avatar: formData.avatar || undefined,
      leaveStats: formData.role === 'staff' ? formData.leaveStats : undefined,
      formTemplateId: formData.role === 'staff' ? formData.formTemplateId : undefined,
    });

    setEditingUser(null);
  };

  const handleConfirmDelete = () => {
    if (deletingUser) {
      deleteUser(deletingUser.id);
      setDeletingUser(null);
    }
  };

  const handleConfirmResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPasswordUser && newPasswordValue) {
      resetUserPassword(resetPasswordUser.id, newPasswordValue);
      setResetPasswordUser(null);
      setNewPasswordValue('password123');
    }
  };

  // Filtered list
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.employeeCode && user.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesGroup =
      groupFilter === 'all' ||
      (groupFilter === 'teacher_assistant' &&
        (user.positionGroup === 'teacher_assistant' ||
          (user.position.includes('ครูผู้ช่วย') && !user.position.includes('พนักงานราชการ')))) ||
      (groupFilter === 'government_employee_teacher' &&
        (user.positionGroup === 'government_employee_teacher' ||
          user.position.includes('พนักงานราชการ') ||
          (user.position.includes('ครูผู้สอน') && !user.position.includes('ครูผู้ช่วย')))) ||
      (groupFilter === 'support_staff' &&
        user.role === 'staff' &&
        !user.position.includes('ครูผู้ช่วย') &&
        !user.position.includes('พนักงานราชการ') &&
        user.positionGroup !== 'teacher_assistant' &&
        user.positionGroup !== 'government_employee_teacher');

    return matchesSearch && matchesRole && matchesGroup;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            ผู้บริหาร / Admin
          </span>
        );
      case 'evaluator':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
            <UserCheck className="w-3 h-3 text-blue-600" />
            คณะกรรมการ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
            <GraduationCap className="w-3 h-3 text-emerald-600" />
            ผู้รับการประเมิน
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Admin Management Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            ระบบจัดการผู้ใช้งานและสิทธิ์ (User & Access Control)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            จัดการรายชื่อ ชื่อผู้ใช้ รหัสผ่าน บทบาท และตำแหน่งงาน (ครูผู้ช่วย & สายสนับสนุน 12 สายงาน)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-manage-target-groups-user-view"
            onClick={() => setIsTargetModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl font-bold text-xs sm:text-sm border border-slate-200 transition cursor-pointer"
            title="เปลี่ยนชื่อ เพิ่ม ลบ แก้ไข กลุ่มสายงานเป้าหมาย"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>กลุ่มสายงาน ({targetPositionGroups.length})</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มผู้ใช้งานใหม่</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, นามสกุล, ตำแหน่ง, รหัสผู้ใช้, หรือกลุ่มสาระ..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 text-xs sm:text-sm outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === 'admin'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('evaluator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === 'evaluator'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              กรรมการ
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('staff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                roleFilter === 'staff'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              ผู้รับการประเมิน
            </button>
          </div>
        </div>
      </div>

      {/* Users Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          แสดงผล <strong className="text-slate-800">{filteredUsers.length}</strong> จากทั้งหมด {users.length} บัญชี
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Admin ({users.filter(u => u.role === 'admin').length})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> กรรมการ ({users.filter(u => u.role === 'evaluator').length})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> ผู้รับการประเมิน ({users.filter(u => u.role === 'staff').length})</span>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const isMe = currentUser.id === user.id;
          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl p-5 border transition hover:shadow-md flex flex-col justify-between ${
                isMe
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-11 h-11 rounded-xl object-cover shadow-xs border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base text-white shadow-xs shrink-0 ${
                          user.role === 'admin'
                            ? 'bg-purple-600'
                            : user.role === 'evaluator'
                            ? 'bg-blue-700'
                            : 'bg-emerald-600'
                        }`}
                      >
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {user.name}
                        </h4>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        User: <strong className="text-blue-700">{user.username || 'user'}</strong> | รหัส: {user.employeeCode || user.id}
                      </div>
                    </div>
                  </div>
                  {getRoleBadge(user.role)}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.position}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}

                  {user.role === 'staff' && (() => {
                    const assignedForm = getFormTemplateForUser(user, formTemplates);
                    const ls = user.leaveStats;
                    const hasLeaveData = ls && (
                      (ls.late?.days || 0) > 0 || (ls.late?.times || 0) > 0 ||
                      (ls.sick?.days || 0) > 0 || (ls.sick?.times || 0) > 0 ||
                      (ls.personal?.days || 0) > 0 || (ls.personal?.times || 0) > 0 ||
                      (ls.maternity?.days || 0) > 0 || (ls.maternity?.times || 0) > 0 ||
                      (ls.ordinationOrHajj?.days || 0) > 0 || (ls.ordinationOrHajj?.times || 0) > 0 ||
                      (ls.absent?.days || 0) > 0 || (ls.absent?.times || 0) > 0 ||
                      (ls.other?.days || 0) > 0 || (ls.other?.times || 0) > 0 ||
                      (ls.notes && ls.notes.trim().length > 0)
                    );
                    const totalDays = (ls?.late?.days || 0) + (ls?.sick?.days || 0) + (ls?.personal?.days || 0) +
                      (ls?.maternity?.days || 0) + (ls?.ordinationOrHajj?.days || 0) + (ls?.absent?.days || 0) + (ls?.other?.days || 0);
                    const totalTimes = (ls?.late?.times || 0) + (ls?.sick?.times || 0) + (ls?.personal?.times || 0) +
                      (ls?.maternity?.times || 0) + (ls?.ordinationOrHajj?.times || 0) + (ls?.absent?.times || 0) + (ls?.other?.times || 0);

                    return (
                      <div className="space-y-1.5 mt-2">
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-1.5 text-[11px] text-indigo-700 bg-indigo-50/60 px-2.5 py-1.5 rounded-lg border border-indigo-100/80">
                          <div className="flex items-center gap-1.5 truncate">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-semibold truncate">แบบประเมิน: [{assignedForm.code}] {assignedForm.positionTitle}</span>
                          </div>
                          <span className="text-[10px] bg-white text-indigo-800 font-bold px-1.5 py-0.5 rounded shadow-2xs shrink-0">
                            {assignedForm.totalMaxScore} คะแนน
                          </span>
                        </div>

                        {hasLeaveData ? (
                          <div className="flex items-center justify-between text-[10.5px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200/70 font-medium">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>สถิติวันลา: แอดมินบันทึกแล้ว</span>
                            </span>
                            <span className="font-bold text-emerald-900">
                              {totalDays} วัน / {totalTimes} ครั้ง
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[10.5px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>สถิติวันลา: ยังไม่ได้กรอกล่วงหน้า</span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => loginAsUser(user)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
                  title="สลับเข้าใช้งานด้วยบัญชีนี้ (Demo Quick Switch)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isMe ? 'เข้าสู่ระบบอยู่' : 'สลับตัวตน'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setResetPasswordUser(user)}
                    className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                    title="เปลี่ยนรหัสผ่าน"
                  >
                    <Key className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(user)}
                    className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                    title="แก้ไขข้อมูล"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {user.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => setDeletingUser(user)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="ลบผู้ใช้งาน"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">เพิ่มผู้ใช้งานใหม่ในระบบ</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddUser} className="mt-4 space-y-4">
              {/* Profile Image Picker */}
              <AvatarPicker
                avatar={formData.avatar}
                onChange={(avatar) => setFormData({ ...formData, avatar })}
                role={formData.role}
                name={formData.name}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น นายประสิทธิ์ มั่นคง"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผู้ใช้ (Username) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="เช่น prasit.m"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่าน (Password)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="ค่าเริ่มต้น: password123"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสประจำตัวพนักงาน / ลำดับ
                  </label>
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    placeholder="เช่น S-013, T-004"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    บทบาทในระบบ (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none bg-white"
                  >
                    <option value="staff">ผู้รับการประเมิน (Staff / Evaluatee)</option>
                    <option value="evaluator">คณะกรรมการประเมิน (Evaluator)</option>
                    <option value="admin">ผู้บริหาร / ผู้ดูแลระบบ (Admin)</option>
                  </select>
                </div>

                {formData.role === 'staff' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      กลุ่มสายงานเป้าหมาย
                    </label>
                    <select
                      value={formData.positionGroup}
                      onChange={(e) => {
                        const newGrp = e.target.value as PositionGroup;
                        const matchingTemplate = formTemplates.find((t) => t.group === newGrp);
                        setFormData({
                          ...formData,
                          positionGroup: newGrp,
                          formTemplateId: matchingTemplate ? matchingTemplate.id : formData.formTemplateId,
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none bg-white"
                    >
                      {targetPositionGroups.map((tg) => (
                        <option key={tg.id} value={tg.id}>
                          {tg.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {formData.role === 'staff' && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
                      <label className="text-xs font-bold text-indigo-950">
                        แบบฟอร์มที่ใช้ในการประเมิน (Evaluation Form Template)
                      </label>
                    </div>
                    <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      แบบประเมินเฉพาะบุคคล
                    </span>
                  </div>

                  <select
                    value={formData.formTemplateId}
                    onChange={(e) => setFormData({ ...formData, formTemplateId: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-indigo-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white font-medium text-slate-900"
                  >
                    <optgroup label="กลุ่มที่ 1: ลูกจ้างชั่วคราว ตำแหน่ง ครูผู้ช่วย">
                      {formTemplates
                        .filter((t) => t.group === 'teacher_assistant')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.code}] {t.title} ({t.totalMaxScore} คะแนน)
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="กลุ่มที่ 2: ลูกจ้างชั่วคราว สายสนับสนุน/ปฏิบัติงาน (12 ตำแหน่ง)">
                      {formTemplates
                        .filter((t) => t.group === 'support_staff')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.code}] {t.title} ({t.totalMaxScore} คะแนน)
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="กลุ่มที่ 3: พนักงานราชการทั่วไป ตำแหน่ง ครูผู้สอน">
                      {formTemplates
                        .filter((t) => t.group === 'government_employee_teacher')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.code}] {t.title} ({t.totalMaxScore} คะแนน)
                          </option>
                        ))}
                    </optgroup>
                    {formTemplates.some(
                      (t) =>
                        t.group !== 'teacher_assistant' &&
                        t.group !== 'support_staff' &&
                        t.group !== 'government_employee_teacher'
                    ) && (
                      <optgroup label="แบบฟอร์มอื่นๆ">
                        {formTemplates
                          .filter(
                            (t) =>
                              t.group !== 'teacher_assistant' &&
                              t.group !== 'support_staff' &&
                              t.group !== 'government_employee_teacher'
                          )
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              [{t.code}] {t.title} ({t.totalMaxScore} คะแนน)
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>

                  {/* Template Info Card */}
                  {(() => {
                    const currentSelectedTmpl = formTemplates.find((t) => t.id === formData.formTemplateId);
                    if (!currentSelectedTmpl) return null;
                    return (
                      <div className="bg-white/90 border border-indigo-100 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-900">
                            รหัส {currentSelectedTmpl.code}: {currentSelectedTmpl.positionTitle}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            คะแนนเต็ม {currentSelectedTmpl.totalMaxScore} คะแนน ({currentSelectedTmpl.categories?.length || 0} ตอน)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {currentSelectedTmpl.description || currentSelectedTmpl.title}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ตำแหน่งงาน (Position) <span className="text-rose-500">*</span>
                </label>
                {formData.role === 'staff' ? (
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none bg-white"
                  >
                    <optgroup label="กลุ่มที่ 1: ครูผู้ช่วย">
                      <option value="ลูกจ้างชั่วคราว ตำแหน่งครูผู้ช่วย">ลูกจ้างชั่วคราว ตำแหน่งครูผู้ช่วย</option>
                    </optgroup>
                    <optgroup label="กลุ่มที่ 2: จ้างเหมาบริการ สายสนับสนุน (12 ตำแหน่ง)">
                      {STANDARD_POSITIONS_13.slice(1).map((pos) => (
                        <option key={pos.code} value={pos.title}>
                          {pos.title}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="เช่น รองผู้อำนวยการสถานศึกษา, กรรมการชุดที่ 1"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    กลุ่มงาน / กลุ่มสาระ / ฝ่าย
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="เช่น กลุ่มบริหารงานทั่วไป"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อีเมล (Email)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@school.ac.th"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none"
                  />
                </div>
              </div>

              {/* Leave Statistics Pre-fill (for staff) */}
              {formData.role === 'staff' && (
                <LeaveStatsEditor
                  leaveStats={formData.leaveStats}
                  onChange={(leaveStats) => setFormData({ ...formData, leaveStats })}
                  candidateName={formData.name}
                />
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  บันทึกผู้ใช้งาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">แก้ไขข้อมูลผู้ใช้งาน</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="mt-4 space-y-4">
              {/* Profile Image Picker */}
              <AvatarPicker
                avatar={formData.avatar}
                onChange={(avatar) => setFormData({ ...formData, avatar })}
                role={formData.role}
                name={formData.name}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อ - นามสกุล
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อผู้ใช้ (Username)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    บทบาท (Role)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 outline-none bg-white"
                  >
                    <option value="staff">ผู้รับการประเมิน</option>
                    <option value="evaluator">คณะกรรมการ</option>
                    <option value="admin">Admin / ผู้บริหาร</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสประจำตัว
                  </label>
                  <input
                    type="text"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              {formData.role === 'staff' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    กลุ่มสายงานเป้าหมาย
                  </label>
                  <select
                    value={formData.positionGroup}
                    onChange={(e) => {
                      const newGrp = e.target.value as PositionGroup;
                      const matchingTemplate = formTemplates.find((t) => t.group === newGrp);
                      setFormData({
                        ...formData,
                        positionGroup: newGrp,
                        formTemplateId: matchingTemplate ? matchingTemplate.id : formData.formTemplateId,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 outline-none bg-white"
                  >
                    {targetPositionGroups.map((tg) => (
                      <option key={tg.id} value={tg.id}>
                        {tg.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === 'staff' && (
                <div className="bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 border-2 border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
                      <label className="text-xs sm:text-sm font-bold text-indigo-950">
                        แบบฟอร์มที่ใช้ในการประเมิน (Evaluation Form Template)
                      </label>
                    </div>
                    <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      แอดมินเปลี่ยนแบบฟอร์มได้
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    ดึงแบบฟอร์มปัจจุบันที่ผูกกับผู้รับการประเมินนี้ สามารถเลือกเปลี่ยนแบบฟอร์มอื่นได้ตามต้องการ:
                  </p>

                  <select
                    value={formData.formTemplateId}
                    onChange={(e) => setFormData({ ...formData, formTemplateId: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs sm:text-sm border border-indigo-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none bg-white font-semibold text-slate-900 shadow-2xs"
                  >
                    <optgroup label="กลุ่มที่ 1: ลูกจ้างชั่วคราว ตำแหน่ง ครูผู้ช่วย">
                      {formTemplates
                        .filter((t) => t.group === 'teacher_assistant')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.code}] {t.title} ({t.totalMaxScore} คะแนน)
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="กลุ่มที่ 2: ลูกจ้างชั่วคราว สายสนับสนุน/ปฏิบัติงาน (12 ตำแหน่ง)">
                      {formTemplates
                        .filter((t) => t.group === 'support_staff')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.code}] {t.title} ({t.totalMaxScore} คะแนน)
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="กลุ่มที่ 3: พนักงานราชการทั่วไป ตำแหน่ง ครูผู้สอน">
                      {formTemplates
                        .filter((t) => t.group === 'government_employee_teacher')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.code}] {t.title} ({t.totalMaxScore} คะแนน)
                          </option>
                        ))}
                    </optgroup>
                    {formTemplates.some(
                      (t) =>
                        t.group !== 'teacher_assistant' &&
                        t.group !== 'support_staff' &&
                        t.group !== 'government_employee_teacher'
                    ) && (
                      <optgroup label="แบบฟอร์มอื่นๆ">
                        {formTemplates
                          .filter(
                            (t) =>
                              t.group !== 'teacher_assistant' &&
                              t.group !== 'support_staff' &&
                              t.group !== 'government_employee_teacher'
                          )
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              [{t.code}] {t.title} ({t.totalMaxScore} คะแนน)
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>

                  {/* Live Template Info Card Preview */}
                  {(() => {
                    const currentSelectedTmpl = formTemplates.find((t) => t.id === formData.formTemplateId);
                    if (!currentSelectedTmpl) return null;
                    return (
                      <div className="bg-white rounded-xl p-3.5 border border-indigo-100/90 text-xs text-slate-600 space-y-2 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                          <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                            รหัส {currentSelectedTmpl.code}: {currentSelectedTmpl.positionTitle}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            คะแนนเต็ม {currentSelectedTmpl.totalMaxScore} คะแนน ({currentSelectedTmpl.categories?.length || 0} ตอน)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {currentSelectedTmpl.description || currentSelectedTmpl.title}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium pt-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>แบบฟอร์มนี้จะมีผลทันทีต่อการประเมินและการคำนวณคะแนนของ {formData.name || 'ผู้รับการประเมิน'}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ตำแหน่งงาน
                </label>
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    กลุ่มงาน / สังกัด
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Leave Statistics Pre-fill (for staff) */}
              {formData.role === 'staff' && (
                <LeaveStatsEditor
                  leaveStats={formData.leaveStats}
                  onChange={(leaveStats) => setFormData({ ...formData, leaveStats })}
                  candidateName={formData.name}
                />
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Key className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">รีเซ็ตรหัสผ่าน</h3>
                <p className="text-xs text-slate-500">{resetPasswordUser.name}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmResetPassword} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  กำหนดรหัสผ่านใหม่
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="เช่น password123 หรือรหัสผ่านใหม่"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:border-blue-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPasswordUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer"
                >
                  ยืนยันเปลี่ยนรหัสผ่าน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE USER */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ยืนยันการลบผู้ใช้งาน</h3>
                <p className="text-xs text-slate-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              คุณต้องการลบข้อมูลของ <strong className="text-slate-900">{deletingUser.name}</strong> ({deletingUser.position}) ออกจากระบบใช่หรือไม่?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                ลบผู้ใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Position Group Modal */}
      <TargetPositionGroupModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
      />

    </div>
  );
};
