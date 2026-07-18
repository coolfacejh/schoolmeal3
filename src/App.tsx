import { useState, useEffect } from "react";
import { School, Search, Calendar as CalendarIcon, RotateCcw, AlertTriangle, HelpCircle, Utensils, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import SchoolSearchModal from "./components/SchoolSearchModal";
import CalendarSection from "./components/CalendarSection";
import MealDisplay from "./components/MealDisplay";
import { School as SchoolType, Meal } from "./types";

export default function App() {
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [mealsError, setMealsError] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Load school from localStorage on mount
  useEffect(() => {
    const cachedSchool = localStorage.getItem("selected_school");
    if (cachedSchool) {
      try {
        const parsed = JSON.parse(cachedSchool);
        setSelectedSchool(parsed);
      } catch (e) {
        console.error("Failed to parse cached school:", e);
        setIsSearchModalOpen(true);
      }
    } else {
      // Open modal automatically on first launch
      setIsSearchModalOpen(true);
    }
  }, []);

  // Format date helper (YYYYMMDD)
  const formatDateToYMD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  };

  const getKoreanDateString = (date: Date): string => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
  };

  // Fetch meals when school or date changes
  const fetchMeals = async () => {
    if (!selectedSchool) return;

    setLoadingMeals(true);
    setMealsError(null);
    setMeals([]);

    const dateStr = formatDateToYMD(selectedDate);

    try {
      const response = await fetch(
        `/api/meal?atptCode=${selectedSchool.atptCode}&schoolCode=${selectedSchool.schoolCode}&date=${dateStr}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "급식 정보를 가져오는 데 실패했습니다.");
      }

      setMeals(data.meals || []);
    } catch (err: any) {
      setMealsError(err.message || "나이스 서버로부터 데이터를 받지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoadingMeals(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [selectedSchool, selectedDate]);

  const handleSelectSchool = (school: SchoolType) => {
    setSelectedSchool(school);
    localStorage.setItem("selected_school", JSON.stringify(school));
    setIsSearchModalOpen(false);
  };

  const handleClearSchool = () => {
    setSelectedSchool(null);
    localStorage.removeItem("selected_school");
    setMeals([]);
    setIsSearchModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-800 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-md dark:border-slate-900 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
              <Utensils size={18} />
            </div>
            <div>
              <h1 className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-white">
                급식 한줄평
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">나이스 급식조회 & AI 평론</p>
            </div>
          </div>

          {selectedSchool && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-orange-200 hover:bg-orange-50/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-950/50"
            >
              <Search size={12} className="text-slate-400" />
              <span className="max-w-[120px] truncate sm:max-w-none">{selectedSchool.schoolName}</span>
              <span className="text-[10px] text-slate-400 font-normal">변경</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <AnimatePresence mode="wait">
          {!selectedSchool ? (
            /* ONBOARDING STATE */
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center justify-center text-center py-20"
            >
              <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                  <Utensils size={36} />
                </div>
                <div className="absolute -right-2 -bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-500 shadow-md border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                  <Award size={16} />
                </div>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                오늘 우리 학교 급식은 몇 점일까?
              </h2>
              <p className="mt-2 text-sm text-slate-500 max-w-md dark:text-slate-400">
                전국 초·중·고등학교의 급식 정보를 나이스 API로 가져오고, Gemini AI 요정이 기발하고 유쾌한 한줄평을 남겨드려요!
              </p>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchModalOpen(true)}
                className="mt-8 rounded-2xl bg-orange-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition-all"
              >
                나의 학교 등록하기
              </motion.button>
            </motion.div>
          ) : (
            /* MAIN APP LAYOUT */
            <motion.div
              key="app-main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-6 md:grid-cols-12"
            >
              {/* Left Column: Calendar and Quick school overview */}
              <div className="md:col-span-5 space-y-6">
                <CalendarSection selectedDate={selectedDate} onChange={setSelectedDate} />

                {/* School Details Info Panel */}
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-900 dark:bg-slate-950">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3.5 dark:border-slate-900">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <School size={14} className="text-orange-500" />
                      <span>내 학교 정보</span>
                    </div>
                    <button
                      onClick={handleClearSchool}
                      className="text-[10px] font-semibold text-red-500 hover:underline"
                    >
                      초기화
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {selectedSchool.schoolName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedSchool.atptName} ({selectedSchool.type})
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      행정표준학교코드: {selectedSchool.schoolCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Meal content */}
              <div className="md:col-span-7 space-y-5">
                {/* Active Date Label Banner */}
                <div className="flex items-center justify-between rounded-2xl bg-orange-50/50 border border-orange-100/30 px-5 py-4 dark:bg-orange-950/10">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-orange-500" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {getKoreanDateString(selectedDate)} 급식 식단
                    </span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {loadingMeals ? (
                    <motion.div
                      key="loading-meals"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-24 text-center text-slate-400"
                    >
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mb-3" />
                      <p className="text-xs font-medium">나이스 급식 식단을 가져오는 중...</p>
                    </motion.div>
                  ) : mealsError ? (
                    <motion.div
                      key="error-meals"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl border border-red-100 bg-red-50/40 p-5 text-center dark:border-red-950/20 dark:bg-red-950/10"
                    >
                      <AlertTriangle size={32} className="mx-auto text-red-500 mb-3" />
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">급식을 불러오지 못했습니다</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">{mealsError}</p>
                      <button
                        onClick={fetchMeals}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white border border-red-200 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 shadow-sm dark:bg-slate-900 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-slate-850"
                      >
                        <RotateCcw size={12} />
                        <span>다시 시도</span>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="display-meals"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <MealDisplay
                        meals={meals}
                        school={selectedSchool}
                        selectedDateStr={formatDateToYMD(selectedDate)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* School Setup Search Modal */}
      <SchoolSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => {
          if (selectedSchool) {
            setIsSearchModalOpen(false);
          }
        }}
        onSelect={handleSelectSchool}
      />
    </div>
  );
}
