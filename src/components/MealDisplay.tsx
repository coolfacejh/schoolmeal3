import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Utensils, Flame, Leaf, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Meal, School } from "../types";

interface MealDisplayProps {
  meals: Meal[];
  school: School | null;
  selectedDateStr: string;
}

const LOADING_PHRASES = [
  "위장에 군침 도는 드립 장전 중... 🍖",
  "영양사 선생님의 오늘 하루 고뇌 분석 중... 👩‍🍳",
  "급식실 이모님과의 환상적인 텔레파시 수신 중... 📡",
  "숟가락 각도 정밀 튜닝 중... 🥄",
  "맛있는 반찬들의 화려한 라인업 평가 중... 📈",
];

export default function MealDisplay({ meals, school, selectedDateStr }: MealDisplayProps) {
  const [activeMealIndex, setActiveMealIndex] = useState(0);
  const [review, setReview] = useState<string | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [loadingPhrase, setLoadingPhrase] = useState(LOADING_PHRASES[0]);

  // Expandable sections
  const [showNutrition, setShowNutrition] = useState(false);
  const [showOrigins, setShowOrigins] = useState(false);

  // Auto select lunch (mealCode "2") if available
  useEffect(() => {
    if (meals && meals.length > 0) {
      const lunchIndex = meals.findIndex((m) => m.mealCode === "2");
      if (lunchIndex !== -1) {
        setActiveMealIndex(lunchIndex);
      } else {
        setActiveMealIndex(0);
      }
    }
  }, [meals]);

  // Reset states when meal or date changes
  useEffect(() => {
    setReview(null);
    setReviewError(null);
  }, [activeMealIndex, selectedDateStr, meals]);

  const activeMeal = meals[activeMealIndex];

  // Rotate loading phrases during review generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadingReview) {
      interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * LOADING_PHRASES.length);
        setLoadingPhrase(LOADING_PHRASES[randomIndex]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [loadingReview]);

  const generateAIReview = async () => {
    if (!activeMeal || !school) return;

    setLoadingReview(true);
    setReviewError(null);
    setReview(null);
    setLoadingPhrase(LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]);

    try {
      const response = await fetch("/api/meal/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menu: activeMeal.menu,
          mealName: activeMeal.mealName,
          schoolName: school.schoolName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI 한줄평 생성에 실패했습니다.");
      }

      setReview(data.review);
    } catch (err: any) {
      setReviewError(err.message || "AI 평론가가 매점을 가버렸나 봅니다. 다시 시도해 주세요.");
    } finally {
      setLoadingReview(false);
    }
  };

  // Generate automatically if review is null and active meal exists
  useEffect(() => {
    if (activeMeal && !review && !loadingReview && !reviewError) {
      generateAIReview();
    }
  }, [activeMeal, selectedDateStr]);

  if (!meals || meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 px-6 text-center dark:border-slate-800 dark:bg-slate-950/20">
        <Utensils size={40} className="mb-4 text-slate-300 dark:text-slate-700 animate-pulse" />
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">조회된 급식 식단이 없습니다</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-xs dark:text-slate-500">
          주말, 공휴일, 방학 기간이거나 학교 측에서 식단을 아직 등록하지 않은 날짜일 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Meal Type Tabs (Breakfast, Lunch, Dinner) */}
      {meals.length > 1 && (
        <div className="flex rounded-xl bg-slate-100/80 p-1 dark:bg-slate-900/60">
          {meals.map((meal, index) => (
            <button
              key={meal.mealCode}
              onClick={() => setActiveMealIndex(index)}
              className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all ${
                activeMealIndex === index
                  ? "bg-white text-slate-800 shadow-sm dark:bg-slate-950 dark:text-orange-400"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {meal.mealName}
            </button>
          ))}
        </div>
      )}

      {/* Main Meal Card */}
      {activeMeal && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-900 dark:bg-slate-950">
          <div className="border-b border-slate-50 bg-slate-50/30 px-5 py-4 dark:border-slate-900 dark:bg-slate-900/10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded">
                {activeMeal.mealName}
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Flame size={14} className="text-orange-500" />
                {activeMeal.calories}
              </span>
            </div>
          </div>

          <div className="p-5">
            {/* Menu List */}
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activeMeal.menu.map((item, i) => (
                <motion.li
                  key={`${item}-${i}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2 rounded-xl bg-slate-50/50 p-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100/30 dark:bg-slate-900/30 dark:text-slate-300 dark:hover:bg-slate-900/50"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                  <span className="truncate">{item}</span>
                </motion.li>
              ))}
            </ul>

            {/* AI Review Speech Bubble Section */}
            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-900">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Sparkles size={14} className="text-orange-500 animate-spin" />
                  <span>급식 요정의 코믹 한줄평</span>
                </div>
                {review && !loadingReview && (
                  <button
                    onClick={generateAIReview}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-orange-500 transition-colors"
                  >
                    <RefreshCw size={11} />
                    <span>한줄평 새로고침</span>
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {loadingReview ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex flex-col items-center justify-center rounded-2xl bg-orange-50/30 border border-orange-100/30 p-6 text-center dark:bg-orange-950/10"
                  >
                    <div className="relative mb-3 flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                      <Sparkles size={14} className="absolute text-orange-500 animate-pulse" />
                    </div>
                    <span className="text-xs font-medium text-orange-700/80 dark:text-orange-400">
                      {loadingPhrase}
                    </span>
                  </motion.div>
                ) : reviewError ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-900/40 dark:border-slate-900"
                  >
                    <div className="flex gap-2 text-slate-600 dark:text-slate-400">
                      <AlertCircle size={16} className="shrink-0 mt-0.5 text-orange-400" />
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{reviewError}</p>
                        <p className="text-[10px]">클라우드 빌드 콘솔에서 API 키 설정을 확인하거나 일시적인 네트워크 장애일 수 있으니 새로고침을 시도해 보세요.</p>
                      </div>
                    </div>
                    <button
                      onClick={generateAIReview}
                      className="mt-3 w-full rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      다시 시도하기
                    </button>
                  </motion.div>
                ) : (
                  review && (
                    <motion.div
                      key="review"
                      initial={{ opacity: 0, scale: 0.98, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="relative rounded-2xl bg-orange-500/10 border border-orange-500/10 p-4 dark:bg-orange-400/5 dark:border-orange-400/10"
                    >
                      {/* Speech bubble tail */}
                      <div className="absolute -top-1.5 left-6 h-3 w-3 rotate-45 border-t border-l border-orange-500/10 bg-orange-50 dark:bg-slate-950 dark:border-transparent" />
                      <p className="text-sm font-semibold leading-relaxed text-orange-800 dark:text-orange-400">
                        "{review}"
                      </p>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>

            {/* Expandable Details (Nutrition, Origins) */}
            <div className="mt-6 space-y-2 border-t border-slate-50 pt-4 dark:border-slate-900">
              {/* Nutrition Toggle */}
              {activeMeal.nutrition && activeMeal.nutrition.length > 0 && (
                <div className="rounded-xl border border-slate-50/50 dark:border-slate-900">
                  <button
                    onClick={() => setShowNutrition(!showNutrition)}
                    className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50/50 dark:text-slate-400 dark:hover:bg-slate-900/50"
                  >
                    <span className="flex items-center gap-1.5">
                      <Leaf size={13} className="text-emerald-500" />
                      영양 성분 정보
                    </span>
                    {showNutrition ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <AnimatePresence>
                    {showNutrition && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50/50 px-4 pb-3 dark:bg-slate-900/20"
                      >
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {activeMeal.nutrition.map((item, i) => (
                            <span
                              key={i}
                              className="rounded-lg bg-white border border-slate-100 px-2 py-1 text-[10px] text-slate-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Origins Toggle */}
              {activeMeal.origins && activeMeal.origins.length > 0 && (
                <div className="rounded-xl border border-slate-50/50 dark:border-slate-900">
                  <button
                    onClick={() => setShowOrigins(!showOrigins)}
                    className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50/50 dark:text-slate-400 dark:hover:bg-slate-900/50"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle size={13} className="text-blue-500" />
                      원산지 정보
                    </span>
                    {showOrigins ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <AnimatePresence>
                    {showOrigins && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-slate-50/50 px-4 pb-3 dark:bg-slate-900/20"
                      >
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {activeMeal.origins.map((item, i) => (
                            <span
                              key={i}
                              className="rounded-lg bg-white border border-slate-100 px-2 py-1 text-[10px] text-slate-500 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
