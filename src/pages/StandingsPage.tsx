import { useQuery } from "@tanstack/react-query";
import { api, Driver, ChampionshipTeam } from "@/lib/api";
import { Trophy, Users, Loader2 } from "lucide-react";
import { useState } from "react";

export default function StandingsPage() {
  const [tab, setTab] = useState<"drivers" | "teams">("drivers");
  const currentYear = new Date().getFullYear();

  // Get latest race session
  const { data: raceSessions } = useQuery({
    queryKey: ["race-sessions", currentYear],
    queryFn: () => api.getSessions({ year: currentYear, session_type: "Race" }),
  });

  const latestRace = raceSessions?.filter((s) => new Date(s.date_end) < new Date()).pop();

  const { data: driverStandings, isLoading: driversLoading } = useQuery({
    queryKey: ["champ-drivers", latestRace?.session_key],
    queryFn: () => api.getChampionshipDrivers({ session_key: latestRace!.session_key }),
    enabled: !!latestRace,
  });

  const { data: teamStandings, isLoading: teamsLoading } = useQuery({
    queryKey: ["champ-teams", latestRace?.session_key],
    queryFn: () => api.getChampionshipTeams({ session_key: latestRace!.session_key }),
    enabled: !!latestRace,
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers-standings", latestRace?.session_key],
    queryFn: () => api.getDrivers({ session_key: latestRace!.session_key }),
    enabled: !!latestRace,
  });

  const driverMap = new Map(drivers?.map((d) => [d.driver_number, d]));
  const sortedDrivers = driverStandings?.sort((a, b) => a.position_current - b.position_current);
  const sortedTeams = teamStandings?.sort((a, b) => a.position_current - b.position_current);

  const maxDriverPoints = sortedDrivers?.[0]?.points_current || 1;
  const maxTeamPoints = sortedTeams?.[0]?.points_current || 1;

  const isLoading = driversLoading || teamsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-extrabold">Clasificación {currentYear}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("drivers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            tab === "drivers" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Pilotos
        </button>
        <button
          onClick={() => setTab("teams")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
            tab === "teams" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trophy className="h-4 w-4" />
          Constructores
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          {tab === "drivers" && sortedDrivers && (
            <div className="divide-y divide-border/30">
              {sortedDrivers.map((s, i) => {
                const driver = driverMap.get(s.driver_number);
                const barWidth = (s.points_current / maxDriverPoints) * 100;
                return (
                  <div
                    key={s.driver_number}
                    className="relative flex items-center gap-4 px-5 py-3 hover:bg-accent/30 transition-colors"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="absolute inset-0 opacity-[0.04]" style={{ width: `${barWidth}%`, backgroundColor: driver ? `#${driver.team_colour}` : undefined }} />
                    <span className={`relative w-8 text-center font-mono font-black text-lg ${s.position_current <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                      {s.position_current}
                    </span>
                    {driver && (
                      <div className="relative w-1 h-8 rounded-full" style={{ backgroundColor: `#${driver.team_colour}` }} />
                    )}
                    {driver?.headshot_url && (
                      <img src={driver.headshot_url} alt={driver.full_name} className="relative h-8 w-8 rounded-full object-cover bg-secondary" />
                    )}
                    <div className="relative flex-1 min-w-0">
                      <p className="text-sm font-bold">{driver?.full_name || `#${s.driver_number}`}</p>
                      <p className="text-xs text-muted-foreground">{driver?.team_name}</p>
                    </div>
                    <div className="relative text-right">
                      <span className="font-mono font-bold text-lg">{s.points_current}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">PTS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "teams" && sortedTeams && (
            <div className="divide-y divide-border/30">
              {sortedTeams.map((t, i) => {
                const barWidth = (t.points_current / maxTeamPoints) * 100;
                // Find team color from drivers
                const teamDriver = drivers?.find((d) => d.team_name === t.team_name);
                const teamColor = teamDriver?.team_colour;
                return (
                  <div
                    key={t.team_name}
                    className="relative flex items-center gap-4 px-5 py-3 hover:bg-accent/30 transition-colors"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="absolute inset-0 opacity-[0.06]" style={{ width: `${barWidth}%`, backgroundColor: teamColor ? `#${teamColor}` : undefined }} />
                    <span className={`relative w-8 text-center font-mono font-black text-lg ${t.position_current <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                      {t.position_current}
                    </span>
                    {teamColor && (
                      <div className="relative w-1 h-8 rounded-full" style={{ backgroundColor: `#${teamColor}` }} />
                    )}
                    <div className="relative flex-1 min-w-0">
                      <p className="text-sm font-bold">{t.team_name}</p>
                    </div>
                    <div className="relative text-right">
                      <span className="font-mono font-bold text-lg">{t.points_current}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">PTS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
