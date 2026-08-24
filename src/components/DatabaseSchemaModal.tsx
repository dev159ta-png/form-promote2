import React, { useState } from 'react';
import {
  Database,
  Layers,
  Copy,
  Check,
  Code2,
  FileJson,
  Download,
  Server,
  Cloud,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DatabaseSchemaModal: React.FC = () => {
  const { users, committeeGroups, submissions, formTemplates, auditLogs } = useApp();
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'er' | 'firestore' | 'sql' | 'json'>('er');

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadBackup = () => {
    const data = {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      users,
      committeeGroups,
      formTemplates,
      submissions,
      auditLogs,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pes_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profile access
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }

    // Committee Groups
    match /committee_groups/{groupId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }

    // Form Templates (13 official evaluation positions)
    match /form_templates/{templateId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'admin';
    }

    // Evaluation Submissions with Anti-Impersonation verification
    match /evaluation_submissions/{submissionId} {
      allow read: if request.auth != null;
      // Evaluator can only write if they match request.auth.uid (Prevent Impersonation)
      allow create: if request.auth != null && 
        request.resource.data.evaluatorId == request.auth.uid &&
        request.resource.data.signatureDataUrl != null;
      allow update: if request.auth != null && 
        resource.data.evaluatorId == request.auth.uid &&
        request.resource.data.isDraft == true;
      allow delete: if request.auth.token.role == 'admin';
    }

    // Audit Logs (Immutable append-only)
    match /audit_logs/{logId} {
      allow read: if request.auth.token.role == 'admin';
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}`;

  const postgresSql = `-- Performance Evaluation System (PostgreSQL DDL)
-- Compatible with Vercel Postgres / Google Cloud SQL / Supabase

CREATE TYPE user_role AS ENUM ('admin', 'evaluator', 'staff');
CREATE TYPE position_group AS ENUM ('teacher_assistant', 'support_staff');
CREATE TYPE grade_level AS ENUM ('ปรับปรุง', 'พอใช้', 'ดี', 'ดีมาก', 'ยอดเยี่ยม');

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'staff',
    group_id VARCHAR(64),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Committee Groups Table
CREATE TABLE committee_groups (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_position_group position_group NOT NULL,
    description TEXT,
    evaluator_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    assigned_evaluatee_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Evaluation Form Templates Table (13 Positions)
CREATE TABLE form_templates (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    group_type position_group NOT NULL,
    categories JSONB NOT NULL, -- Nested Rubrics, Weights and Indicators
    total_max_score NUMERIC(5,2) DEFAULT 100.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Evaluation Submissions Table
CREATE TABLE evaluation_submissions (
    id VARCHAR(64) PRIMARY KEY,
    evaluatee_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evaluator_id VARCHAR(64) NOT NULL REFERENCES users(id),
    evaluator_name VARCHAR(255) NOT NULL,
    evaluator_position VARCHAR(255) NOT NULL,
    group_id VARCHAR(64) NOT NULL REFERENCES committee_groups(id),
    form_id VARCHAR(64) NOT NULL REFERENCES form_templates(id),
    
    scores JSONB NOT NULL, -- Itemized scores per indicator { "ind_1": 5, "ind_2": 4 }
    category_scores JSONB NOT NULL,
    total_score NUMERIC(6,2) NOT NULL,
    max_score NUMERIC(6,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    grade grade_level NOT NULL,
    
    comments JSONB, -- { strengths, improvements, general }
    signature_data_url TEXT, -- Digital signature image Base64
    is_draft BOOLEAN DEFAULT false,
    ai_feedback JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_evaluator_evaluatee_form UNIQUE(evaluatee_id, evaluator_id, form_id)
);

-- 5. Audit Trail Logs Table
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for high-performance querying
CREATE INDEX idx_eval_sub_evaluatee ON evaluation_submissions(evaluatee_id);
CREATE INDEX idx_eval_sub_group ON evaluation_submissions(group_id);
CREATE INDEX idx_eval_sub_grade ON evaluation_submissions(grade);
`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-700" />
            <h2 className="text-xl font-bold text-slate-900">
              สถาปัตยกรรมฐานข้อมูล &amp; ER Diagram (Database Architecture)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            รองรับโครงสร้างผู้ใช้, กลุ่มกรรมการ, รายชื่อผู้รับการประเมิน, และการเก็บคะแนนย่อยในแต่ละข้อประเมิน (Firebase Firestore / Cloud SQL / PostgreSQL)
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadBackup}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>ดาวน์โหลด JSON Backup</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'er', label: '1. แผนภาพ ER Diagram', icon: Layers },
          { id: 'firestore', label: '2. Firebase Security Rules', icon: Cloud },
          { id: 'sql', label: '3. PostgreSQL / Cloud SQL DDL', icon: Server },
          { id: 'json', label: '4. Live JSON Snapshot', icon: FileJson },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Interactive ER Diagram */}
      {activeTab === 'er' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Table 1: Users */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <span className="font-bold text-sm font-mono">users</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">Collection / Table</span>
            </div>
            <div className="p-4 divide-y divide-slate-100 text-xs font-mono space-y-1">
              <div className="py-1 flex justify-between font-bold text-blue-700">
                <span>🔑 id</span>
                <span className="text-slate-400">VARCHAR(64) PK</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>name</span>
                <span className="text-slate-400">VARCHAR (ชื่อ-นามสกุล)</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>position</span>
                <span className="text-slate-400">VARCHAR (ตำแหน่ง)</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>department</span>
                <span className="text-slate-400">VARCHAR (ฝ่าย/กลุ่มงาน)</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>role</span>
                <span className="text-slate-400">admin | evaluator | staff</span>
              </div>
              <div className="py-1 flex justify-between text-slate-500">
                <span>🔗 group_id</span>
                <span className="text-slate-400">FK &rarr; committee_groups</span>
              </div>
            </div>
          </div>

          {/* Table 2: Committee Groups */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <span className="font-bold text-sm font-mono">committee_groups</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">Collection / Table</span>
            </div>
            <div className="p-4 divide-y divide-slate-100 text-xs font-mono space-y-1">
              <div className="py-1 flex justify-between font-bold text-blue-700">
                <span>🔑 id</span>
                <span className="text-slate-400">VARCHAR(64) PK</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>name</span>
                <span className="text-slate-400">VARCHAR (ชื่อกลุ่มกรรมการ)</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>target_position_group</span>
                <span className="text-slate-400">teacher | support</span>
              </div>
              <div className="py-1 flex justify-between text-slate-500">
                <span>evaluator_ids</span>
                <span className="text-slate-400">JSONB Array [User_IDs]</span>
              </div>
              <div className="py-1 flex justify-between text-slate-500">
                <span>assigned_evaluatee_ids</span>
                <span className="text-slate-400">JSONB Array [User_IDs]</span>
              </div>
            </div>
          </div>

          {/* Table 3: Form Templates */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <span className="font-bold text-sm font-mono">form_templates</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">13 Positions</span>
            </div>
            <div className="p-4 divide-y divide-slate-100 text-xs font-mono space-y-1">
              <div className="py-1 flex justify-between font-bold text-blue-700">
                <span>🔑 id</span>
                <span className="text-slate-400">VARCHAR(64) PK</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>code</span>
                <span className="text-slate-400">VARCHAR (T-01, S-01..S-12)</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>title</span>
                <span className="text-slate-400">VARCHAR (ชื่อแบบประเมิน)</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>categories</span>
                <span className="text-slate-400">JSONB (หมวดหมู่ &amp; ตัวชี้วัด)</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>total_max_score</span>
                <span className="text-slate-400">NUMERIC(100.0)</span>
              </div>
            </div>
          </div>

          {/* Table 4: Evaluation Submissions */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden md:col-span-2">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <span className="font-bold text-sm font-mono">evaluation_submissions (คะแนนรายข้อ &amp; ผลรวม)</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">Core Scoring Records</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-blue-700">
                  <span>🔑 id</span>
                  <span className="text-slate-400">VARCHAR(64) PK</span>
                </div>
                <div className="flex justify-between">
                  <span>🔗 evaluatee_id</span>
                  <span className="text-slate-400">FK &rarr; users.id</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>🔒 evaluator_id</span>
                  <span className="text-slate-400">FK (Anti-Impersonation)</span>
                </div>
                <div className="flex justify-between">
                  <span>evaluator_name</span>
                  <span className="text-slate-400">VARCHAR (Auto-filled)</span>
                </div>
                <div className="flex justify-between">
                  <span>🔗 form_id</span>
                  <span className="text-slate-400">FK &rarr; form_templates.id</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-blue-600 font-bold">
                  <span>scores</span>
                  <span className="text-slate-400">JSONB {'{ ind_1: 5, ind_2: 4 }'}</span>
                </div>
                <div className="flex justify-between">
                  <span>total_score / max</span>
                  <span className="text-slate-400">NUMERIC (คะแนนที่ได้)</span>
                </div>
                <div className="flex justify-between font-bold text-purple-700">
                  <span>percentage / grade</span>
                  <span className="text-slate-400">NUMERIC / 5-tier Grade</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>signature_data_url</span>
                  <span className="text-slate-400">TEXT (PNG Base64 Seal)</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>submitted_at</span>
                  <span className="text-slate-400">TIMESTAMP ISO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table 5: Audit Trail */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <span className="font-bold text-sm font-mono">audit_logs</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-mono">Security Trail</span>
            </div>
            <div className="p-4 divide-y divide-slate-100 text-xs font-mono space-y-1">
              <div className="py-1 flex justify-between font-bold text-blue-700">
                <span>🔑 id</span>
                <span className="text-slate-400">VARCHAR(64) PK</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>user_id / user_name</span>
                <span className="text-slate-400">VARCHAR</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>action</span>
                <span className="text-slate-400">SUBMIT | UPDATE | LOGIN</span>
              </div>
              <div className="py-1 flex justify-between">
                <span>timestamp</span>
                <span className="text-slate-400">TIMESTAMP</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Firebase Security Rules */}
      {activeTab === 'firestore' && (
        <div className="bg-slate-950 text-slate-200 rounded-2xl p-5 font-mono text-xs overflow-x-auto shadow-xl relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Cloud className="w-4 h-4" />
              <span>firestore.rules (กฎความปลอดภัยป้องกันการสวมรอย)</span>
            </div>
            <button
              onClick={() => handleCopy(firestoreRules, 'firestore')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition cursor-pointer"
            >
              {copiedType === 'firestore' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกโค้ด</span>
                </>
              )}
            </button>
          </div>
          <pre>{firestoreRules}</pre>
        </div>
      )}

      {/* Tab 3: PostgreSQL / Cloud SQL DDL */}
      {activeTab === 'sql' && (
        <div className="bg-slate-950 text-slate-200 rounded-2xl p-5 font-mono text-xs overflow-x-auto shadow-xl relative">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-blue-400 font-bold">
              <Server className="w-4 h-4" />
              <span>schema.sql (PostgreSQL / Google Cloud SQL DDL)</span>
            </div>
            <button
              onClick={() => handleCopy(postgresSql, 'sql')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition cursor-pointer"
            >
              {copiedType === 'sql' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกโค้ด SQL</span>
                </>
              )}
            </button>
          </div>
          <pre>{postgresSql}</pre>
        </div>
      )}

      {/* Tab 4: Live JSON Snapshot */}
      {activeTab === 'json' && (
        <div className="bg-slate-950 text-slate-200 rounded-2xl p-5 font-mono text-xs overflow-x-auto shadow-xl relative max-h-[600px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <span className="text-amber-400 font-bold">
              Live State JSON (ข้อมูลสด {submissions.length} รายการประเมิน, {committeeGroups.length} กลุ่มกรรมการ)
            </span>
            <button
              onClick={() =>
                handleCopy(
                  JSON.stringify({ users, committeeGroups, submissions, formTemplates }, null, 2),
                  'json'
                )
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs transition cursor-pointer"
            >
              {copiedType === 'json' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอก JSON</span>
                </>
              )}
            </button>
          </div>
          <pre>{JSON.stringify({ users, committeeGroups, submissions }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
