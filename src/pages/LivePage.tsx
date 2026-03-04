import { useQuery } from "@tanstack/react-query";
import { api, Driver, CarData, LocationData } from "@/lib/api";
import { Radio, Loader2, Activity, MapPin, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

function TelemetryChart({ driverNumber, sessionKey, teamColor }: { driverNumber: number; sessionKey: number; teamColor: string }) {
  const [telemetry, setTelemetry] = useState<CarData[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["car-data", sessionKey, driverNumber],
    queryFn: () => api.getCarData({ session_key: sessionKey, driver_number: driverNumber }),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (data) setTelemetry(data.slice(-100));
  }, [data]);

  if (isLoading) return <div className="h-24 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  if (!telemetry.length) return <p className="text-xs text-muted-foreground text-center py-4">Sin datos de telemetría</p>;

  const maxSpeed = Math.max(...telemetry.map((t) => t.speed), 1);
  const latest = telemetry[telemetry.length - 1];

  return (
    <div className="space-y-2">
      {/* Speed bar visualization */}
      <div className="flex items-end h-16 gap-px">
        {telemetry.slice(-50).map((t, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all"
            style={{
              height: `${(t.speed / maxSpeed) * 100}%`,
              backgroundColor: `#${teamColor}`,
              opacity: 0.3 + (i / 50) * 0.7,
            }}
          />
        ))}
      </div>
      {/* Live stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "VEL", value: `${latest.speed}`, unit: "km/h" },
          { label: "THR", value: `${latest.throttle}`, unit: "%" },
          { label: "BRK", value: latest.brake > 0 ? "ON" : "OFF", unit: "" },
          { label: "GEAR", value: `${latest.n_gear}`, unit: "" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            <p className="text-sm font-mono font-bold">{stat.value}<span className="text-[10px] text-muted-foreground ml-0.5">{stat.unit}</span></p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackMap({ sessionKey, drivers }: { sessionKey: number; drivers: Driver[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: locations } = useQuery({
    queryKey: ["locations-live", sessionKey],
    queryFn: async () => {
      const allLocations: LocationData[] = [];
      for (const driver of drivers.slice(0, 20)) {
        try {
          const locs = await api.getLocation({ session_key: sessionKey, driver_number: driver.driver_number });
          if (locs.length > 0) allLocations.push(locs[locs.length - 1]);
        } catch { /* skip */ }
      }
      return allLocations;
    },
    refetchInterval: 4000,
  });

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !locations?.length) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const xs = locations.map((l) => l.x);
    const ys = locations.map((l) => l.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const padding = 30;

    const scaleX = (x: number) => padding + ((x - minX) / rangeX) * (w - padding * 2);
    const scaleY = (y: number) => padding + ((y - minY) / rangeY) * (h - padding * 2);

    locations.forEach((loc) => {
      const driver = driverMap.get(loc.driver_number);
      const color = driver ? `#${driver.team_colour}` : "#888";
      const x = scaleX(loc.x);
      const y = scaleY(loc.y);

      // Glow
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = color + "30";
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label
      ctx.font = "bold 9px Outfit";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(driver?.name_acronym || String(loc.driver_number), x, y - 10);
    });
  }, [locations, driverMap]);

  useEffect(() => {
    drawMap();
  }, [drawMap]);

  return (
    <canvas ref={canvasRef} className="w-full h-full" style={{ minHeight: 300 }} />
  );
}

export default function LivePage() {
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  const { data: latestSession, isLoading } = useQuery({
    queryKey: ["latest-session"],
    queryFn: () => api.getSessions({ session_key: "latest" as unknown as number }),
  });

  const session = latestSession?.[0];

  const { data: drivers } = useQuery({
    queryKey: ["drivers-live", session?.session_key],
    queryFn: () => api.getDrivers({ session_key: session!.session_key }),
    enabled: !!session,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-muted-foreground">No hay sesión activa en este momento</p>
        <p className="text-sm text-muted-foreground">La telemetría y mapa estarán disponibles durante sesiones en vivo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Radio className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-2xl font-extrabold">En Vivo</h1>
          <p className="text-sm text-muted-foreground">{session.session_name} • {session.circuit_short_name}</p>
        </div>
        <span className="relative flex h-3 w-3 ml-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Track Map */}
        <section className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-sm uppercase tracking-wider">Mapa del Circuito</h2>
          </div>
          <div className="p-4">
            {drivers && session ? (
              <TrackMap sessionKey={session.session_key} drivers={drivers} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Cargando mapa...</div>
            )}
          </div>
        </section>

        {/* Telemetry */}
        <section className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-bold text-sm uppercase tracking-wider">Telemetría</h2>
          </div>

          {/* Driver selector */}
          {drivers && (
            <div className="px-5 py-3 border-b border-border/30">
              <div className="flex flex-wrap gap-1.5">
                {drivers.map((d) => (
                  <button
                    key={d.driver_number}
                    onClick={() => setSelectedDriver(selectedDriver === d.driver_number ? null : d.driver_number)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
                      selectedDriver === d.driver_number
                        ? "ring-1 ring-foreground/20"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: selectedDriver === d.driver_number ? `#${d.team_colour}30` : undefined,
                      color: `#${d.team_colour}`,
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `#${d.team_colour}` }} />
                    {d.name_acronym}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-5">
            {selectedDriver && session ? (
              <TelemetryChart
                driverNumber={selectedDriver}
                sessionKey={session.session_key}
                teamColor={drivers?.find((d) => d.driver_number === selectedDriver)?.team_colour || "888888"}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Selecciona un piloto para ver su telemetría
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
