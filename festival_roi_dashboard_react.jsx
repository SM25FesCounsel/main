import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";
import { Download, Info, Upload, Filter, RefreshCw, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ————————————————————————————————————————————————
// Festival ROI Dashboard — Single‑file React component
// • TailwindCSS for layout & styling
// • shadcn/ui (Card, Button) for consistent UI
// • Recharts for visualizations
// • CSV upload (Papa Parse)
// • Lightweight Tag Cloud + sortable table
// ————————————————————————————————————————————————

// Optional: if your build system supports dynamic import, this keeps PapaParse out of the main bundle
// Fallback: a tiny CSV parser is included if dynamic import fails.
let Papa: any = null;
async function ensurePapa() {
  if (Papa) return Papa;
  try {
    const mod = await import("papaparse");
    Papa = mod.default || mod;
  } catch (e) {
    // very small fallback (expects simple, comma‑only CSV with header)
    Papa = {
      parse: (text: string, opts: any) => {
        const lines = text.trim().split(/\r?\n/);
        const header = lines.shift()?.split(",") || [];
        const data = lines.map((l) =>
          l.split(",").reduce((o: any, v, i) => ((o[header[i]] = v), o), {})
        );
        opts?.complete?.({ data });
      },
    };
  }
  return Papa;
}

// ————————————————————————————————————————————————
// Data model (expected columns for CSV):
// date (YYYY-MM-DD), festival, region, channel, spend, revenue, impressions, clicks, visits, tickets, visitors, ltv
// Example row:
// 2025-08-11, HanRiver Lights, Seoul, Social, 12000000, 48000000, 1500000, 65000, 42000, 10500, 38000, 52000
// ————————————————————————————————————————————————

type Row = {
  date: string; // YYYY-MM-DD
  festival: string;
  region: string; // e.g., Seoul, Busan, etc.
  channel: string; // Social, Search, OOH, Onsite, Email, Partner, etc.
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  visits: number;
  tickets: number; // purchases
  visitors: number; // on-site attendees
  ltv?: number; // optional lifetime value (per attendee)
};

// Utility: toNumber safely
const N = (v: any) => (v == null || v === "" || isNaN(Number(v)) ? 0 : Number(v));

// Mock data generator — tweak as needed
function mockData(): Row[] {
  const festivals = [
    "HanRiver Lights",
    "Jeju Breeze Fest",
    "Busan Harbor Wave",
    "Chungnam Culture Days",
    "Incheon Sky Lanterns",
  ];
  const regions = ["Seoul", "Jeju", "Busan", "Chungnam", "Incheon"];
  const channels = ["Social", "Search", "OOH", "Onsite", "Email", "Partner"];
  const start = new Date("2025-07-01").getTime();
  const out: Row[] = [];
  for (let d = 0; d < 80; d++) {
    const date = new Date(start + d * 86400000);
    const ds = date.toISOString().slice(0, 10);
    for (const f of festivals) {
      const region = regions[festivals.indexOf(f)];
      const channel = channels[Math.floor(Math.random() * channels.length)];
      // 전체적으로 축소된 스케일
      const spend = Math.round(200_000 + Math.random() * 1_800_000); // 10분의 1 수준으로 축소
      const impressions = Math.round(spend * (5 + Math.random() * 10));
      const clicks = Math.round(impressions * (0.01 + Math.random() * 0.04));
      const visits = Math.round(clicks * (0.2 + Math.random() * 0.35));
      const tickets = Math.round(visits * (0.08 + Math.random() * 0.15));
      const arppu = 3000 + Math.random() * 2000; // 평균 결제금액도 1/10로 축소
      const revenue = Math.round(tickets * arppu);
      const visitors = Math.round(tickets * (1.3 + Math.random() * 0.8));
      const ltv = Math.round(2500 + Math.random() * 5500);
      
      out.push({
        date: ds,
        festival: f,
        region,
        channel,
        spend,
        revenue,
        impressions,
        clicks,
        visits,
        tickets,
        visitors,
        ltv,
      });
    }
  }
  return out;
}

// Linear regression for scatter trendline (y = a + b x)
function linearRegression(points: Array<{ x: number; y: number }>) {
  const n = points.length;
  if (!n) return { a: 0, b: 0 };
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }
  const b = (n * sumXY - sumX * sumY) / Math.max(1, n * sumXX - sumX * sumX);
  const a = sumY / n - b * (sumX / n);
  return { a, b };
}

// KPI helpers
const fmtKRW = (n: number) =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(n);
const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));

function computeKPIs(rows: Row[]) {
  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalVisitors = rows.reduce((s, r) => s + (r.visitors || 0), 0);
  const totalTickets = rows.reduce((s, r) => s + (r.tickets || 0), 0);
  const roi = totalSpend === 0 ? 0 : (totalRevenue - totalSpend) / totalSpend; // ROI = (Rev - Spend)/Spend
  const roas = totalSpend === 0 ? 0 : totalRevenue / totalSpend; // ROAS = Rev/Spend
  const cac = totalTickets === 0 ? 0 : totalSpend / totalTickets; // CAC per ticket purchaser
  const ltvAvg = rows.length ? rows.reduce((s, r) => s + (r.ltv || 0), 0) / rows.length : 0;
  return { totalSpend, totalRevenue, roi, roas, totalVisitors, totalTickets, cac, ltvAvg };
}

// Distinct extractors
const uniq = (arr: string[]) => [...new Set(arr)].sort();

// Tag Cloud for keywords/terms (size encodes weight)
function TagCloud({ tags }: { tags: Array<{ term: string; weight: number }> }) {
  const max = Math.max(1, ...tags.map((t) => t.weight));
  return (
    <div className="flex flex-wrap gap-3 items-end">
      {tags.map((t) => {
        const scale = 0.8 + (t.weight / max) * 1.6; // font-size scale 0.8—2.4rem base
        return (
          <span
            key={t.term}
            className="rounded-full px-3 py-1 bg-gray-100 hover:bg-gray-200 transition shadow-sm"
            style={{ fontSize: `${scale}rem` }}
            title={`가중치: ${t.weight.toFixed(2)}`}
          >
            {t.term}
          </span>
        );
      })}
    </div>
  );
}

// Sortable table
function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
  if (dir === "asc") return <span className="ml-1">▲</span>;
  if (dir === "desc") return <span className="ml-1">▼</span>;
  return <span className="ml-1 opacity-40">↕</span>;
}

export default function FestivalRoiDashboard() {
  const [rows, setRows] = useState<Row[]>(() => mockData());
  const [festival, setFestival] = useState<string>("All");
  const [region, setRegion] = useState<string>("All");
  const [channel, setChannel] = useState<string>("All");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<keyof Row | "roi" | "roas" | "cac">("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>("desc");

  // Derived lists
  const festivals = useMemo(() => ["All", ...uniq(rows.map((r) => r.festival))], [rows]);
  const regions = useMemo(() => ["All", ...uniq(rows.map((r) => r.region))], [rows]);
  const channels = useMemo(() => ["All", ...uniq(rows.map((r) => r.channel))], [rows]);

  // Filter rows
  const filtered = useMemo(() => {
    const sd = startDate ? new Date(startDate).getTime() : null;
    const ed = endDate ? new Date(endDate).getTime() : null;
    return rows.filter((r) => {
      const t = new Date(r.date).getTime();
      if (sd && t < sd) return false;
      if (ed && t > ed) return false;
      if (festival !== "All" && r.festival !== festival) return false;
      if (region !== "All" && r.region !== region) return false;
      if (channel !== "All" && r.channel !== channel) return false;
      if (q && !`${r.festival} ${r.region} ${r.channel}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [rows, startDate, endDate, festival, region, channel, q]);

  const kpi = useMemo(() => computeKPIs(filtered), [filtered]);

  // Aggregations for charts
  const byDate = useMemo(() => {
    const m = new Map<string, { date: string; spend: number; revenue: number; roi: number }>();
    for (const r of filtered) {
      const k = r.date;
      if (!m.has(k)) m.set(k, { date: k, spend: 0, revenue: 0, roi: 0 });
      const a = m.get(k)!;
      a.spend += r.spend;
      a.revenue += r.revenue;
    }
    return [...m.values()]
      .map((x) => ({ ...x, roi: x.spend === 0 ? 0 : (x.revenue - x.spend) / x.spend }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const byChannel = useMemo(() => {
    const m = new Map<string, { channel: string; spend: number; revenue: number; roas: number }>();
    for (const r of filtered) {
      const k = r.channel;
      if (!m.has(k)) m.set(k, { channel: k, spend: 0, revenue: 0, roas: 0 });
      const a = m.get(k)!;
      a.spend += r.spend;
      a.revenue += r.revenue;
    }
    return [...m.values()].map((x) => ({ ...x, roas: x.spend ? x.revenue / x.spend : 0 }));
  }, [filtered]);

  const scatter = useMemo(() => {
    const points = filtered.map((r) => ({ x: r.spend, y: r.revenue, label: `${r.festival} • ${r.channel}` }));
    const { a, b } = linearRegression(points);
    const xs = points.map((p) => p.x);
    const minX = Math.min(...xs, 0);
    const maxX = Math.max(...xs, 1);
    const trend = [
      { x: minX, y: a + b * minX },
      { x: maxX, y: a + b * maxX },
    ];
    return { points, trend };
  }, [filtered]);

  const funnel = useMemo(() => {
    const totals = filtered.reduce(
      (o, r) => {
        o.impressions += r.impressions || 0;
        o.clicks += r.clicks || 0;
        o.visits += r.visits || 0;
        o.tickets += r.tickets || 0;
        o.revenue += r.revenue || 0;
        return o;
      },
      { impressions: 0, clicks: 0, visits: 0, tickets: 0, revenue: 0 }
    );
    return [
      { step: "Impressions", value: totals.impressions },
      { step: "Clicks", value: totals.clicks },
      { step: "Visits", value: totals.visits },
      { step: "Tickets", value: totals.tickets },
      { step: "Revenue", value: totals.revenue },
    ];
  }, [filtered]);

  // Top festivals table rows with computed columns
  const topFestivals = useMemo(() => {
    const m = new Map<string, any>();
    for (const r of filtered) {
      const k = r.festival;
      if (!m.has(k))
        m.set(k, {
          festival: k,
          region: r.region,
          spend: 0,
          revenue: 0,
          tickets: 0,
          visitors: 0,
        });
      const a = m.get(k)!;
      a.spend += r.spend;
      a.revenue += r.revenue;
      a.tickets += r.tickets || 0;
      a.visitors += r.visitors || 0;
    }
    const arr = [...m.values()].map((x) => ({
      ...x,
      roi: x.spend ? (x.revenue - x.spend) / x.spend : 0,
      roas: x.spend ? x.revenue / x.spend : 0,
      cac: x.tickets ? x.spend / x.tickets : 0,
    }));

    const sd = sortDir === "asc" ? 1 : -1;
    return arr.sort((a, b) => {
      const va = a[sortBy as any] ?? 0;
      const vb = b[sortBy as any] ?? 0;
      if (va < vb) return -1 * sd;
      if (va > vb) return 1 * sd;
      return 0;
    });
  }, [filtered, sortBy, sortDir]);

  // Keyword/Topic terms (simple example using channels/regions/festival names)
  const terms = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of filtered) {
      [r.channel, r.region, ...r.festival.split(/\s+/)].forEach((t) =>
        counts.set(t, (counts.get(t) || 0) + 1)
      );
    }
    return [...counts.entries()]
      .map(([term, weight]) => ({ term, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 25);
  }, [filtered]);

  // CSV upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  async function onUploadCSV(file: File) {
    const text = await file.text();
    const papa = await ensurePapa();
    papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (res: any) => {
        const next: Row[] = res.data
          .map((r: any) => ({
            date: String(r.date || r.Date || r.DATE || "").slice(0, 10),
            festival: r.festival || r.Festival || r.name || "",
            region: r.region || r.Region || "",
            channel: r.channel || r.Channel || "",
            spend: N(r.spend ?? r.Spend),
            revenue: N(r.revenue ?? r.Revenue),
            impressions: N(r.impressions ?? r.Impressions),
            clicks: N(r.clicks ?? r.Clicks),
            visits: N(r.visits ?? r.Visits),
            tickets: N(r.tickets ?? r.Tickets),
            visitors: N(r.visitors ?? r.Visitors),
            ltv: N(r.ltv ?? r.LTV ?? r.lifetime_value),
          }))
          .filter((r: Row) => r.date && r.festival);
        if (next.length) setRows(next);
        else alert("CSV에서 유효한 데이터 행을 찾지 못했습니다. 헤더를 확인해주세요.");
      },
    });
  }

  // Export current festival table to CSV
  function exportCSV() {
    const header = [
      "festival",
      "region",
      "spend",
      "revenue",
      "roi",
      "roas",
      "tickets",
      "visitors",
      "cac",
    ];
    const body = topFestivals
      .map((r) =>
        [
          r.festival,
          r.region,
          r.spend,
          r.revenue,
          r.roi,
          r.roas,
          r.tickets,
          r.visitors,
          r.cac,
        ].join(",")
      )
      .join("\n");
    const csv = header.join(",") + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `festival-roi-table.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function resetFilters() {
    setFestival("All");
    setRegion("All");
    setChannel("All");
    setStartDate("");
    setEndDate("");
    setQ("");
  }

  function toggleSort(key: any) {
    if (sortBy === key) {
      setSortDir((d) => (d === "desc" ? "asc" : d === "asc" ? null : "desc"));
      if (sortDir === null) setSortBy("revenue");
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  return (
    <div className="min-h-screen w-full bg-white text-gray-800">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <h1 className="text-xl md:text-2xl font-semibold">Festival ROI Dashboard</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={exportCSV}>
              <Download className="w-4 h-4" /> 테이블 CSV
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              title="CSV 업로드"
            >
              <Upload className="w-4 h-4" /> 데이터 업로드
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onUploadCSV(e.target.files[0])}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-4 h-4" /> 필터
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-6 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Festival</label>
              <select value={festival} onChange={(e) => setFestival(e.target.value)} className="border rounded p-2">
                {festivals.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Region</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="border rounded p-2">
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="border rounded p-2">
                {channels.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded p-2" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded p-2" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Search</label>
              <input
                placeholder="festival / region / channel"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="border rounded p-2"
              />
            </div>
            <div className="md:col-span-6 flex justify-end gap-2">
              <Button variant="outline" className="gap-2" onClick={resetFilters}>
                <RefreshCw className="w-4 h-4" /> 초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <section className="grid md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">총 지출 (Spend)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{fmtKRW(kpi.totalSpend)}</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">총 매출 (Revenue)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{fmtKRW(kpi.totalRevenue)}</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2">ROI <Info className="w-4 h-4" title="(Revenue - Spend) / Spend" /></CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{(kpi.roi * 100).toFixed(1)}%</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">ROAS (Rev/Spend)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{kpi.roas.toFixed(2)}x</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">방문객 (Visitors)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{fmtNum(kpi.totalVisitors)}</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">구매자 (Tickets)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{fmtNum(kpi.totalTickets)}</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">CAC (1인당 획득비용)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{fmtKRW(kpi.cac)}</CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">평균 LTV</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{fmtKRW(kpi.ltvAvg)}</CardContent>
          </Card>
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="h-80">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm">일자별 ROI & 매출/지출</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byDate} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <ReTooltip formatter={(v: any, n: string) => (n === "roi" ? `${(v * 100).toFixed(1)}%` : fmtKRW(v))} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="roi" name="ROI" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="spend" name="Spend" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="h-80">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm">채널별 ROAS</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byChannel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ReTooltip formatter={(v: any) => `${Number(v).toFixed(2)}x`} />
                  <Bar dataKey="roas" name="ROAS" />
                  <ReferenceLine y={1} strokeDasharray="4 4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="h-80">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm">Spend vs Revenue (회귀선 포함)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="Spend" tickFormatter={(v) => fmtKRW(v)} />
                  <YAxis type="number" dataKey="y" name="Revenue" tickFormatter={(v) => fmtKRW(v)} />
                  <ZAxis range={[40, 160]} />
                  <ReTooltip
                    formatter={(v: any, n: string, item: any) => (n === "x" ? fmtKRW(v) : fmtKRW(v))}
                    labelFormatter={() => ""}
                  />
                  <Legend />
                  <Scatter name="데이터" data={scatter.points} />
                  {/* Trendline as separate LineChart overlay: sample two points */}
                  <ReferenceLine segment={scatter.trend as any} strokeDasharray="4 4" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="h-80">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm">전환 퍼널</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => fmtNum(v)} />
                  <YAxis type="category" dataKey="step" />
                  <ReTooltip formatter={(v: any) => fmtNum(v)} />
                  <Bar dataKey="value" name="count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* Tag Cloud + Definitions */}
        <section className="grid lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-2">
                키워드/토픽 (가중치)
                <HelpCircle className="w-4 h-4" title="간단한 빈도 기반 가중치 시각화" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TagCloud tags={terms} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">용어 정리 (Glossary)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <strong>ROI</strong> = (Revenue − Spend) / Spend
              </div>
              <div>
                <strong>ROAS</strong> = Revenue / Spend
              </div>
              <div>
                <strong>CAC</strong> = Spend / 구매자수 (tickets)
              </div>
              <div>
                <strong>LTV</strong> (Lifetime Value) = 1인당 기대 수익 (평균)
              </div>
              <div>
                <strong>Conversion Rate</strong> = 하위단계 / 상위단계 (예: tickets / visits)
              </div>
              <div>
                <strong>CTR</strong> = Clicks / Impressions
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Top festivals table */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">페스티벌별 성과 요약</h2>
            <span className="text-xs text-gray-500">열 클릭으로 정렬</span>
          </div>
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {[
                    ["festival", "Festival"],
                    ["region", "Region"],
                    ["spend", "Spend"],
                    ["revenue", "Revenue"],
                    ["roi", "ROI"],
                    ["roas", "ROAS"],
                    ["tickets", "Tickets"],
                    ["visitors", "Visitors"],
                    ["cac", "CAC"],
                  ].map(([key, label]) => (
                    <th
                      key={key}
                      className="px-3 py-2 font-medium text-left cursor-pointer select-none"
                      onClick={() => toggleSort(key)}
                    >
                      <div className="inline-flex items-center">
                        {label}
                        <SortIcon dir={sortBy === key ? sortDir : null} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topFestivals.map((r, i) => (
                  <tr key={r.festival} className={i % 2 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-3 py-2 whitespace-nowrap">{r.festival}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.region}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtKRW(r.spend)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtKRW(r.revenue)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{(r.roi * 100).toFixed(1)}%</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.roas.toFixed(2)}x</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtNum(r.tickets)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtNum(r.visitors)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{fmtKRW(r.cac)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* How to use */}
        <section className="text-xs text-gray-500 pt-2">
          <p>
            CSV 업로드 시 필요한 컬럼: <code>date, festival, region, channel, spend, revenue, impressions, clicks, visits, tickets, visitors, ltv</code>.
            헤더는 대소문자 무관하며 일부 축약명을 허용합니다.
          </p>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-gray-500">
        Festival ROI Dashboard • v1.0
      </footer>
    </div>
  );
}
