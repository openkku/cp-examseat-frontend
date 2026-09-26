'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getRoomContent, type RoomContent } from '@/lib/roomContent';

// Auto fits bounds of the Map instance to match all active markers
const MapBoundsFitter = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
    }
  }, [map, positions]);

  return null;
};

interface RoomLocationMapProps {
  /** Rooms keyed by ID, with any location details from the backend. */
  rooms: Record<string, RoomContent>;
  onSelectRoom: (roomId: string) => void;
}

// Leaflet touches `window` when imported, so this component must be loaded
// with next/dynamic and `ssr: false`.
export default function RoomLocationMap({ rooms, onSelectRoom }: RoomLocationMapProps) {
  return (
    <MapContainer center={[16.4466, 102.8285]} zoom={16} scrollWheelZoom={false} dragging={true} style={{ height: "100%", width: "100%", zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {(() => {
        const groupedLocations: Record<string, { lat: number; lng: number; rooms: string[] }> = {};
        const allPositions: [number, number][] = [];

        Object.entries(rooms).forEach(([roomId, apiRoom]) => {
          const content = getRoomContent(roomId, apiRoom);
          if (content.lat && content.lng) {
            const key = `${content.lat},${content.lng}`;
            if (!groupedLocations[key]) {
              groupedLocations[key] = { lat: content.lat, lng: content.lng, rooms: [] };
            }
            groupedLocations[key].rooms.push(roomId);
            allPositions.push([content.lat, content.lng]);
          }
        });

        return (
          <>
            {allPositions.length > 0 && <MapBoundsFitter positions={allPositions} />}
            {Object.values(groupedLocations).map((group, index) => {
              const roomCount = group.rooms.length;
              const clusterIcon = L.divIcon({
                className: 'custom-cluster-marker',
                html: `<div style="background-color: #f43f5e; color: white; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800;">
                         ${roomCount > 1 ? roomCount : ''}
                       </div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
              });

              return (
                <Marker key={index} position={[group.lat, group.lng]} icon={clusterIcon}>
                  <Popup>
                    <div className="text-center pb-1 min-w-[140px] font-sans">
                      <div className="flex flex-col gap-1.5">
                        {group.rooms.map((roomId) => (
                          <button
                            key={roomId}
                            onClick={() => onSelectRoom(roomId)}
                            className="bg-blue-50 dark:bg-blue-950 hover:bg-blue-600 dark:hover:bg-blue-800 hover:text-white text-blue-700 dark:text-blue-400 text-xs font-bold px-3 py-2 rounded-xl transition border border-blue-100 dark:border-blue-900 cursor-pointer outline-none"
                          >
                            {roomId}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </>
        );
      })()}
    </MapContainer>
  );
}
