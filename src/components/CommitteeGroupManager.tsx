import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  UserCheck,
  Shield,
  Layers,
  ArrowRight,
  Sliders,
  FolderCog,
  Briefcase,
} from 'lucide-react';
import { CommitteeGroup, User } from '../types';
import { TargetPositionGroupModal } from './TargetPositionGroupModal';

export const CommitteeGroupManager: React.FC = () => {
  const {
    committeeGroups,
    targetPositionGroups,
    users,
    currentUser,
    updateCommitteeGroup,
    addCommitteeGroup,
    deleteCommitteeGroup,
    aggregatedResults,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTargetGroupModalOpen, setIsTargetGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<CommitteeGroup | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [targetGroup, setTargetGroup] = useState<string>(
    targetPositionGroups[0]?.id || 'teacher_assistant'
  );
  const [description, setDescription] = useState('');
  const [selectedEvaluatorIds, setSelectedEvaluatorIds] = useState<string[]>([]);
  const [selectedEvaluateeIds, setSelectedEvaluateeIds] = useState<string[]>([]);

  const evaluators = users.filter((u) => u.role === 'evaluator' || u.role === 'admin');
  const staffEvaluatees = users.filter((u) => u.role === 'staff');

  const openCreateModal = () => {
    setEditingGroup(null);
    setName('');
    setTargetGroup(targetPositionGroups[0]?.id || 'teacher_assistant');
    setDescription('');
    setSelectedEvaluatorIds([]);
    setSelectedEvaluateeIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (group: CommitteeGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setTargetGroup(group.targetPositionGroup);
    setDescription(group.description);
    setSelectedEvaluatorIds([...group.evaluatorIds]);
    setSelectedEvaluateeIds([...group.assignedEvaluateeIds]);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('กรุณากรอกชื่อกลุ่มคณะกรรมการ');
      return;
    }

    if (selectedEvaluatorIds.length === 0) {
      alert('กรุณาเลือกกรรมการอย่างน้อย 1 ท่าน');
      return;
    }

    if (editingGroup) {
      updateCommitteeGroup({
        ...editingGroup,
        name,
        targetPositionGroup: targetGroup,
        description,
        evaluatorIds: selectedEvaluatorIds,
        assignedEvaluateeIds: selectedEvaluateeIds,
      });
    } else {
      addCommitteeGroup({
        name,
        targetPositionGroup: targetGroup,
        description,
        evaluatorIds: selectedEvaluatorIds,
        assignedEvaluateeIds: selectedEvaluateeIds,
      });
    }

    setIsModalOpen(false);
  };

  const toggleEvaluator = (id: string) => {
    setSelectedEvaluatorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleEvaluatee = (id: string) => {
    setSelectedEvaluateeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getTargetGroupInfo = (targetId: string) => {
    return (
      targetPositionGroups.find((g) => g.id === targetId || g.name === targetId) || {
        name:
          targetId === 'teacher_assistant'
            ? 'กลุ่มที่ 1 : ตำแหน่ง ครูผู้ช่วย (ลูกจ้างชั่วคราว)'
            : targetId === 'support_staff'
            ? 'กลุ่มที่ 2 : จ้างเหมาบริการทุกตำแหน่ง'
            : targetId === 'government_employee_teacher'
            ? 'กลุ่มที่ 3 : พนักงานราชการทั่วไป ตำแหน่ง ครูผู้สอน'
            : targetId,
        code: targetId,
        color: 'blue',
      }
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header & Actions */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-700" />
            <h2 className="text-xl font-bold text-slate-900">
              การจัดการกลุ่มคณะกรรมการ (Committee Grouping &amp; Scoring)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            กำหนดรายชื่อกรรมการผู้ประเมิน มอบหมายกลุ่มบุคลากร และกำหนดระบบเฉลี่ยคะแนนแบบกลุ่ม
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manage Target Job Groups Button */}
          <button
            type="button"
            id="btn-manage-target-job-groups"
            onClick={() => setIsTargetGroupModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer"
            title="เปลี่ยนชื่อ เพิ่ม ลบ แก้ไข กลุ่มสายงานเป้าหมาย"
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>จัดการกลุ่มสายงานเป้าหมาย</span>
            <span className="bg-blue-100 text-blue-800 text-[11px] px-1.5 py-0.5 rounded-full font-bold">
              {targetPositionGroups.length}
            </span>
          </button>

          {/* New Committee Group Button */}
          <button
            type="button"
            id="btn-create-committee-group"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างกลุ่มคณะกรรมการใหม่</span>
          </button>
        </div>
      </div>

      {/* Committee Group Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {committeeGroups.map((group, index) => {
          const groupEvaluators = users.filter((u) => group.evaluatorIds.includes(u.id));
          const groupEvaluatees = users.filter((u) => group.assignedEvaluateeIds.includes(u.id));
          const targetInfo = getTargetGroupInfo(group.targetPositionGroup);

          // Calculate Group Completion
          const groupResults = aggregatedResults.filter((r) => r.groupId === group.id);
          const completedCount = groupResults.filter((r) => r.isFullyEvaluated).length;

          return (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-blue-300 transition"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        ชุดที่ {index + 1}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {targetInfo.name}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                      {group.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(group)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                      title="แก้ไขข้อมูลกลุ่ม"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {committeeGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`คุณต้องการลบกลุ่ม "${group.name}" ใช่หรือไม่?`)) {
                            deleteCommitteeGroup(group.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="ลบกลุ่ม"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {group.description || 'ไม่มีคำอธิบายกลุ่ม'}
                </p>

                {/* Progress Mini Bar */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">ความคืบหน้ารวมกลุ่ม:</span>
                    <span className="font-bold text-blue-700">
                      เสร็จแล้ว {completedCount}/{groupResults.length} คน
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          groupResults.length > 0 ? (completedCount / groupResults.length) * 100 : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Evaluators List */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>คณะกรรมการในกลุ่ม ({groupEvaluators.length} ท่าน):</span>
                  </h4>
                  <div className="space-y-1.5">
                    {groupEvaluators.map((evaluator) => (
                      <div
                        key={evaluator.id}
                        className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-[10px] overflow-hidden shrink-0 shadow-2xs">
                          {(evaluator.avatar || evaluator.avatarUrl) ? (
                            <img
                              src={evaluator.avatar || evaluator.avatarUrl}
                              alt={evaluator.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            evaluator.name.charAt(0)
                          )}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-slate-800">{evaluator.name}</span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {evaluator.position}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assigned Evaluatees */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ผู้รับการประเมินที่ได้รับมอบหมาย ({groupEvaluatees.length} คน):</span>
                  </h4>
                  <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                    {groupEvaluatees.map((e) => (
                      <span
                        key={e.id}
                        className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium"
                      >
                        {e.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>สูตรคะแนน: เฉลี่ยถ่วงน้ำหนักเท่ากัน (Equal Mean)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Group Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingGroup ? 'แก้ไขกลุ่มคณะกรรมการ' : 'สร้างกลุ่มคณะกรรมการใหม่'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อกลุ่มคณะกรรมการ:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น คณะกรรมการชุดที่ 1 (กลุ่มสายวิชาการ/ครูผู้ช่วย)"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    กลุ่มสายงานเป้าหมาย:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTargetGroupModalOpen(true)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FolderCog className="w-3 h-3" />
                    <span>จัดการ/เพิ่มกลุ่มสายงาน</span>
                  </button>
                </div>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {targetPositionGroups.map((tg) => (
                    <option key={tg.id} value={tg.id}>
                      {tg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">คำอธิบายกลุ่ม:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="วัตถุประสงค์และขอบเขตการประเมิน..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Evaluators Select Multi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เลือกคณะกรรมการประจำกลุ่ม (อย่างน้อย 1 ท่าน):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {evaluators.map((ev) => {
                    const isChecked = selectedEvaluatorIds.includes(ev.id);
                    return (
                      <label
                        key={ev.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-blue-50 border-blue-400 font-bold text-blue-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEvaluator(ev.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="truncate">
                          <div>{ev.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{ev.position}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Evaluatees Select Multi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  เลือกผู้รับการประเมินที่มอบหมายให้กลุ่มนี้:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50">
                  {staffEvaluatees.map((st) => {
                    const isChecked = selectedEvaluateeIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEvaluatee(st.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="truncate">
                          <div>{st.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{st.position}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Position Groups Manager Modal */}
      <TargetPositionGroupModal
        isOpen={isTargetGroupModalOpen}
        onClose={() => setIsTargetGroupModalOpen(false)}
      />
    </div>
  );
};
