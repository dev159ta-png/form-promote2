import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Users,
  Briefcase,
  FolderPlus,
  RotateCcw,
  Save,
  Tag,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { TargetPositionGroup } from '../types';

interface TargetPositionGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { id: 'blue', name: 'น้ำเงิน (Blue)', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-500' },
  { id: 'emerald', name: 'เขียวมรกต (Emerald)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-500' },
  { id: 'purple', name: 'ม่วง (Purple)', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', ring: 'ring-purple-500' },
  { id: 'amber', name: 'ส้มอำพัน (Amber)', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-500' },
  { id: 'rose', name: 'ชมพูกุหลาบ (Rose)', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', ring: 'ring-rose-500' },
  { id: 'cyan', name: 'ฟ้าคราม (Cyan)', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', ring: 'ring-cyan-500' },
  { id: 'indigo', name: 'ครามเข้ม (Indigo)', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', ring: 'ring-indigo-500' },
];

export const TargetPositionGroupModal: React.FC<TargetPositionGroupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    targetPositionGroups,
    addTargetPositionGroup,
    updateTargetPositionGroup,
    deleteTargetPositionGroup,
    committeeGroups,
    users,
  } = useApp();

  const [editingGroup, setEditingGroup] = useState<TargetPositionGroup | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [order, setOrder] = useState<number>(1);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingGroup(null);
    setName('');
    setCode(`กลุ่มที่ ${targetPositionGroups.length + 1}`);
    setDescription('');
    setSelectedColor(
      COLOR_OPTIONS[targetPositionGroups.length % COLOR_OPTIONS.length].id
    );
    setOrder(targetPositionGroups.length + 1);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (group: TargetPositionGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setCode(group.code || '');
    setDescription(group.description || '');
    setSelectedColor(group.color || 'blue');
    setOrder(group.order || 1);
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณาระบุชื่อกลุ่มสายงานเป้าหมาย');
      return;
    }

    if (editingGroup) {
      updateTargetPositionGroup({
        ...editingGroup,
        name: name.trim(),
        code: code.trim() || name.trim(),
        description: description.trim(),
        color: selectedColor,
        order: Number(order) || 1,
      });
      showToast(`บันทึกการแก้ไขกลุ่ม "${name}" เรียบร้อยแล้ว`);
    } else {
      addTargetPositionGroup({
        name: name.trim(),
        code: code.trim() || `กลุ่มที่ ${targetPositionGroups.length + 1}`,
        description: description.trim(),
        color: selectedColor,
        order: Number(order) || targetPositionGroups.length + 1,
        isDefault: false,
      });
      showToast(`เพิ่มกลุ่มสายงานใหม่ "${name}" สำเร็จ`);
    }

    setIsFormOpen(false);
    setEditingGroup(null);
  };

  const handleDelete = (groupId: string) => {
    const targetGroup = targetPositionGroups.find((g) => g.id === groupId);
    const linkedCommittees = committeeGroups.filter(
      (cg) => cg.targetPositionGroup === groupId
    );
    const linkedStaff = users.filter(
      (u) => u.role === 'staff' && u.positionGroup === groupId
    );

    if (linkedCommittees.length > 0 || linkedStaff.length > 0) {
      if (
        !confirm(
          `คำเตือน: มีคณะกรรมการ ${linkedCommittees.length} ชุด และบุคลากร ${linkedStaff.length} ท่านที่ใช้กลุ่มนี้อยู่\nต้องการลบกลุ่ม "${targetGroup?.name}" หรือไม่?`
        )
      ) {
        setDeleteConfirmId(null);
        return;
      }
    }

    deleteTargetPositionGroup(groupId);
    showToast(`ลบกลุ่มสายงาน "${targetGroup?.name || groupId}" สำเร็จ`);
    setDeleteConfirmId(null);
  };

  const getColorConfig = (colorId?: string) => {
    return COLOR_OPTIONS.find((c) => c.id === colorId) || COLOR_OPTIONS[0];
  };

  return (
    <div
      id="target-position-group-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  จัดการกลุ่มสายงานเป้าหมาย (Target Job Groups)
                </h3>
                <span className="text-[11px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-medium">
                  {targetPositionGroups.length} กลุ่ม
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                เมนูสำหรับแอดมิน: เปลี่ยนชื่อ เพิ่ม ลบ แก้ไข กำหนดสีแท็ก และจัดหมวดหมู่กลุ่มสายงาน
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Top Actions & Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">สรุปการใช้งาน:</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                กรรมการ {committeeGroups.length} ชุด
              </span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                บุคลากร {users.filter((u) => u.role === 'staff').length} ท่าน
              </span>
            </div>

            {!isFormOpen && (
              <button
                type="button"
                id="btn-add-target-group"
                onClick={handleOpenAdd}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มกลุ่มสายงานเป้าหมายใหม่</span>
              </button>
            )}
          </div>

          {/* Inline Add / Edit Form */}
          {isFormOpen && (
            <div className="bg-blue-50/50 border-2 border-blue-200 rounded-2xl p-5 sm:p-6 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm sm:text-base">
                  <FolderPlus className="w-5 h-5 text-blue-600" />
                  <span>
                    {editingGroup
                      ? `แก้ไข / เปลี่ยนชื่อกลุ่ม: ${editingGroup.name}`
                      : 'เพิ่มกลุ่มสายงานเป้าหมายใหม่'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveForm} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Group Name */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      ชื่อกลุ่มสายงานเป้าหมาย <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น กลุ่มที่ 3: ลูกจ้างชั่วคราว ตำแหน่งสายวิชาชีพเฉพาะ"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Short Code */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      รหัสย่อ / ป้ายแท็ก
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="เช่น กลุ่มที่ 3 (วิชาชีพ)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    คำอธิบายและขอบเขตตำแหน่งงาน
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ระบุรายละเอียดตำแหน่งงาน วัตถุประสงค์ หรือมาตรฐานการประเมิน..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Color and Order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      เลือกสีแท็กของกลุ่ม
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((c) => {
                        const isSelected = selectedColor === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedColor(c.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                              c.bg
                            } ${c.text} ${
                              isSelected
                                ? `ring-2 ${c.ring} font-bold shadow-xs border-transparent`
                                : 'border-slate-200 opacity-80 hover:opacity-100'
                            }`}
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isSelected ? 'bg-current' : 'bg-slate-400'
                              }`}
                            />
                            <span>{c.name.split(' ')[0]}</span>
                            {isSelected && <Check className="w-3 h-3" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      ลำดับการแสดงผล (Sort Order)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={order}
                      onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end items-center gap-2 pt-4 border-t border-blue-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingGroup(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-white transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingGroup ? 'บันทึกการแก้ไข' : 'บันทึกกลุ่มใหม่'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Target Position Groups List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>รายชื่อกลุ่มสายงานเป้าหมายทั้งหมด ({targetPositionGroups.length} กลุ่ม)</span>
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {targetPositionGroups.map((group, index) => {
                const colorConfig = getColorConfig(group.color);
                const linkedCommittees = committeeGroups.filter(
                  (cg) => cg.targetPositionGroup === group.id || cg.targetPositionGroup === group.name
                );
                const linkedStaff = users.filter(
                  (u) =>
                    u.role === 'staff' &&
                    (u.positionGroup === group.id ||
                      (group.id === 'teacher_assistant' && u.position.includes('ครูผู้ช่วย')) ||
                      (group.id === 'support_staff' && !u.position.includes('ครูผู้ช่วย')))
                );

                return (
                  <div
                    key={group.id}
                    className={`bg-white rounded-xl border p-4 transition hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      editingGroup?.id === group.id
                        ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Left: Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          #{group.order || index + 1}
                        </span>
                        
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                        >
                          {group.code || group.name}
                        </span>

                        {group.isDefault && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-medium">
                            กลุ่มมาตรฐานระบบ
                          </span>
                        )}
                      </div>

                      <h5 className="text-sm sm:text-base font-bold text-slate-900">
                        {group.name}
                      </h5>

                      <p className="text-xs text-slate-500 leading-relaxed">
                        {group.description || 'ไม่มีคำอธิบายเพิ่มเติม'}
                      </p>

                      {/* Usage badges */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>คณะกรรมการที่ใช้กลุ่มนี้: <strong>{linkedCommittees.length}</strong> ชุด</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                          <span>บุคลากร/ผู้รับการประเมิน: <strong>{linkedStaff.length}</strong> ท่าน</span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(group)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition cursor-pointer"
                        title="แก้ไข / เปลี่ยนชื่อกลุ่ม"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>แก้ไข/เปลี่ยนชื่อ</span>
                      </button>

                      {deleteConfirmId === group.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(group.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                          >
                            ยืนยันลบ
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs transition cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(group.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="ลบกลุ่มสายงาน"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            ระบบจะซิงค์การเปลี่ยนแปลงกลุ่มสายงานกับ Firebase Firestore ทันที
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
