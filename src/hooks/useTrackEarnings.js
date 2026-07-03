// src/hooks/useTrackEarnings.js
import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "../utils/axiosInstance";

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
  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState("monthly");
  const [loadingChart, setLoadingChart] = useState(true);

  // ── Payouts table ─────────────────────────────────────────
  const [payouts, setPayouts] = useState([]);
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

  const debounceTimer = useRef(null);

  // ── Fetch stats ───────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await axiosInstance.get("/mentor/earnings");
      setStats({
        totalEarnings: res.data.totalEarnings || 0,
        sessionsThisMonth: res.data.sessionsThisMonth || 0,
        avgRating: res.data.avgRating || 0,
        pendingPayout: res.data.pendingPayout || 0,
        walletBalance: res.data.walletBalance || 0,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load earnings.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ── Fetch chart ───────────────────────────────────────────
  const fetchChart = useCallback(async (period) => {
    try {
      setLoadingChart(true);
      const res = await axiosInstance.get(
        `/mentor/earnings/chart?period=${period}`,
      );
      setChartData(res.data.data || []);
    } catch (err) {
      console.error("Chart fetch error:", err.message);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  // ── Fetch payouts ─────────────────────────────────────────
  const fetchPayouts = useCallback(
    async (currentPage, currentSearch, append = false) => {
      try {
        setLoadingPayouts(true);
        const params = new URLSearchParams({
          page: currentPage,
          limit: 10,
          ...(currentSearch ? { search: currentSearch } : {}),
        });
        const res = await axiosInstance.get(
          `/mentor/earnings/payouts?${params.toString()}`,
        );
        const newPayouts = res.data.payouts || [];
        setPayouts((prev) => (append ? [...prev, ...newPayouts] : newPayouts));
        setHasMore(res.data.pagination?.hasMore || false);
        setTotalCount(res.data.pagination?.totalCount || 0);
      } catch (err) {
        console.error("Payouts fetch error:", err.message);
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
  const handleChartPeriod = (period) => {
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
    return () => clearTimeout(debounceTimer.current);
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
      const res = await axiosInstance.post("/mentor/earnings/withdraw", {});
      setWithdrawMsg({ type: "success", text: res.data.message });
      setStats((prev) => ({ ...prev, walletBalance: 0 }));
      setTimeout(() => {
        setShowWithdraw(false);
        setWithdrawMsg({ type: "", text: "" });
      }, 1500);
    } catch (err) {
      setWithdrawMsg({
        type: "error",
        text: err?.response?.data?.message || "Withdrawal failed.",
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
