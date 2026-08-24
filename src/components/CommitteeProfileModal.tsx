import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCircle,
  Camera,
  Upload,
  Trash2,
  Save,
  X,
  Shield,
  Award,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { compressAndResizeImage } from '../utils/imageUtils';

interface CommitteeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommitteeProfileModal: React.FC<CommitteeProfileModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updateUserProfile, committeeGroups, submissions } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    position: currentUser?.position || '',
    department: currentUser?.department || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    avatarUrl: currentUser?.avatarUrl || '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  if (!isOpen) return null;

  // Only committee members (evaluator / admin) should access
  const isEvaluatorOrAdmin = currentUser.role === 'evaluator' || currentUser.role === 'admin';

  // Find assigned group
  const assignedGroup = committeeGroups.find((g) => g.evaluatorIds.includes(currentUser.id));
  const myCompletedCount = submissions.filter((s) => s.evaluatorId === currentUser.id).length;

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        const compressed = await compressAndResizeImage(file, 480, 480, 0.85);
        setFormData((prev) => ({ ...prev, avatarUrl: compressed }));
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('เกิดข้อผิดพลาดในการโหลดรูปภาพ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: '' }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, {
      name: formData.name,
      position: formData.position,
      department: formData.department,
      email: formData.email,
      phone: formData.phone,
      avatarUrl: formData.avatarUrl,
      avatar: formData.avatarUrl,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  // Avatar presets for quick selection
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">โปรไฟล์คณะกรรมการประเมิน</h3>
              <p className="text-xs text-blue-150">
                จัดการรูปภาพประจำตัวและข้อมูลส่วนบุคคลของกรรมการ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isEvaluatorOrAdmin ? (
          <div className="p-8 text-center space-y-3">
            <UserCircle className="w-16 h-16 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800">สงวนสิทธิ์เฉพาะคณะกรรมการประเมิน</h4>
            <p className="text-xs text-slate-500">
              ฟังก์ชันการจัดการโปรไฟล์และอัปโหลดรูปภาพนี้เปิดใช้งานเฉพาะคณะกรรมการและผู้บริหารสถานศึกษาเท่านั้น
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 sm:p-7 space-y-6">
            {/* Avatar Upload Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div
                className="relative group cursor-pointer"
                onMouseEnter={() => setIsHoveringAvatar(true)}
                onMouseLeave={() => setIsHoveringAvatar(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white relative">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt={formData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold font-serif">
                      {formData.name.slice(0, 2)}
                    </span>
                  )}

                  {/* Hover Overlay */}
                  <div
                    className={`absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white transition-opacity ${
                      isHoveringAvatar ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-semibold">เปลี่ยนรูป</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md border-2 border-white transition"
                  title="อัปโหลดรูปภาพ"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <Shield className="w-3 h-3 text-blue-600" />
                    {currentUser.role === 'admin' ? 'ประธานบริหาร / ผู้บริหาร' : 'กรรมการประเมิน'}
                  </span>
                  {assignedGroup && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Layers className="w-3 h-3 text-slate-500" />
                      {assignedGroup.name.split('(')[0]}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-600 font-medium">
                    อัปโหลดรูปภาพหน้าตรง สำหรับแสดงในแถบผู้ประเมินและเอกสารทางการ
                  </p>
                  <p className="text-[11px] text-slate-400">
                    รองรับไฟล์ JPG, PNG หรือ WebP ขนาดไม่เกิน 3MB
                  </p>
                </div>

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition border border-blue-200"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>เลือกไฟล์รูปภาพ</span>
                  </button>

                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium transition border border-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบรูป</span>
                    </button>
                  )}
                </div>

                {/* Preset quick selection */}
                <div className="pt-2">
                  <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">
                    หรือเลือกรูปโปรไฟล์สำเร็จรูป:
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5">
                    {avatarPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: preset }))}
                        className={`w-7 h-7 rounded-full overflow-hidden border-2 transition hover:scale-110 ${
                          formData.avatarUrl === preset ? 'border-blue-600 ring-2 ring-blue-400' : 'border-slate-200'
                        }`}
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ - นามสกุล (พร้อมคำนำหน้า) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="เช่น นายสมชาย วงศ์สวัสดิ์"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ตำแหน่งในสถานศึกษา / หน้าที่กรรมการ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="เช่น รองผู้อำนวยการฝ่ายวิชาการ (ประธานกรรมการ ชุดที่ 1)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  กลุ่มงาน / ฝ่าย
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="กลุ่มบริหารงานวิชาการ"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="08X-XXX-XXXX"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อีเมล (สำหรับรับรายงานและแจ้งเตือน)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="evaluator@school.ac.th"
                  />
                </div>
              </div>
            </div>

            {/* Performance Stats Card */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-xs font-bold text-blue-900">
                    สถานะการลงคะแนนของท่าน
                  </div>
                  <div className="text-[11px] text-blue-700">
                    ประเมินแล้ว {myCompletedCount} รายการในระบบ
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-white text-blue-700 rounded-lg shadow-2xs border border-blue-200">
                กรรมการพร้อมปฏิบัติงาน
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>

              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800'
                }`}
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>บันทึกสำเร็จ!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>บันทึกโปรไฟล์กรรมการ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
