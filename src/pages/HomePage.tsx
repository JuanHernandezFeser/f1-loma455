import { useQuery } from "@tanstack/react-query";
import { api, Meeting, Session, Driver, ChampionshipDriver } from "@/lib/api";
import { Calendar, Clock, MapPin, Trophy, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const units = [
    { label: "DÍAS", value: timeLeft.days },
    { label: "HRS", value: timeLeft.hours },
    { label: "MIN", value: timeLeft.minutes },
    { label: "SEG", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-3">
      {units.map((unit) => (
        <div key={unit.label} className="flex flex-col items-center">
          <div className="bg-secondary rounded-md px-3 py-2 min-w-[52px] text-center border border-border/50">
            <span className="text-2xl font-bold font-mono text-foreground">{String(unit.value).padStart(2, "0")}</span>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground mt-1 tracking-wider">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function HomePage() {
  const currentYear = new Date().getFullYear();

  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ["meetings", currentYear],
    queryFn: () => api.getMeetings({ year: currentYear }),
  });

  const nextMeeting = meetings?.find((m) => new Date(m.date_start) > new Date());

  const { data: sessions } = useQuery({
    queryKey: ["sessions-next", nextMeeting?.meeting_key],
    queryFn: () => api.getSessions({ meeting_key: nextMeeting!.meeting_key }),
    enabled: !!nextMeeting,
  });

  // Get latest race session for standings
  const { data: allSessions } = useQuery({
    queryKey: ["all-sessions", currentYear],
    queryFn: () => api.getSessions({ year: currentYear, session_type: "Race" }),
  });

  const latestRaceSession = allSessions?.filter(s => new Date(s.date_end) < new Date()).pop();

  const { data: driverStandings } = useQuery({
    queryKey: ["championship-drivers", latestRaceSession?.session_key],
    queryFn: () => api.getChampionshipDrivers({ session_key: latestRaceSession!.session_key }),
    enabled: !!latestRaceSession,
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers-latest", latestRaceSession?.session_key],
    queryFn: () => api.getDrivers({ session_key: latestRaceSession!.session_key }),
    enabled: !!latestRaceSession,
  });

  const sortedStandings = driverStandings
    ?.sort((a, b) => a.position_current - b.position_current)
    .slice(0, 10);

  const driverMap = new Map(drivers?.map((d) => [d.driver_number, d]));

  if (meetingsLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      {/* Next Race Hero */}
      {nextMeeting && (
        <section className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 md:p-8">
          <div className="absolute inset-0 carbon-texture opacity-30" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Próxima Carrera</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{nextMeeting.meeting_name}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {nextMeeting.location}, {nextMeeting.country_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(nextMeeting.date_start).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    -{" "}
                    {new Date(nextMeeting.date_end).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Sessions schedule */}
                {sessions && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sessions.map((s) => (
                      <div
                        key={s.session_key}
                        className="flex items-center gap-1.5 rounded bg-secondary/80 px-2.5 py-1 text-xs font-medium"
                      >
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{s.session_name}</span>
                        <span className="text-foreground font-mono">
                          {new Date(s.date_start).toLocaleDateString("es-ES", { weekday: "short" })}{" "}
                          {new Date(s.date_start).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-3">
                <CountdownTimer targetDate={nextMeeting.date_start} />
                {nextMeeting.circuit_image && (
                  <img
                    src={nextMeeting.circuit_image}
                    alt={nextMeeting.circuit_short_name}
                    className="h-20 opacity-40 invert"
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Standings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Driver Standings Top 10 */}
        <section className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm uppercase tracking-wider">Campeonato de Pilotos</h2>
            </div>
            <Link
              to="/standings"
              className="flex items-center gap-1 text-xs text-primary hover:text-racing-red-glow transition-colors"
            >
              Ver todo <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {sortedStandings ? (
            <div className="divide-y divide-border/30">
              {sortedStandings.map((s) => {
                const driver = driverMap.get(s.driver_number);
                return (
                  <div key={s.driver_number} className="flex items-center gap-3 px-5 py-2.5 hover:bg-accent/50 transition-colors">
                    <span
                      className={`w-6 text-center font-mono font-bold text-sm ${
                        s.position_current <= 3 ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {s.position_current}
                    </span>
                    {driver && (
                      <div
                        className="w-1 h-6 rounded-full"
                        style={{ backgroundColor: `#${driver.team_colour}` }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{driver?.full_name || `#${s.driver_number}`}</p>
                      <p className="text-xs text-muted-foreground truncate">{driver?.team_name}</p>
                    </div>
                    <span className="font-mono font-bold text-sm">{s.points_current}</span>
                    <span className="text-[10px] text-muted-foreground">PTS</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">Cargando standings...</div>
          )}
        </section>

        {/* Season Calendar */}
        <section className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm uppercase tracking-wider">Calendario {currentYear}</h2>
            </div>
            <Link
              to="/calendario"
              className="flex items-center gap-1 text-xs text-primary hover:text-racing-red-glow transition-colors"
            >
              Ver todo <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {meetings ? (
            <div className="divide-y divide-border/30 max-h-[420px] overflow-y-auto">
              {meetings.map((m) => {
                const isPast = new Date(m.date_end) < new Date();
                const isNext = m.meeting_key === nextMeeting?.meeting_key;
                return (
                  <Link
                    key={m.meeting_key}
                    to={`/calendario?meeting=${m.meeting_key}`}
                    className={`flex items-center gap-3 px-5 py-2.5 transition-colors ${
                      isNext ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="w-14 text-center">
                      <p className="text-xs font-mono text-muted-foreground">
                        {new Date(m.date_start).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isPast ? "text-muted-foreground" : ""}`}>
                        {m.meeting_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.location}</p>
                    </div>
                    {isPast && (
                      <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded font-medium">
                        COMPLETADO
                      </span>
                    )}
                    {isNext && (
                      <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-semibold">
                        PRÓXIMO
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">Cargando calendario...</div>
          )}
        </section>
      </div>
    </div>
  );
}
