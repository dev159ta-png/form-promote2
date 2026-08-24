import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Layers,
  ChevronRight,
  ClipboardList,
  ArrowUpRight,
} from 'lucide-react';
import { FormTemplate } from '../types';

export const RubricsCatalogView: React.FC = () => {
  const { formTemplates, setSelectedFormId, setActiveView } = useApp();
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate>(formTemplates[0]);

  const teacherForms = formTemplates.filter((t) => t.group === 'teacher_assistant');
  const supportForms = formTemplates.filter((t) => t.group === 'support_staff');
  const govTeacherForms = formTemplates.filter((t) => t.group === 'government_employee_teacher');

  const handleStartEvaluateWithForm = (formId: string) => {
    setSelectedFormId(formId);
    setActiveView('evaluate');
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-700" />
            <h2 className="text-xl font-bold text-slate-900">
              คลังเกณฑ์การประเมินตำแหน่งงาน (Official Rubrics Standard)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            เกณฑ์มาตรฐานตัวชี้วัดผลสัมฤทธิ์และคุณลักษณะเฉพาะตำแหน่ง จำแนกตาม 3 กลุ่มหลัก
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
          <Award className="w-4 h-4" />
          <span>ครอบคลุมครบทุกกลุ่มสายงาน 100% ตามระเบียบราชการ</span>
        </div>
      </div>

      {/* Main 2-Column Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Selector List */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Group 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>กลุ่มที่ 1: ลูกจ้างชั่วคราว ตำแหน่งครูผู้ช่วย</span>
            </h3>
            <div className="space-y-1.5">
              {teacherForms.map((t) => {
                const isSelected = selectedTemplate?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-mono font-bold opacity-80">{t.code}</div>
                      <div className="text-xs sm:text-sm font-bold">{t.title}</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 3: พนักงานราชการทั่วไป ตำแหน่ง ครูผู้สอน */}
          {govTeacherForms.length > 0 && (
            <div className="bg-white rounded-2xl border border-purple-200 p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>กลุ่มที่ 3: พนักงานราชการทั่วไป ตำแหน่ง ครูผู้สอน</span>
              </h3>
              <div className="space-y-1.5">
                {govTeacherForms.map((t) => {
                  const isSelected = selectedTemplate?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                          : 'bg-purple-50/40 hover:bg-purple-50 border-purple-100 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono font-bold opacity-80">{t.code}</div>
                        <div className="text-xs sm:text-sm font-bold">{t.title}</div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>กลุ่มที่ 2: ลูกจ้างชั่วคราว สายสนับสนุน/ปฏิบัติงาน (12 ตำแหน่ง)</span>
            </h3>
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {supportForms.map((t) => {
                const isSelected = selectedTemplate?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono font-bold opacity-80">{t.code}</div>
                      <div className="text-xs font-bold">{t.title}</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Rubric Indicators & Weight Viewer */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                รหัส: {selectedTemplate.code}
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                {selectedTemplate.title}
              </h3>
              <p className="text-xs text-slate-500">
                ตำแหน่งเป้าหมาย: <span className="font-semibold text-slate-800">{selectedTemplate.positionTitle}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleStartEvaluateWithForm(selectedTemplate.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer whitespace-nowrap"
            >
              <span>ใช้แบบฟอร์มนี้ประเมิน</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rubric Categories */}
          <div className="space-y-4">
            {selectedTemplate.categories.map((cat, idx) => (
              <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-900 text-white p-3 flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span>{cat.name}</span>
                  <span className="text-blue-200 bg-white/10 px-2.5 py-0.5 rounded-full text-xs font-mono">
                    สัดส่วน {cat.weightPercentage}%
                  </span>
                </div>

                <div className="divide-y divide-slate-100 p-2">
                  {cat.indicators.map((ind, indIdx) => (
                    <div key={ind.id} className="p-3 text-xs space-y-1">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{ind.title}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] pl-5 leading-relaxed">
                        {ind.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Scale Guidance */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800">เกณฑ์การให้คะแนนมาตรฐาน:</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 font-bold">
                ระดับ 1: ปรับปรุง
              </div>
              <div className="p-2 rounded bg-orange-50 border border-orange-200 text-orange-800 font-bold">
                ระดับ 2: พอใช้
              </div>
              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                ระดับ 3: ดี
              </div>
              <div className="p-2 rounded bg-blue-50 border border-blue-200 text-blue-800 font-bold">
                ระดับ 4: ดีมาก
              </div>
              <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                ระดับ 5: ยอดเยี่ยม
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
