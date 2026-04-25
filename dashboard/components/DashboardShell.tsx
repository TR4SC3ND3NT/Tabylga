"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Category, Region } from "@/lib/mockData";

type DashboardStats = {
  totalRevenueKgs: number;
  transactionsToday: number;
  activeTourists: number;
  averageSpendUsd: number;
};

type HeatmapRegion = {
  region: Region;
  revenue: number;
  transactions: number;
  intensity: number;
};

type RegionRevenue = {
  region: Region;
  revenue: number;
  transactions: number;
};

type CategorySpend = {
  name: string;
  value: number;
  color: string;
};

type DailyTransaction = {
  date: string;
  revenue: number;
  transactions: number;
};

type TopMerchant = {
  id: string;
  name: string;
  region: Region;
  category: Category;
  revenue: number;
  transactions: number;
  rating: number;
};

type DashboardShellProps = {
  stats: DashboardStats;
  heatmapRegions: HeatmapRegion[];
  revenueByRegion: RegionRevenue[];
  spendingByCategory: CategorySpend[];
  transactionsOverTime: DailyTransaction[];
  topMerchants: TopMerchant[];
};

const kgsFormatter = new Intl.NumberFormat("en-US");
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const categoryLabels: Record<Category, string> = {
  accommodation: "Accommodation",
  food: "Food",
  transport: "Transport",
  activities: "Activities",
  park_entry: "Park Entry",
  shopping: "Shopping",
};

function formatKgs(value: number) {
  return `${kgsFormatter.format(Math.round(value))} KGS`;
}

function formatCompactKgs(value: number) {
  return `${compactFormatter.format(Math.round(value))} KGS`;
}

function Panel({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/10 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#C65D3A]">{eyebrow}</p> : null}
          <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function ChartFrame({
  ready,
  children,
}: {
  ready: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="h-80 min-w-0">
      {ready ? (
        children
      ) : (
        <div className="h-full rounded-lg border border-white/10 bg-white/[0.03]" />
      )}
    </div>
  );
}

export default function DashboardShell({
  stats,
  heatmapRegions,
  revenueByRegion,
  spendingByCategory,
  transactionsOverTime,
  topMerchants,
}: DashboardShellProps) {
  const [chartsReady, setChartsReady] = useState(false);
  const firstDate = transactionsOverTime[0]?.date ?? "Last 30 days";
  const lastDate = transactionsOverTime[transactionsOverTime.length - 1]?.date ?? "Today";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setChartsReady(true));

    return () => cancelAnimationFrame(frame);
  }, []);

  const statCards = [
    { label: "Total Revenue", value: formatKgs(stats.totalRevenueKgs), accent: "#1E4D6B" },
    { label: "Transactions Today", value: kgsFormatter.format(stats.transactionsToday), accent: "#C65D3A" },
    { label: "Active Tourists", value: kgsFormatter.format(stats.activeTourists), accent: "#4E8CA8" },
    { label: "Avg Spend", value: `$${stats.averageSpendUsd}`, accent: "#E3A047" },
  ];

  return (
    <main className="min-h-screen bg-[#1A1A1A] px-4 py-5 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#C65D3A]">Tabylga Analytics</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Tabylga Analytics - KG Tourism Revenue Dashboard
            </h1>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <span className="text-sm text-slate-400">Date range</span>
            <button
              className="h-11 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-left text-sm font-medium text-white shadow-inner shadow-white/5"
              type="button"
            >
              {firstDate} - {lastDate}
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article
              className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/10"
              key={card.label}
            >
              <div className="mb-5 h-1.5 w-16 rounded-full" style={{ backgroundColor: card.accent }} />
              <p className="text-sm font-medium text-slate-400">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.35fr]">
          <Panel eyebrow="Regional heatmap" title="Tourism Revenue Density">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {heatmapRegions.map((region) => (
                <div
                  className="min-h-32 rounded-lg border border-white/10 p-4"
                  key={region.region}
                  style={{
                    backgroundColor: `rgba(30, 77, 107, ${0.22 + region.intensity * 0.68})`,
                  }}
                >
                  <div className="flex h-full flex-col justify-between gap-5">
                    <div>
                      <p className="text-base font-semibold text-white">{region.region}</p>
                      <p className="mt-1 text-xs text-slate-200/80">{region.transactions} transactions</p>
                    </div>
                    <p className="text-lg font-semibold text-white">{formatCompactKgs(region.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
              <span>Lower volume</span>
              <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-[#1E4D6B]/25 to-[#1E4D6B]" />
              <span>Higher volume</span>
            </div>
          </Panel>

          <Panel eyebrow="Revenue by region" title="Regional Revenue Ranking">
            <ChartFrame ready={chartsReady}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByRegion} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="region" stroke="#94A3B8" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    stroke="#94A3B8"
                    tickFormatter={formatCompactKgs}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    width={78}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "#202020",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#F8FAFC",
                    }}
                    formatter={(value) => [formatKgs(Number(value)), "Revenue"]}
                    labelStyle={{ color: "#CBD5E1" }}
                  />
                  <Bar dataKey="revenue" fill="#1E4D6B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.45fr]">
          <Panel eyebrow="Spend mix" title="Spending by Category">
            <ChartFrame ready={chartsReady}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={104}
                    paddingAngle={3}
                    stroke="rgba(26,26,26,0.8)"
                    strokeWidth={2}
                  >
                    {spendingByCategory.map((entry) => (
                      <Cell fill={entry.color} key={entry.name} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#202020",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#F8FAFC",
                    }}
                    formatter={(value) => [`${value}%`, "Share"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartFrame>
            <div className="grid gap-2 sm:grid-cols-2">
              {spendingByCategory.map((item) => (
                <div className="flex items-center justify-between gap-3 text-sm" key={item.name}>
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-semibold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel eyebrow="Last 30 days" title="Transactions Over Time">
            <ChartFrame ready={chartsReady}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transactionsOverTime} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    interval={4}
                    stroke="#94A3B8"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    width={42}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#202020",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 8,
                      color: "#F8FAFC",
                    }}
                    formatter={(value, name) =>
                      name === "transactions"
                        ? [kgsFormatter.format(Number(value)), "Transactions"]
                        : [formatKgs(Number(value)), "Revenue"]
                    }
                    labelStyle={{ color: "#CBD5E1" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    stroke="#C65D3A"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, fill: "#C65D3A", stroke: "#1A1A1A", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
          </Panel>
        </section>

        <Panel eyebrow="Merchant performance" title="Top 10 Merchants">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Region</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Revenue</th>
                  <th className="px-4 py-3 text-right font-medium">Transactions</th>
                  <th className="py-3 pl-4 text-right font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {topMerchants.map((merchant) => (
                  <tr className="border-b border-white/5 text-sm text-slate-300" key={merchant.id}>
                    <td className="py-4 pr-4 font-medium text-white">{merchant.name}</td>
                    <td className="px-4 py-4">{merchant.region}</td>
                    <td className="px-4 py-4">{categoryLabels[merchant.category]}</td>
                    <td className="px-4 py-4 text-right font-semibold text-white">{formatKgs(merchant.revenue)}</td>
                    <td className="px-4 py-4 text-right">{kgsFormatter.format(merchant.transactions)}</td>
                    <td className="py-4 pl-4 text-right font-semibold text-[#E3A047]">{merchant.rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </main>
  );
}
