import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../api/api';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import { Server, Activity, ArrowRight, Map as MapIcon, Info } from 'lucide-react';

// Icône personnalisée "Radar" pulsante
const radarIcon = L.divIcon({
  className: 'custom-radar-marker',
  html: `
    <div class="radar-container">
      <div class="radar-pulse"></div>
      <div class="radar-center"></div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const Localisation = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await api.getStations();
        const data = Array.isArray(res) ? res : (res?.stations || []);
        setStations(data.filter(s => s.location && s.location.lat && s.location.lng));
      } catch (err) {
        addToast("Erreur lors de la récupération des positions", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, [addToast]);

  return (
    <DashboardLayout title="Géo-Localisation">
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
                icon={radarIcon}
              >
                {/* Détails au survol (Hover) */}
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                  <div className="p-2">
                    <div className="flex items-center space-x-2">
                       <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                       <span className="font-black text-slate-900 text-[12px]">{station.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">ID: {station.hardwareId}</p>
                    <div className="flex items-center mt-2 text-[9px] text-primary font-black uppercase tracking-tighter">
                       <Info size={10} className="mr-1" />
                       Cliquer pour plus de détails
                    </div>
                  </div>
                </Tooltip>

                {/* Détails au clic (Popup) */}
                <Popup className="premium-popup">
                  <div className="p-2 min-w-[200px]">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Server size={18} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 leading-none m-0">{station.name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{station.hardwareId}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-[11px] font-bold text-slate-500">
                        <Activity size={14} className="mr-2 text-primary" />
                        Statut: <span className="ml-1 text-primary">{station.status === 'active' ? 'En ligne' : 'Hors ligne'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Lat: {station.location.lat} | Lng: {station.location.lng}
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/user/stations/${station.hardwareId}`)}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-primary/20"
                    >
                      <span>Accéder au Dashboard</span>
                      <ArrowRight size={14} />
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
        
        /* Animation Radar */
        .radar-container {
          position: relative;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radar-pulse {
          position: absolute;
          width: 30px;
          height: 30px;
          background: rgba(16, 185, 129, 0.4);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        .radar-center {
          position: relative;
          width: 12px;
          height: 12px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
          z-index: 2;
        }
        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        .premium-popup .leaflet-popup-content-wrapper {
          border-radius: 1.5rem;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }
        .premium-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b98122;
          border-radius: 10px;
        }
      `}</style>
    </DashboardLayout>
  );
};

const MapIcon = ({size, className}) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
    <line x1="8" y1="2" x2="8" y2="18"></line>
    <line x1="16" y1="6" x2="16" y2="22"></line>
  </svg>
);

export default Localisation;
