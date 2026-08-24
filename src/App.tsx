import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { EvaluationFormView } from './components/EvaluationFormView';
import { CommitteeGroupManager } from './components/CommitteeGroupManager';
import { ReportsCenterView } from './components/ReportsCenterView';
import { RubricsCatalogView } from './components/RubricsCatalogView';
import { DatabaseSchemaModal } from './components/DatabaseSchemaModal';
import { EvaluationReportModal } from './components/EvaluationReportModal';
import { UserManagementView } from './components/UserManagementView';
import { FormManagementView } from './components/FormManagementView';
import { StaffPortalView } from './components/StaffPortalView';
import { SystemSettingsView } from './components/SystemSettingsView';
import { AggregatedResult } from './types';
import { ShieldCheck, Award } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { activeView, setActiveView, gradeThresholds, currentUser, systemSettings } = useApp();
  const [selectedReportResult, setSelectedReportResult] = useState<AggregatedResult | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-600 selection:text-white pb-16 lg:pb-0">
      {/* Top Navigation & Role Switcher */}
      <Navbar />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeView === 'dashboard' && (
          <Dashboard onOpenReport={(result) => setSelectedReportResult(result)} />
        )}

        {activeView === 'evaluate' && (
          <EvaluationFormView onEvaluationCompleted={() => setActiveView('dashboard')} />
        )}

        {activeView === 'users' && <UserManagementView />}

        {activeView === 'forms_admin' && <FormManagementView />}

        {activeView === 'my_evaluation' && (
          <StaffPortalView onOpenReport={(result) => setSelectedReportResult(result)} />
        )}

        {activeView === 'groups' && <CommitteeGroupManager />}

        {activeView === 'reports' && (
          <ReportsCenterView onOpenReport={(result) => setSelectedReportResult(result)} />
        )}

        {activeView === 'templates' && <RubricsCatalogView />}

        {activeView === 'settings' && <SystemSettingsView />}

        {activeView === 'schema' && <DatabaseSchemaModal />}
      </main>

      {/* Official Gov Report Modal */}
      <EvaluationReportModal
        result={selectedReportResult}
        onClose={() => setSelectedReportResult(null)}
        thresholds={gradeThresholds}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/90 bg-white py-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {systemSettings.logoUrl ? (
              <img src={systemSettings.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
            ) : (
              <Award className="w-4 h-4 text-blue-600" />
            )}
            <span className="font-bold text-slate-700">
              {systemSettings.appName} ({systemSettings.appShortName})
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{systemSettings.schoolName} • {systemSettings.schoolAffiliation}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
