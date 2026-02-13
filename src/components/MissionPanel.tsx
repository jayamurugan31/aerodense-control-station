import { Battery, Gauge, Radio, Shield, Plane } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { Order } from "@/components/OrdersPanel";
import type { AircraftState, MissionState } from "@/hooks/useSimulation";

interface MissionPanelProps {
  selectedOrder?: Order | null;
  aircraft: AircraftState;
  mission: MissionState;
  isFlying: boolean;
  activeMissionOrderId: string | null;
  onApprove?: () => void;
  onReject?: () => void;
  onStartMission?: () => void;
}

const MissionPanel = ({
  selectedOrder,
  aircraft,
  mission,
  isFlying,
  activeMissionOrderId,
  onApprove,
  onReject,
  onStartMission,
}: MissionPanelProps) => {
  const batteryColor =
    aircraft.battery > 50 ? "text-aero-success" : aircraft.battery > 20 ? "text-aero-warning" : "text-aero-danger";

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-80 flex flex-col gap-3 overflow-y-auto p-3">
      {/* Aircraft Status */}
      <div className="aero-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-foreground tracking-wide uppercase">Aircraft</h3>
          <span className="text-[10px] font-mono text-primary aero-glow-sm px-2 py-0.5 rounded bg-primary/10">
            AeroSense-01
          </span>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div>
            <div className="flex justify-between text-muted-foreground mb-1">
              <span className="flex items-center gap-1.5"><Battery className="h-3 w-3" /> Battery</span>
              <span className={batteryColor}>{Math.round(aircraft.battery)}%</span>
            </div>
            <Progress value={aircraft.battery} className={`h-1.5 bg-secondary [&>div]:${aircraft.battery > 50 ? "bg-aero-success" : aircraft.battery > 20 ? "bg-aero-warning" : "bg-aero-danger"}`} />
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><Gauge className="h-3 w-3" /> Payload</span>
            <span className="text-foreground">{aircraft.payloadWeight.toFixed(1)} / {aircraft.maxPayload.toFixed(1)} kg</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><Radio className="h-3 w-3" /> Status</span>
            <span className={aircraft.status === "In Flight" ? "text-aero-cyan" : "text-aero-success"}>{aircraft.status}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><Shield className="h-3 w-3" /> Mode</span>
            <span className="text-aero-success">{aircraft.mode}</span>
          </div>
        </div>
      </div>

      {/* Mission Details */}
      <div className="aero-panel p-4">
        <h3 className="text-xs font-semibold text-foreground tracking-wide uppercase mb-3">Active Mission</h3>

        {selectedOrder ? (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between font-mono">
              <span className="text-muted-foreground">Order</span>
              <span className="text-primary font-semibold">{selectedOrder.id}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-muted-foreground">Package</span>
              <span className="text-foreground">{selectedOrder.packageType}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-muted-foreground">Route</span>
              <span className="text-foreground">{selectedOrder.pickup} → {selectedOrder.delivery}</span>
            </div>

            {/* Mission Progress - show when this order is the active mission */}
            {activeMissionOrderId === selectedOrder.id && (
              <div className="pt-2">
                <div className="flex justify-between text-muted-foreground mb-1.5 font-mono">
                  <span>Progress</span>
                  <span className="text-aero-cyan">{Math.round(mission.progress)}%</span>
                </div>
                <Progress value={mission.progress} className="h-2 bg-secondary [&>div]:bg-aero-cyan" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                  <span>Elapsed: {formatTime(mission.elapsed)}</span>
                  <span>ETA: {Math.ceil(mission.eta / 60)} min</span>
                </div>
              </div>
            )}

            {selectedOrder.status === "Delivered" && (
              <div className="text-center py-2">
                <span className="text-aero-success font-semibold font-mono">✓ DELIVERED</span>
              </div>
            )}

            {/* Admin actions */}
            {selectedOrder.status === "Pending" && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={onApprove}
                  className="flex-1 bg-aero-success hover:bg-aero-success/80 text-primary-foreground text-xs h-8"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onReject}
                  className="flex-1 border-aero-danger/30 text-aero-danger hover:bg-aero-danger/10 text-xs h-8"
                >
                  Reject
                </Button>
              </div>
            )}

            {selectedOrder.status === "Approved" && !isFlying && (
              <Button
                size="sm"
                onClick={onStartMission}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground text-xs h-8 mt-2"
              >
                <Plane className="h-3 w-3 mr-1.5" />
                Start Mission
              </Button>
            )}

            {selectedOrder.status === "Approved" && isFlying && activeMissionOrderId !== selectedOrder.id && (
              <p className="text-[10px] text-aero-warning font-mono text-center pt-2">
                Another mission is in progress
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground font-mono text-center py-6">
            Select an order to view mission details
          </p>
        )}
      </div>

      {/* Pilot Info */}
      <div className="aero-panel p-4">
        <h3 className="text-xs font-semibold text-foreground tracking-wide uppercase mb-3">Pilot</h3>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Assigned</span>
            <span className="text-foreground">CPT. Martinez</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Certification</span>
            <span className="text-aero-success">Level 3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Flight Hours</span>
            <span className="text-foreground">1,247</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionPanel;
