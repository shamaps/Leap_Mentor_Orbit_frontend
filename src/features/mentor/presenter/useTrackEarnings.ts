// src/hooks/useTrackEarnings.js
import { useState, useEffect, useCallback, useRef } from "react";
import { getEarningsStats, getEarningsChart, getEarningsPayouts, withdrawEarnings } from "@/features/mentor/model/earnings.api";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import logger from "@/shared/utils/logger";

export interface EarningsChartPoint {
  label: string;
  amount: number;
}

export interface PayoutRow {
  id: string;
  date: string;
  menteeName: string;
  sessionType: string;
  duration: string;
  amount: number;
  status: string;
}

const useTrackEarnings = () => {
  // ── Stats ─────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalEarnings: 0,
    sessionsThisMonth: 0,
    avgRating: 0,
    pendingPayout: 0,
    walletBalance: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // ── Chart ─────────────────────────────────────────────────
  const [chartData, setChartData] = useState<EarningsChartPoint[]>([]);
  const [chartPeriod, setChartPeriod] = useState("monthly");
  const [loadingChart, setLoadingChart] = useState(true);

  // ── Payouts table ─────────────────────────────────────────
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // ── Withdraw modal ────────────────────────────────────────
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState({ type: "", text: "" });

  // ── Error ─────────────────────────────────────────────────
  const [error, setError] = useState("");

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch stats ───────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await getEarningsStats();
      setStats({
        totalEarnings: res.data.totalEarnings || 0,
        sessionsThisMonth: res.data.sessionsThisMonth || 0,
        avgRating: res.data.avgRating || 0,
        pendingPayout: res.data.pendingPayout || 0,
        walletBalance: res.data.walletBalance || 0,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load earnings."));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── Fetch chart ───────────────────────────────────────────
  const fetchChart = useCallback(async (period: string) => {
    try {
      setLoadingChart(true);
      const res = await getEarningsChart(period);
      setChartData(res.data.data || []);
    } catch (err: unknown) {
      logger.warn("Chart fetch error", { message: getErrorMessage(err, "Failed to load chart.") });
    } finally {
      setLoadingChart(false);
    }
  }, []);

  // ── Fetch payouts ─────────────────────────────────────────
  const fetchPayouts = useCallback(
    async (currentPage: number, currentSearch: string, append = false) => {
      try {
        setLoadingPayouts(true);
        const res = await getEarningsPayouts(currentPage, 10, currentSearch);
        const newPayouts = res.data.payouts || [];
        setPayouts((prev) => (append ? [...prev, ...newPayouts] : newPayouts));
        setHasMore(res.data.pagination?.hasMore || false);
        setTotalCount(res.data.pagination?.totalCount || 0);
      } catch (err: unknown) {
        logger.warn("Payouts fetch error", { message: getErrorMessage(err, "Failed to load payouts.") });
      } finally {
        setLoadingPayouts(false);
      }
    },
    [],
  );

  // ── On mount ──────────────────────────────────────────────
  useEffect(() => {
    fetchStats();
    fetchChart("monthly");
    fetchPayouts(1, "");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chart period toggle ───────────────────────────────────
  const handleChartPeriod = (period: string) => {
    setChartPeriod(period);
    fetchChart(period);
  };

  // ── Debounced search ──────────────────────────────────────
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      fetchPayouts(1, search);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load more ─────────────────────────────────────────────
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPayouts(nextPage, search, true);
  };

  // ── Prev / Next ───────────────────────────────────────────
  const goNext = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPayouts(nextPage, search);
  };

  const goPrev = () => {
    const prevPage = Math.max(1, page - 1);
    setPage(prevPage);
    fetchPayouts(prevPage, search);
  };

  // ── Withdraw ──────────────────────────────────────────────
  const handleWithdraw = async () => {
    try {
      setWithdrawing(true);
      setWithdrawMsg({ type: "", text: "" });
      const res = await withdrawEarnings();
      setWithdrawMsg({ type: "success", text: res.data.message });
      setStats((prev) => ({ ...prev, walletBalance: 0 }));
      setTimeout(() => {
        setShowWithdraw(false);
        setWithdrawMsg({ type: "", text: "" });
      }, 1500);
    } catch (err: unknown) {
      setWithdrawMsg({
        type: "error",
        text: getErrorMessage(err, "Withdrawal failed."),
      });
    } finally {
      setWithdrawing(false);
    }
  };

  return {
    stats,
    loadingStats,
    chartData,
    chartPeriod,
    loadingChart,
    payouts,
    loadingPayouts,
    search,
    setSearch,
    page,
    hasMore,
    totalCount,
    error,
    showWithdraw,
    setShowWithdraw,
    withdrawing,
    withdrawMsg,
    handleChartPeriod,
    loadMore,
    goNext,
    goPrev,
    handleWithdraw,
    fetchStats,
  };
};

export default useTrackEarnings;