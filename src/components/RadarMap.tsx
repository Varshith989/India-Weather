import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Layers, Radio, Play, Pause, RotateCcw } from "lucide-react";

interface RadarMapProps {
  latitude: number;
  longitude: number;
  cityName: string;
}

interface RadarFrame {
  time: number;
  path: string;
}

export const RadarMap: React.FC<RadarMapProps> = ({
  latitude,
  longitude,
  cityName,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRadarActive, setIsRadarActive] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 6,
        minZoom: 3,
        maxZoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 16,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      // Custom glowing pinpoint
      const customIcon = L.divIcon({
        className: "custom-pin",
        html: `<div style="background-color: #0284c7; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(2,132,199,0.9);"></div>`,
        iconSize: [14, 14],
      });

      const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Fetch Radar Frames
      fetch("https://api.rainviewer.com/public/weather-maps.json")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
            const pastFrames = data.radar.past as RadarFrame[];
            setFrames(pastFrames);
            setCurrentFrameIndex(pastFrames.length - 1);
            showRadarFrame(map, pastFrames[pastFrames.length - 1].path);
          }
        })
        .catch((e) => console.warn("RainViewer tile load error:", e));
    } else {
      const map = mapInstanceRef.current;
      map.flyTo([latitude, longitude], 6, { duration: 1.2 });
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  // Helper to swap radar frame tile layer
  const showRadarFrame = (map: L.Map, path: string) => {
    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current);
    }

    if (!isRadarActive) return;

    const radarTileUrl = `https://tilecache.rainviewer.com${path}/256/{z}/{x}/{y}/2/1_1.png`;
    const newLayer = L.tileLayer(radarTileUrl, {
      opacity: 0.65,
      zIndex: 10,
      maxNativeZoom: 8,
      maxZoom: 16,
    });

    newLayer.addTo(map);
    radarLayerRef.current = newLayer;
  };

  // Switch frame when currentFrameIndex changes
  useEffect(() => {
    if (mapInstanceRef.current && frames.length > 0 && frames[currentFrameIndex]) {
      showRadarFrame(mapInstanceRef.current, frames[currentFrameIndex].path);
    }
  }, [currentFrameIndex, isRadarActive]);

  // Animation player loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && frames.length > 0) {
      interval = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
      }, 700);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, frames]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentFrameIndex(Number(e.target.value));
  };

  const toggleRadar = () => {
    if (!mapInstanceRef.current) return;
    if (isRadarActive) {
      if (radarLayerRef.current) {
        mapInstanceRef.current.removeLayer(radarLayerRef.current);
      }
      setIsRadarActive(false);
      setIsPlaying(false);
    } else {
      setIsRadarActive(true);
      if (frames[currentFrameIndex]) {
        showRadarFrame(mapInstanceRef.current, frames[currentFrameIndex].path);
      }
    }
  };

  const currentTimestamp =
    frames.length > 0 && frames[currentFrameIndex]
      ? new Date(frames[currentFrameIndex].time * 1000).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "Live";

  const isLiveFrame = currentFrameIndex === frames.length - 1;

  return (
    <div className="relative rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800/80 p-5 backdrop-blur-xl shadow-md dark:shadow-xl flex flex-col justify-between overflow-hidden transition-colors">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 z-10">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-500 dark:text-sky-400 animate-pulse" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Live Doppler Weather Radar • {cityName}
          </h3>
        </div>

        <button
          onClick={toggleRadar}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            isRadarActive
              ? "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-500/20 dark:text-sky-400 dark:border-sky-500/30"
              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {isRadarActive ? "Radar Active" : "Radar Off"}
        </button>
      </div>

      {/* Map Element */}
      <div className="w-full h-64 md:h-72 rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-800/60 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-700 dark:text-slate-300 flex items-center gap-2 pointer-events-none shadow-xs">
          <span>Precipitation:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2 bg-blue-400 rounded-sm inline-block" />
            <span>Light</span>
            <span className="w-2.5 h-2 bg-green-500 rounded-sm inline-block ml-1" />
            <span>Moderate</span>
            <span className="w-2.5 h-2 bg-yellow-400 rounded-sm inline-block ml-1" />
            <span>Heavy</span>
            <span className="w-2.5 h-2 bg-red-600 rounded-sm inline-block ml-1" />
            <span>Storm</span>
          </div>
        </div>
      </div>

      {/* Radar Timeline & Playback Controls */}
      {frames.length > 0 && isRadarActive && (
        <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 dark:bg-sky-500/20 dark:hover:bg-sky-500/30 dark:text-sky-400 dark:border-sky-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pause" : "Play Loop"}</span>
          </button>

          <input
            type="range"
            min="0"
            max={frames.length - 1}
            value={currentFrameIndex}
            onChange={handleSliderChange}
            className="flex-1 accent-sky-500 dark:accent-sky-400 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{currentTimestamp}</span>
            {isLiveFrame && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                LIVE
              </span>
            )}
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrameIndex(frames.length - 1);
              }}
              title="Reset to latest live radar"
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
