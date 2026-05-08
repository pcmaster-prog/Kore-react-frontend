import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fmt } from "../nomina.utils";

export type CostDistributionChartProps = {
  data: { name: string; value: number }[];
};

const colors = ["#000000", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#3b82f6", "#14b8a6"];

export default function CostDistributionChart({ data }: CostDistributionChartProps) {
  return (
    <div className="rounded-[40px] border border-k-border bg-k-bg-card shadow-k-card overflow-hidden mb-4">
      <div className="px-6 py-5 border-b border-k-border">
        <h3 className="text-sm font-black text-k-text-h tracking-tight">Distribución de Costos</h3>
        <p className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mt-0.5">
          Por departamento / Rol
        </p>
      </div>
      <div className="p-6">
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "#f5f5f5" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value) => [fmt(Number(value)), "Costo"]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
