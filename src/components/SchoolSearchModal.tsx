import React, { useState, useEffect } from "react";
import { Search, MapPin, School as SchoolIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { School } from "../types";

interface SchoolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (school: School) => void;
}

export default function SchoolSearchModal({ isOpen, onClose, onSelect }: SchoolSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSchools([]);
      setError(null);
    }
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    setSchools([]);

    try {
      const response = await fetch(`/api/school/search?name=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "학교 검색 중 오류가 발생했습니다.");
      }

      setSchools(data.schools || []);
    } catch (err: any) {
      setError(err.message || "학교 정보를 불러오지 못했습니다. 학교명을 확인하고 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-150 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-orange-100 p-1.5 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <SchoolIcon size={20} />
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">나의 학교 설정</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <form onSubmit={handleSearch} className="relative mb-5 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="학교명을 입력하세요 (예: 서울고, 광남중)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-4 pl-10 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500/30 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-orange-500 dark:focus:bg-slate-950"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-orange-500 px-5 text-sm font-medium text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-55"
                >
                  {loading ? "검색 중" : "검색"}
                </button>
              </form>

              {/* Status and Results */}
              <div className="max-h-64 overflow-y-auto pr-1">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    <p className="mt-3 text-xs">학교 정보를 찾고 있어요...</p>
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
                    {error}
                  </div>
                )}

                {!loading && !error && schools.length === 0 && searchTerm && (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-sm">검색 결과가 없습니다.</p>
                    <p className="mt-1 text-xs">학교 이름을 정확하게 입력해 주세요.</p>
                  </div>
                )}

                {!loading && !error && schools.length === 0 && !searchTerm && (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-sm">급식을 조회할 학교를 먼저 등록하세요.</p>
                    <p className="mt-1 text-xs">전국 모든 초·중·고등학교 조회가 가능합니다.</p>
                  </div>
                )}

                {!loading && schools.length > 0 && (
                  <div className="space-y-2">
                    {schools.map((school) => (
                      <motion.button
                        key={school.schoolCode}
                        whileHover={{ y: -1, scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => onSelect(school)}
                        className="flex w-full flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-left transition-colors hover:border-orange-100 hover:bg-orange-50/20 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-orange-900/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {school.schoolName}
                          </span>
                          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {school.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <MapPin size={12} className="shrink-0 text-slate-400" />
                          <span className="truncate">{school.address}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {school.atptName} · 코드: {school.schoolCode}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
