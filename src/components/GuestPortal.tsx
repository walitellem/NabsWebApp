import React, { useState, useEffect } from 'react';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  Tv, 
  Wind, 
  Coffee, 
  MapPin, 
  ChevronRight, 
  ChevronLeft,
  Star,
  Info,
  Calendar
} from 'lucide-react';

/**
 * GUEST PORTAL COMPONENT
 * ----------------------
 * This component is designed for the Guest-facing web interface.
 * It connects to the shared 'pokunabsdev-c0e67' database and 
 * displays real-time 'Available' rooms with a luxury aesthetic.
 */

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  price: number;
  status: string;
  branch: string;
  amenities: string[];
  description: string;
  imageUrls?: string[];
  videoUrls?: string[];
}

const GuestPortal: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBranch, setActiveBranch] = useState<'Annex' | 'Ayigya'>('Annex');
  const [error, setError] = useState<string | null>(null);

  // 1. Real-time Firestore Listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setError("Database connection not configured.");
      setLoading(false);
      return;
    }

    // Filter for rooms that are marked as 'Available' ONLY
    const roomsQ = query(
      collection(db, 'rooms'), 
      where('status', '==', 'Available')
    );

    const unsubscribe = onSnapshot(roomsQ, (snapshot) => {
      const fetchedRooms: Room[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          roomNumber: String(data.roomNumber || data.number || data.id || doc.id),
          roomType: String(data.roomType || data.type || (data.normalBookingPrice ? 'Luxury Suite' : 'Premium Room')),
          // Robust Price Fallback logic
          price: typeof data.price === 'number' && data.price > 0 
            ? data.price 
            : Number(data.normalBookingPrice || data.normalPrice || 0),
          status: String(data.status || 'Available'),
          branch: String(data.branch || 'Annex'),
          amenities: Array.isArray(data.amenities) ? data.amenities : [],
          description: String(data.description || ''),
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
          videoUrls: Array.isArray(data.videoUrls) ? data.videoUrls : []
        };
      });
      setRooms(fetchedRooms);
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      setError("Unable to sync live room data. Please try again.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredRooms = rooms.filter(r => 
    r.branch.toLowerCase().includes(activeBranch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-['Plus_Jakarta_Sans'] text-zinc-900 overflow-x-hidden">
      {/* 1. Header / Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-['Playfair_Display'] font-black tracking-tight text-zinc-900">
              NABSLODGE
            </h1>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 -mt-1">
              Guest Experience
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <a href="#" className="text-zinc-900 hover:text-blue-600 transition-colors">Discover</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Our Story</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Amenities</a>
          </div>

          <button className="bg-zinc-900 text-white px-6 py-3 rounded-full text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-zinc-200">
            Reserve Now
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-['Playfair_Display'] font-medium text-zinc-900 leading-tight">
              Elegance found in <br />
              <span className="italic text-zinc-400 font-normal">every detail.</span>
            </h2>
            <p className="mt-8 text-zinc-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              Experience the perfect blend of hospitality and modern luxury at Nabslodge. 
              Real-time availability for our Annex and Ayigya branches.
            </p>
          </motion.div>

          {/* Branch Switcher */}
          <div className="mt-16 flex justify-center">
            <div className="p-1.5 bg-zinc-100 rounded-2xl flex gap-1 border border-zinc-200">
              {(['Annex', 'Ayigya'] as const).map((branch) => (
                <button
                  key={branch}
                  onClick={() => setActiveBranch(branch)}
                  className={`px-8 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeBranch === branch 
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200' 
                    : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {branch} Branch
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Room Inventory Grid */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Checking Availability...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center border border-red-100">
              <Info className="w-8 h-8 mx-auto mb-4 opacity-50" />
              <p className="font-bold">{error}</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-[3rem]">
              <h3 className="text-2xl font-['Playfair_Display'] text-zinc-400">All suites currently reserved</h3>
              <p className="text-sm text-zinc-400 mt-2">Check back soon or select another branch.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredRooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="bg-zinc-950 text-zinc-400 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-['Playfair_Display'] text-white">Nabslodge</h2>
            <p className="text-[10px] uppercase tracking-widest mt-2 font-bold">Luxury Redefined</p>
          </div>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Location</a>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-50">
            © 2026 Nabslodge Hotel & Resorts
          </p>
        </div>
      </footer>
    </div>
  );
};

// --- Helper Component: Room Card with Carousel ---

const RoomCard: React.FC<{ room: Room }> = ({ room }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = room.imageUrls && room.imageUrls.length > 0 
    ? room.imageUrls 
    : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop'];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="group bg-white rounded-[2.5rem] overflow-hidden border border-zinc-100 hover:border-zinc-200 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 flex flex-col"
    >
      {/* Image Carousel */}
      <div className="relative h-72 overflow-hidden bg-zinc-100">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full object-cover"
            alt={room.roomType}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={prevImage} className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextImage} className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-blue-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-800">{room.branch}</span>
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 flex gap-1">
            {images.map((_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Room Details */}
      <div className="p-8 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600 mb-1 block">
              {room.roomType}
            </span>
            <h3 className="text-2xl font-['Playfair_Display'] font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">
              Suite {room.roomNumber}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-['Playfair_Display'] font-bold text-zinc-900">GH¢{room.price}</span>
            <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-widest mt-1">per night</span>
          </div>
        </div>

        <p className="text-sm text-zinc-500 line-clamp-2 mb-6 leading-relaxed">
          {room.description || `Luxury accommodation at Nabslodge ${room.branch} branch featuring premium amenities and world-class service.`}
        </p>

        {/* Amenities Icons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <AmenityIcon icon={<Wifi />} label="Wifi" active={room.amenities.includes('High-Speed Wi-Fi')} />
          <AmenityIcon icon={<Wind />} label="AC" active={room.amenities.includes('Air Conditioning')} />
          <AmenityIcon icon={<Tv />} label="TV" active={room.amenities.includes('Flat-screen TV')} />
          <AmenityIcon icon={<Coffee />} label="Mini Bar" active={room.amenities.includes('Mini Bar')} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-4">
          <button className="flex-1 bg-zinc-100 text-zinc-900 py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
            <Info className="w-3.5 h-3.5 opacity-50" /> View Details
          </button>
          <button className="flex-1 bg-zinc-950 text-white py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-zinc-200 flex items-center justify-center gap-2">
            <Calendar className="w-3.5 h-3.5 opacity-50" /> Book Now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const AmenityIcon: React.FC<{ icon: React.ReactNode, label: string, active?: boolean }> = ({ icon, active }) => (
  <div className={`p-2 rounded-xl transition-all ${active ? 'bg-blue-50 text-blue-600' : 'bg-zinc-50 text-zinc-300 grayscale'}`}>
    {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
  </div>
);

export default GuestPortal;
