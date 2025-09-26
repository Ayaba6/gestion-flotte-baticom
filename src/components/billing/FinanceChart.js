import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#16a34a", "#dc2626"];

export default function FinanceChart({ invoices = [], expenses = [] }) {
  const [chartType, setChartType] = useState("line"); // line | bar | pie
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Filtrage par période
  const filteredInvoices = useMemo(() => {
    return invoices.filter((f) => {
      if (!f.due_date) return false;
      const date = new Date(f.due_date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  }, [invoices, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((d) => {
      if (!d.date) return false;
      const date = new Date(d.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });
  }, [expenses, startDate, endDate]);

  // Sécuriser les données mensuelles
  const data = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    return months.map((m) => {
      const factures = filteredInvoices
        .filter((f) => new Date(f.due_date).getMonth() === m)
        .reduce((acc, f) => acc + Number(f.amount || 0), 0);
      const depenses = filteredExpenses
        .filter((d) => new Date(d.date).getMonth() === m)
        .reduce((acc, d) => acc + Number(d.amount || 0), 0);
      return {
        month: new Date(0, m).toLocaleString("fr-FR", { month: "short" }),
        factures,
        depenses,
      };
    });
  }, [filteredInvoices, filteredExpenses]);

  // Données pour PieChart
  const pieData = useMemo(() => [
    { name: "Factures", value: filteredInvoices.reduce((acc, f) => acc + Number(f.amount || 0), 0) },
    { name: "Dépenses", value: filteredExpenses.reduce((acc, d) => acc + Number(d.amount || 0), 0) },
  ], [filteredInvoices, filteredExpenses]);

  // Données sécurisées
  const safeData = Array.isArray(data) && data.length ? data : [{ month: "", factures: 0, depenses: 0 }];
  const safePieData = Array.isArray(pieData) && pieData.length ? pieData : [{ name: "Factures", value: 0 }, { name: "Dépenses", value: 0 }];

  if (!filteredInvoices.length && !filteredExpenses.length) {
    return <p className="text-center text-gray-500">Aucune donnée disponible pour cette période.</p>;
  }

  return (
    <div className="bg-white shadow rounded-xl p-6 border">
      <h3 className="text-lg font-bold mb-4">Évolution financière</h3>

      {/* Sélecteur période */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="line">Ligne</option>
          <option value="bar">Histogramme</option>
          <option value="pie">Cercle</option>
        </select>
      </div>

      {/* Graphiques */}
      {chartType === "line" && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="factures" stroke="#16a34a" />
            <Line type="monotone" dataKey="depenses" stroke="#dc2626" />
          </LineChart>
        </ResponsiveContainer>
      )}

      {chartType === "bar" && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="factures" fill="#16a34a" />
            <Bar dataKey="depenses" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {chartType === "pie" && (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={safePieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {safePieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
