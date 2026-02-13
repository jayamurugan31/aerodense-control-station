import { useState, useEffect } from "react";
import Map, { Marker } from "@mapbox/react-map-gl";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MissionState } from "@/hooks/useSimulation";
import type { Order } from "@/components/OrdersPanel";

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

interface MapViewProps {
  mission: MissionState;
  isFlying: boolean;
  className?: string;
  selectedOrder?: Order | null;
}

const MapView = ({ mission, isFlying, className, selectedOrder }: MapViewProps) => {
  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 12,
  });
  const [map, setMap] = useState<mapboxgl.Map | null>(null);

  // Calculate current position along route
  const currentPos = isFlying && mission.route.length > 0
    ? getPositionAlongRoute(mission.route, mission.routeProgress)
    : null;

  // Route GeoJSON
  const routeGeoJson = {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: mission.route,
    },
  };

  useEffect(() => {
    if (map && mission.route.length > 0) {
      // Add or update route source
      if (map.getSource('route')) {
        (map.getSource('route') as mapboxgl.GeoJSONSource).setData(routeGeoJson);
      } else {
        map.addSource('route', {
          type: 'geojson',
          data: routeGeoJson,
        });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#00aaff',
            'line-width': 4,
            'line-opacity': isFlying ? 0.9 : 0.6,
          },
        });
      }
    }
  }, [map, mission.route, isFlying]);

  const pickupCoord = selectedOrder ? locationCoordinates[selectedOrder.pickup] : null;
  const deliveryCoord = selectedOrder ? locationCoordinates[selectedOrder.delivery] : null;

  return (
    <div className={`aero-panel flex-1 relative overflow-hidden ${className || ""}`}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
        onLoad={(evt) => setMap(evt.target)}
      >
        {/* Pickup Marker */}
        {pickupCoord && (
          <Marker longitude={pickupCoord.lng} latitude={pickupCoord.lat}>
            <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-mono">
              PICKUP
            </div>
          </Marker>
        )}

        {/* Delivery Marker */}
        {deliveryCoord && (
          <Marker longitude={deliveryCoord.lng} latitude={deliveryCoord.lat}>
            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-mono">
              DROP
            </div>
          </Marker>
        )}

        {/* Aircraft Marker */}
        {currentPos && (
          <Marker longitude={currentPos[0]} latitude={currentPos[1]}>
            <div className="text-2xl">🚁</div>
          </Marker>
        )}
      </Map>

      {/* Status Overlay */}
      <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-3 text-sm font-mono">
        <div className="text-foreground">LAT {viewState.latitude.toFixed(4)}°</div>
        <div className="text-foreground">LON {viewState.longitude.toFixed(4)}°</div>
        <div className="text-foreground">ALT {mission.altitude}m</div>
      </div>
    </div>
  );
};

function getPositionAlongRoute(route: [number, number][], progress: number): [number, number] {
  if (route.length < 2) return route[0] || [0, 0];
  const totalSegments = route.length - 1;
  const segmentIndex = Math.floor(progress * totalSegments);
  const segmentProgress = (progress * totalSegments) % 1;
  const start = route[Math.min(segmentIndex, route.length - 1)];
  const end = route[Math.min(segmentIndex + 1, route.length - 1)];
  const lng = start[0] + (end[0] - start[0]) * segmentProgress;
  const lat = start[1] + (end[1] - start[1]) * segmentProgress;
  return [lng, lat];
}

export default MapView;
