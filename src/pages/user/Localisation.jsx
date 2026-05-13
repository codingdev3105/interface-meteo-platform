import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../api/api';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { Server, Activity, ArrowRight, Map as MapIcon, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';

// Fix pour les icônes Leaflet par défaut
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Création d'icônes personnalisées dynamiques (DivIcon)
const createMarkerIcon = (status) => {
  const color = status === 'active' ? '#10b981' : '#94a3b8';
  const isOnline = status === 'active';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        ${isOnline ? `<div class="absolute w-full h-full bg-emerald-500 rounded-full animate-ping opacity-25"></div>` : ''}
        <div class="relative w-4 h-4 bg-[${color}] rounded-full border-2 border-white dark:border-slate-900 shadow-lg ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const Localisation = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchStations = async (silent = false) => {
    try {
      const res = await api.getStations();
      const data = Array.isArray(res) ? res : (res?.stations || []);
      setStations(data.filter(s => s.location && s.location.lat && s.location.lng));
    } catch (err) {
      if (!silent) addToast("Erreur lors de la récupération des positions", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    
    // Rafraîchissement automatique toutes les 5 secondes
    const interval = setInterval(() => {
      fetchStations(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [addToast]);

  return (
    <DashboardLayout title="Géo-Localisation">
      <div className="mb-8">
        <button 
          onClick={() => navigate('/user/stations')}
          className="flex items-center space-x-3 text-slate-500 hover:text-primary transition-colors group"
        >
          <div className="p-3 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group-hover:shadow-md group-hover:border-primary/20 transition-all">
            <ArrowLeft size={20} />
          </div>
          <span className="font-black uppercase tracking-widest text-[11px]">Retour aux stations</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900/40 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden relative min-h-[70vh]">
        
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-20 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Chargement de la carte...</p>
            </div>
          </div>
        ) : (
          <MapContainer 
            center={[36.7525, 3.04197]} 
            zoom={6} 
            style={{ height: '70vh', width: '100%', zIndex: 1 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {stations.map((station) => (
              <Marker 
                key={station._id} 
                position={[station.location.lat, station.location.lng]}
                icon={createMarkerIcon(station.status)}
              >
                <Tooltip direction="top" offset={[0, -32]} opacity={1}>
                  <div className="p-1 font-black text-[11px] text-primary flex items-center space-x-2">
                    <Activity size={14} className="animate-pulse" />
                    <span>{station.name}</span>
                  </div>
                </Tooltip>

                <Popup className="premium-popup" closeButton={false}>
                  <div className="p-6 min-w-[260px] dark:bg-slate-900 bg-white">
                    {/* Header with Glass Effect Icon */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-2xl text-primary shadow-inner">
                        <Server size={22} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-slate-900 dark:text-white text-lg leading-tight m-0 tracking-tight">
                          {station.name}
                        </h4>
                        <div className="flex items-center mt-1">
                          <span className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full font-black uppercase tracking-widest">
                            {station.hardwareId}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status & Coordinates */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <Activity size={14} className={`mr-2 ${station.status === 'active' ? 'text-primary animate-pulse' : 'text-slate-400'}`} />
                          <span>Statut</span>
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-wider ${station.status === 'active' ? 'text-primary' : 'text-rose-500'}`}>
                          {station.status === 'active' ? 'Opérationnel' : 'Hors-ligne'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-1">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latitude</span>
                            <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{station.location.lat}</span>
                         </div>
                         <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
                         <div className="flex flex-col text-right">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Longitude</span>
                            <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{station.location.lng}</span>
                         </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={() => navigate(`/user/stations/${station.hardwareId}`)}
                      className="group/btn w-full flex items-center justify-center space-x-3 py-4 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-emerald-600 transition-all duration-300 shadow-xl shadow-primary/20 active:scale-[0.98]"
                    >
                      <span>Monitoring</span>
                      <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Legend/Side Panel overlay */}
        {!loading && (
          <div className="absolute top-6 right-6 z-[1000] w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-2xl pointer-events-auto">
            <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-wider mb-4 flex items-center">
              <MapIcon size={16} className="mr-2 text-primary" />
              Vos Stations
            </h3>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {stations.length > 0 ? stations.map(s => (
                <div 
                  key={s._id} 
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:border-primary/30 transition-all group"
                  onClick={() => navigate(`/user/stations/${s.hardwareId}`)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">{s.name}</span>
                    <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-primary animate-pulse' : 'bg-slate-400'}`}></div>
                  </div>
                </div>
              )) : (
                <p className="text-[11px] text-slate-400 italic">Aucune position GPS définie.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .leaflet-container {
          border-radius: 3rem;
        }
        .premium-popup .leaflet-popup-content-wrapper {
          border-radius: 2.5rem;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .premium-popup .leaflet-popup-tip {
          background: white;
        }
        .dark .premium-popup .leaflet-popup-tip {
          background: #0f172a;
        }
        .premium-popup .leaflet-popup-close-button {
          display: none !important;
        }
        .premium-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .leaflet-tooltip {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #10b98144;
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 0;
          backdrop-blur: blur(4px);
        }
        .dark .leaflet-tooltip {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid #10b98144;
          color: white;
        }
        .leaflet-tooltip-top:before {
          border-top-color: rgba(16, 185, 129, 0.4);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b98122;
          border-radius: 10px;
        }

        /* Animation personnalisée pour les points en ligne */
        @keyframes pulse-green {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .bg-emerald-500 {
          animation: pulse-green 2s infinite;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default Localisation;
