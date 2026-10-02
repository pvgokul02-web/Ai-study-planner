import React, { useState } from 'react';
import { X, Download, Printer, Calendar, FileCode, Check, Copy } from 'lucide-react';
import { StudyPlan } from '../types';
import { exportStudyPlanToICS } from '../utils/icsExport';

interface ExportModalProps {
  plan: StudyPlan;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ plan, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportICS = () => {
    exportStudyPlanToICS(plan);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 relative space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 font-display">
              Export & Share Your Study Schedule
            </h3>
            <p className="text-xs text-neutral-500">
              Synchronize with your favorite calendar, print for your desk, or export backup.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* iCal / Google Calendar */}
          <div className="p-4 rounded-2xl border border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  iCalendar (.ics) File
                </h4>
                <p className="text-xs text-neutral-500">
                  Import directly into Google Calendar, Apple Calendar, or Outlook
                </p>
              </div>
            </div>
            <button
              id="btn-export-ics"
              type="button"
              onClick={handleExportICS}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>

          {/* Printable Timetable */}
          <div className="p-4 rounded-2xl border border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  Print / Save as PDF
                </h4>
                <p className="text-xs text-neutral-500">
                  Formatted high-contrast print layout for physical revision desks
                </p>
              </div>
            </div>
            <button
              id="btn-print-schedule"
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs flex items-center gap-1.5 transition shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print View</span>
            </button>
          </div>

          {/* JSON Backup */}
          <div className="p-4 rounded-2xl border border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  Copy Plan Data (JSON)
                </h4>
                <p className="text-xs text-neutral-500">
                  Store or transfer your complete schedule data
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyJSON}
              className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs flex items-center gap-1.5 transition shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
