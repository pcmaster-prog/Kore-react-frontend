import { Outlet, NavLink } from "react-router-dom";
import { Briefcase, Users, LayoutDashboard } from "lucide-react";

export default function RecruitmentLayout() {
  const tabs = [
    { to: "/app/manager/reclutamiento", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { to: "/app/manager/reclutamiento/vacantes", icon: Briefcase, label: "Vacantes" },
    { to: "/app/manager/reclutamiento/candidatos", icon: Users, label: "Candidatos" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto pb-2 -mb-2 scrollbar-hide">
        <div className="flex space-x-2 bg-k-bg-card border border-k-border p-1 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.exact}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-k-bg-primary text-k-text-h shadow-sm"
                      : "text-k-text-b hover:bg-k-bg-secondary hover:text-k-text-primary"
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      <div>
        <Outlet />
      </div>
    </div>
  );
}
