import { useState, useEffect, useCallback, useRef } from "react";
import type { Order } from "@/components/OrdersPanel";

export interface AircraftState {
  battery: number;
  payloadWeight: number;
  maxPayload: number;
  status: "Idle" | "In Flight" | "Landing" | "Charging";
  mode: "Manual" | "Semi-Auto" | "Auto";
  signal: number;
  satellites: number;
  cameraActive: boolean;
}

export interface MissionState {
  progress: number;
  elapsed: number; // seconds
  eta: number; // seconds
  distance: number; // km
  altitude: number; // meters
  speed: number; // km/h
  routeProgress: number; // 0-1 for aircraft position on route
  route: [number, number][]; // [lng, lat] coordinates
}

const initialAircraft: AircraftState = {
  battery: 87,
  payloadWeight: 0,
  maxPayload: 5.0,
  status: "Idle",
  signal: 98,
  satellites: 12,
  cameraActive: true,
  mode: "Semi-Auto",
};

const initialMission: MissionState = {
  progress: 0,
  elapsed: 0,
  eta: 0,
  distance: 0,
  altitude: 150,
  speed: 0,
  routeProgress: 0,
  route: [],
};

const locationCoordinates: Record<string, { lat: number; lng: number }> = {
  "Warehouse A": { lat: 37.7749, lng: -122.4194 },
  "Hospital B": { lat: 37.7849, lng: -122.4094 },
  "Depot C": { lat: 37.7649, lng: -122.4294 },
  "Office Park D": { lat: 37.7949, lng: -122.3994 },
  "Kitchen Hub": { lat: 37.7549, lng: -122.4394 },
  "Residential Zone E": { lat: 37.8049, lng: -122.3894 },
  "HQ Tower": { lat: 37.7449, lng: -122.4494 },
  "Branch Office F": { lat: 37.8149, lng: -122.3794 },
  "Lab Center G": { lat: 37.7349, lng: -122.4594 },
  "Research Facility H": { lat: 37.7249, lng: -122.4694 },
  "Factory I": { lat: 37.8249, lng: -122.3694 },
  "Maintenance Bay J": { lat: 37.8349, lng: -122.3594 },
};

const initialOrders: Order[] = [
  { id: "ORD-4821", packageType: "Medical Supplies", weight: "2.4 kg", pickup: "Warehouse A", delivery: "Hospital B", status: "Pending" },
  { id: "ORD-4822", packageType: "Electronics", weight: "1.8 kg", pickup: "Depot C", delivery: "Office Park D", status: "Pending" },
  { id: "ORD-4823", packageType: "Food Package", weight: "3.1 kg", pickup: "Kitchen Hub", delivery: "Residential Zone E", status: "Pending" },
  { id: "ORD-4824", packageType: "Documents", weight: "0.5 kg", pickup: "HQ Tower", delivery: "Branch Office F", status: "Pending" },
  { id: "ORD-4825", packageType: "Lab Samples", weight: "1.2 kg", pickup: "Lab Center G", delivery: "Research Facility H", status: "Pending" },
  { id: "ORD-4826", packageType: "Spare Parts", weight: "4.0 kg", pickup: "Factory I", delivery: "Maintenance Bay J", status: "Pending" },
];

export function useSimulation() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [aircraft, setAircraft] = useState<AircraftState>(initialAircraft);
  const [mission, setMission] = useState<MissionState>(initialMission);
  const [activeMissionOrderId, setActiveMissionOrderId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Approve an order
  const approveOrder = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "Approved" as const } : o))
    );
  }, []);

  // Reject an order (remove it)
  const rejectOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  // Add a new order
  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [...prev, order]);
  }, []);
  const startMission = useCallback(
    async (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order || order.status !== "Approved") return;
      if (activeMissionOrderId) return; // already flying

      const pickupCoord = locationCoordinates[order.pickup];
      const deliveryCoord = locationCoordinates[order.delivery];
      if (!pickupCoord || !deliveryCoord) return;

      // Fetch route from Mapbox Directions API
      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoord.lng},${pickupCoord.lat};${deliveryCoord.lng},${deliveryCoord.lat}?geometries=geojson&access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`;

      try {
        const response = await fetch(directionsUrl);
        const data = await response.json();
        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates;
        const distance = route.distance / 1000; // meters to km
        const totalEta = Math.round((distance / 42) * 60); // minutes at ~42 km/h

        const weight = parseFloat(order.weight) || 2.0;

        setActiveMissionOrderId(orderId);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "In Flight" as const } : o))
        );
        setAircraft((prev) => ({
          ...prev,
          status: "In Flight",
          payloadWeight: weight,
          speed: 42,
        }));
        setMission({
          progress: 0,
          elapsed: 0,
          eta: totalEta * 60,
          distance,
          altitude: 150,
          speed: 42,
          routeProgress: 0,
          route: coordinates,
        });
      } catch (error) {
        console.error("Failed to fetch route:", error);
        // Fallback to straight line
        const coordinates: [number, number][] = [[pickupCoord.lng, pickupCoord.lat], [deliveryCoord.lng, deliveryCoord.lat]];
        const distance = 10; // fallback
        const totalEta = Math.round((distance / 42) * 60);

        const weight = parseFloat(order.weight) || 2.0;

        setActiveMissionOrderId(orderId);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "In Flight" as const } : o))
        );
        setAircraft((prev) => ({
          ...prev,
          status: "In Flight",
          payloadWeight: weight,
          speed: 42,
        }));
        setMission({
          progress: 0,
          elapsed: 0,
          eta: totalEta * 60,
          distance,
          altitude: 150,
          speed: 42,
          routeProgress: 0,
          route: coordinates,
        });
      }
    },
    [orders, activeMissionOrderId]
  );

  // Simulation tick - runs when a mission is active
  useEffect(() => {
    if (!activeMissionOrderId) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setMission((prev) => {
        const newProgress = Math.min(prev.progress + 1.5, 100);
        const newRouteProgress = newProgress / 100;
        const newElapsed = prev.elapsed + 1;
        const remainingFraction = 1 - newRouteProgress;
        const totalTime = prev.distance / (prev.speed / 3600);
        const newEta = Math.max(0, totalTime * remainingFraction);
        const altitudeVariation = 150 + Math.sin(newElapsed * 0.3) * 8;
        const speedVariation = 40 + Math.random() * 6;

        if (newProgress >= 100) {
          // Mission complete
          setOrders((prev) =>
            prev.map((o) =>
              o.id === activeMissionOrderId ? { ...o, status: "Delivered" as const } : o
            )
          );
          setAircraft((a) => ({ ...a, status: "Idle", payloadWeight: 0, speed: 0 }));
          setActiveMissionOrderId(null);
          return { ...prev, progress: 100, routeProgress: 1, eta: 0, speed: 0 };
        }

        return {
          ...prev,
          progress: newProgress,
          routeProgress: newRouteProgress,
          elapsed: newElapsed,
          eta: newEta,
          altitude: Math.round(altitudeVariation),
          speed: Math.round(speedVariation),
        };
      });

      // Battery drain
      setAircraft((prev) => ({
        ...prev,
        battery: Math.max(0, prev.battery - 0.08),
        signal: Math.min(100, Math.max(85, prev.signal + (Math.random() - 0.5) * 2)),
        satellites: Math.max(8, Math.min(14, prev.satellites + Math.round((Math.random() - 0.5) * 1))),
      }));
    }, 600); // tick every 600ms for visible updates

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeMissionOrderId]);

  return {
    orders,
    aircraft,
    mission,
    activeMissionOrderId,
    approveOrder,
    rejectOrder,
    startMission,
    addOrder,
  };
}
