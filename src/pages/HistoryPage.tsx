import { useQuery } from "@tanstack/react-query";
import { api, Meeting, Session, SessionResult, Driver } from "@/lib/api";
import { useState } from "react";
import { History, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, "0")}` : `${secs}s`;
}

function SessionResults({ session, drivers }: { session: Session; drivers: Map<number, Driver> }) {
  const [expanded, setExpanded] = useState(false);

  const { data: results, isLoading } = useQuery({
    queryKey: ["hist-result", session.session_key],
    queryFn: () => api.getSessionResult({ session_key: session.session_key }),
    enabled: expanded,
  });

  const sorted = results?.sort((a, b) => a.position - b.position);

  return (
    <div className="border border-border/30 rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 hover:bg-secondary transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground w-16">
            {new Date(session.date_start).toLocaleDateString("es-ES", { weekday: "short", day: "numeric" })}
          </span>
          <span className="text-sm font-semibold">{session.session_name}</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="animate-fade-in">
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : sorted && sorted.length > 0 ? (
            <div className="divide-y divide-border/20">
              {sorted.map((r) => {
                const driver = drivers.get(r.driver_number);
                return (
                  <div key={r.driver_number} className="flex items-center gap-3 px-4 py-2 hover:bg-accent/30 transition-colors">
                    <span className={`w-6 text-center font-mono font-bold text-xs ${r.position <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                      {r.dnf ? "DNF" : r.dns ? "DNS" : r.dsq ? "DSQ" : `P${r.position}`}
                    </span>
                    {driver && <div className="w-0.5 h-5 rounded-full" style={{ backgroundColor: `#${driver.team_colour}` }} />}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{driver?.name_acronym || `#${r.driver_number}`}</span>
                      <span className="text-xs text-muted-foreground ml-2">{driver?.team_name}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {r.gap_to_leader !== null && r.gap_to_leader > 0 ? `+${r.gap_to_leader.toFixed(3)}s` : r.position === 1 && r.duration ? formatDuration(r.duration) : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-4 text-sm text-muted-foreground">Sin resultados</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [year, setYear] = useState(2024);
  const [expandedMeeting, setExpandedMeeting] = useState<number | null>(null);

  const years = Array.from({ length: new Date().getFullYear() - 2023 + 1 }, (_, i) => 2023 + i);

  const { data: meetings, isLoading } = useQuery({
    queryKey: ["hist-meetings", year],
    queryFn: () => api.getMeetings({ year }),
  });

  const { data: sessions } = useQuery({
    queryKey: ["hist-sessions", expandedMeeting],
    queryFn: () => api.getSessions({ meeting_key: expandedMeeting! }),
    enabled: !!expandedMeeting,
  });

  const latestSession = sessions?.[sessions.length - 1];

  const { data: drivers } = useQuery({
    queryKey: ["hist-drivers", latestSession?.session_key],
    queryFn: () => api.getDrivers({ session_key: latestSession!.session_key }),
    enabled: !!latestSession,
  });

  const driverMap = new Map(drivers?.map((d) => [d.driver_number, d]));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-extrabold">Resultados Históricos</h1>
      </div>

      {/* Year selector */}
      <div className="flex gap-2">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => { setYear(y); setExpandedMeeting(null); }}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${
              year === y ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {meetings?.map((m) => {
            const isExpanded = expandedMeeting === m.meeting_key;
            return (
              <div key={m.meeting_key} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedMeeting(isExpanded ? null : m.meeting_key)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="w-16 text-center">
                    <p className="text-xs font-mono text-muted-foreground">
                      {new Date(m.date_start).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-bold truncate">{m.meeting_name}</p>
                    <p className="text-xs text-muted-foreground">{m.circuit_short_name} • {m.location}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {isExpanded && sessions && (
                  <div className="px-5 pb-5 space-y-2 animate-fade-in">
                    {sessions.map((s) => (
                      <SessionResults key={s.session_key} session={s} drivers={driverMap} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
