import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  FileEdit,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  ChevronDown,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Sparkles,
  Layers,
  Save,
} from 'lucide-react';
import { FormTemplate, RubricCategory, RubricIndicator, PositionGroup } from '../types';
import { STANDARD_POSITIONS_13 } from '../data/formTemplates';

export const FormManagementView: React.FC = () => {
  const {
    formTemplates,
    updateFormTemplate,
    addFormTemplate,
    deleteFormTemplate,
    resetFormTemplatesToDefault,
    setSelectedFormId,
    setActiveView,
  } = useApp();

  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate>(formTemplates[0] || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<FormTemplate | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmResetModal, setConfirmResetModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    'cat_1': true,
    'cat_2': true,
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleStartEdit = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setEditFormData(JSON.parse(JSON.stringify(template)));
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    // Recalculate total max score
    let totalScore = 0;
    editFormData.categories.forEach((cat) => {
      cat.indicators.forEach((ind) => {
        totalScore += Number(ind.weight) || 0;
      });
    });

    const updated = {
      ...editFormData,
      totalMaxScore: totalScore || 100,
    };

    updateFormTemplate(updated);
    setSelectedTemplate(updated);
    setIsEditing(false);
  };

  const handleUpdateIndicator = (
    catIdx: number,
    indIdx: number,
    field: keyof RubricIndicator,
    value: any
  ) => {
    if (!editFormData) return;
    const newCategories = [...editFormData.categories];
    newCategories[catIdx].indicators[indIdx] = {
      ...newCategories[catIdx].indicators[indIdx],
      [field]: field === 'weight' ? Number(value) : value,
    };
    setEditFormData({ ...editFormData, categories: newCategories });
  };

  const handleAddIndicator = (catIdx: number) => {
    if (!editFormData) return;
    const newCategories = [...editFormData.categories];
    const newInd: RubricIndicator = {
      id: 'ind_' + Date.now().toString(36),
      title: 'ตัวชี้วัดใหม่ (กำหนดข้อประเมิน)',
      description: 'ระบุพฤติกรรมหรือผลการปฏิบัติงานที่ต้องการวัดระดับ 5 คะแนน',
      weight: 5,
    };
    newCategories[catIdx].indicators.push(newInd);
    setEditFormData({ ...editFormData, categories: newCategories });
  };

  const handleDeleteIndicator = (catIdx: number, indIdx: number) => {
    if (!editFormData) return;
    const newCategories = [...editFormData.categories];
    newCategories[catIdx].indicators.splice(indIdx, 1);
    setEditFormData({ ...editFormData, categories: newCategories });
  };

  // Preview form in evaluation view
  const handleTestInForm = (templateId: string) => {
    setSelectedFormId(templateId);
    setActiveView('evaluate');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Rubrics & Evaluation Form Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            ระบบจัดการและแก้ไขแบบฟอร์มการประเมิน (แบบประเมินมาตรฐาน)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ปรับปรุงตัวชี้วัด ค่าน้ำหนักคะแนน เกณฑ์การให้คะแนน สำหรับครูผู้ช่วย สายสนับสนุน และพนักงานราชการทั่วไป ตำแหน่งครูผู้สอน
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setConfirmResetModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition cursor-pointer"
            title="รีเซ็ตแบบฟอร์มทั้งหมดเป็นค่ามาตรฐาน"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่ามาตรฐานทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Template Selector Sidebar + Detail/Editor Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Template List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-700" />
                <span>รายการแบบประเมิน ({formTemplates.length})</span>
              </h3>
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                เกณฑ์ 100 คะแนน
              </span>
            </div>

            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {formTemplates.map((template, idx) => {
                const isSelected = selectedTemplate?.id === template.id;
                const isTeacher = template.group === 'teacher_assistant';
                const isGovTeacher = template.group === 'government_employee_teacher';
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20'
                        : 'border-slate-200/80 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        isGovTeacher
                          ? 'bg-purple-600 text-white'
                          : isTeacher
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {template.code}
                        </span>
                        {template.isCustom && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
                        {template.positionTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {template.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Template Viewer / Editor (8 cols) */}
        <div className="lg:col-span-8">
          {selectedTemplate && !isEditing ? (
            /* VIEW MODE */
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {selectedTemplate.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      กลุ่ม: {selectedTemplate.group === 'teacher_assistant' ? 'ครูผู้ช่วย' : selectedTemplate.group === 'government_employee_teacher' ? 'พนักงานราชการ (ครูผู้สอน)' : 'สายสนับสนุน'}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    {selectedTemplate.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ตำแหน่งเป้าหมาย: <strong className="text-slate-800">{selectedTemplate.positionTitle}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestInForm(selectedTemplate.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ทดลองกรอกฟอร์ม</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(selectedTemplate)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขแบบประเมิน</span>
                  </button>
                </div>
              </div>

              {/* Rubric Categories */}
              <div className="space-y-4">
                {selectedTemplate.categories.map((cat, catIdx) => {
                  const isExpanded = expandedCategories[cat.id] !== false;
                  return (
                    <div
                      key={cat.id || catIdx}
                      className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 text-left transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-blue-700 text-white font-bold text-xs flex items-center justify-center">
                            {catIdx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                            <span className="text-xs text-blue-700 font-semibold">
                              สัดส่วนคะแนน {cat.weightPercentage}% ({cat.indicators.length} ตัวชี้วัด)
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-4 divide-y divide-slate-100">
                          {cat.indicators.map((ind, indIdx) => (
                            <div
                              key={ind.id || indIdx}
                              className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1 flex-1">
                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                  <span className="text-slate-400 font-mono">{catIdx + 1}.{indIdx + 1}</span>
                                  <span>{ind.title}</span>
                                </div>
                                <p className="text-slate-500 leading-relaxed pl-5">
                                  {ind.description}
                                </p>
                              </div>
                              <span className="shrink-0 bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-blue-100">
                                {ind.weight} คะแนน
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : isEditing && editFormData ? (
            /* EDIT MODE */
            <form onSubmit={handleSaveEdit} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase">โหมดแก้ไขแบบประเมิน</span>
                  <h3 className="text-lg font-bold text-slate-900">
                    แก้ไขแบบฟอร์ม: {editFormData.positionTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกการแก้ไข</span>
                  </button>
                </div>
              </div>

              {/* Form Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อแบบประเมิน
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ชื่อตำแหน่งงาน
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.positionTitle}
                    onChange={(e) => setEditFormData({ ...editFormData, positionTitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              {/* Categories & Indicators Editor */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-700" />
                  <span>หมวดหมู่และตัวชี้วัด (Rubric Indicators)</span>
                </h4>

                {editFormData.categories.map((cat, catIdx) => (
                  <div key={cat.id || catIdx} className="p-4 border border-slate-200 rounded-2xl space-y-4 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div className="flex-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase">
                          ชื่อตอนที่ {catIdx + 1}
                        </label>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => {
                            const newCats = [...editFormData.categories];
                            newCats[catIdx].name = e.target.value;
                            setEditFormData({ ...editFormData, categories: newCats });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:border-blue-600 outline-none"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase">
                          สัดส่วน (%)
                        </label>
                        <input
                          type="number"
                          value={cat.weightPercentage}
                          onChange={(e) => {
                            const newCats = [...editFormData.categories];
                            newCats[catIdx].weightPercentage = Number(e.target.value);
                            setEditFormData({ ...editFormData, categories: newCats });
                          }}
                          className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white focus:border-blue-600 outline-none"
                        />
                      </div>
                    </div>

                    {/* Indicators list */}
                    <div className="space-y-3">
                      {cat.indicators.map((ind, indIdx) => (
                        <div key={ind.id || indIdx} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-blue-700">
                              ตัวชี้วัดที่ {catIdx + 1}.{indIdx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="text-[11px] font-semibold text-slate-500">คะแนนเต็ม:</label>
                              <select
                                value={ind.weight}
                                onChange={(e) => handleUpdateIndicator(catIdx, indIdx, 'weight', e.target.value)}
                                className="px-2 py-1 text-xs font-bold border border-slate-300 rounded-md bg-slate-50 focus:border-blue-600 outline-none"
                              >
                                <option value={5}>5 คะแนน</option>
                                <option value={10}>10 คะแนน</option>
                                <option value={15}>15 คะแนน</option>
                                <option value={20}>20 คะแนน</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeleteIndicator(catIdx, indIdx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                title="ลบตัวชี้วัดนี้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={ind.title}
                            onChange={(e) => handleUpdateIndicator(catIdx, indIdx, 'title', e.target.value)}
                            placeholder="ชื่อตัวชี้วัด"
                            className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:border-blue-600 outline-none"
                          />

                          <textarea
                            value={ind.description}
                            onChange={(e) => handleUpdateIndicator(catIdx, indIdx, 'description', e.target.value)}
                            placeholder="คำอธิบายเกณฑ์การประเมิน"
                            rows={2}
                            className="w-full px-2.5 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg focus:border-blue-600 outline-none"
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddIndicator(catIdx)}
                        className="w-full py-2 border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl text-xs font-bold text-blue-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>เพิ่มตัวชี้วัดในหมวดนี้</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </form>
          ) : null}
        </div>

      </div>

      {/* CONFIRM RESET MODAL */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-indigo-700 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">คืนค่าแบบฟอร์มมาตรฐาน</h3>
                <p className="text-xs text-slate-500">โรงเรียนศึกษาพิเศษชัยนาท</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 my-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              คุณต้องการรีเซ็ตแบบฟอร์มประเมินทั้งหมดกลับสู่แบบฟอร์มมาตรฐานกระทรวง (ครูผู้ช่วย 1 แบบ + สายสนับสนุน 12 แบบ) ใช่หรือไม่?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  resetFormTemplatesToDefault();
                  setConfirmResetModal(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
              >
                ยืนยันคืนค่ามาตรฐาน
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
