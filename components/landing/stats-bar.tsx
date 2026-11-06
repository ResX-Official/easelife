import { Building2, MapPin, Percent, Handshake } from "lucide-react";

export function StatsBar({ listingCount, cityCount }: { listingCount: number; cityCount: number }) {
  const stats = [
    { icon: Building2, value: listingCount, label: "Places to discover" },
    { icon: MapPin, value: cityCount, label: "Locations to explore" },
    { icon: Percent, value: "0%", label: "Platform commission" },
    { icon: Handshake, value: "Direct", label: "To owners & agents" },
  ];

  return (
    <div className="shell home-stats">
      <div className="stats-panel">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-item">
            <stat.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-blue-800" />
            <div><p className="text-2xl font-medium tracking-tight text-blue-950">{stat.value}</p><p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{stat.label}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
