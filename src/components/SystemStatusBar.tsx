import { Wifi, Satellite, Battery, Camera, Clock } from "lucide-react";
import type { AircraftState } from "@/hooks/useSimulation";
import { useEffect, useState } from "react";

interface SystemStatusBarProps {
  aircraft: AircraftState;
}

const SystemStatusBar = ({ aircraft }: SystemStatusBarProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = time.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const batteryColor = aircraft.battery > 50 ? "text-aero-success" : aircraft.battery > 20 ? "text-aero-warning" : "text-aero-danger";

  return (
    <header className="h-10 border-b border-border bg-card flex items-center justify-between px-4 text-xs font-mono">
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground">AeroSense Control v2.4.1</span>
        <div className="flex items-center gap-1.5">
          <span className={`aero-status-dot ${aircraft.status === "Idle" ? "bg-aero-success" : "bg-aero-cyan animate-pulse"}`} />
          <span className={aircraft.status === "Idle" ? "text-aero-success" : "text-aero-cyan"}>
            {aircraft.status === "Idle" ? "ONLINE" : aircraft.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5 text-muted-foreground">
        <div className="flex items-center gap-1.5" title="Signal Strength">
          <Wifi className="h-3.5 w-3.5 text-aero-success" />
          <span>{Math.round(aircraft.signal)}%</span>
        </div>
        <div className="flex items-center gap-1.5" title="GPS Lock">
          <Satellite className="h-3.5 w-3.5 text-aero-success" />
          <span>{aircraft.satellites} SAT</span>
        </div>
        <div className="flex items-center gap-1.5" title="Battery">
          <Battery className={`h-3.5 w-3.5 ${batteryColor}`} />
          <span>{Math.round(aircraft.battery)}%</span>
        </div>
        <div className="flex items-center gap-1.5" title="Camera">
          <Camera className={`h-3.5 w-3.5 ${aircraft.cameraActive ? "text-aero-success" : "text-aero-danger"}`} />
          <span>{aircraft.cameraActive ? "LIVE" : "OFF"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeStr}</span>
          <span className="text-border">|</span>
          <span>{dateStr}</span>
        </div>
      </div>
    </header>
  );
};

export default SystemStatusBar;
