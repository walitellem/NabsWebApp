import React, { useState } from 'react';
import { Booking, Room } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bed, User, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';

interface QuickAvailabilityCalendarProps {
  rooms: Room[];
  bookings: Booking[];
  isDarkMode: boolean;
  onBookRoomDateRange?: (roomId: string, checkIn: string, checkOut: string) => void;
}

export const QuickAvailabilityCalendar: React.FC<QuickAvailabilityCalendarProps> = ({
  rooms,
  bookings,
  isDarkMode,
  onBookRoomDateRange
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');
  const [hoveredTileKey, setHoveredTileKey] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const startOfDayMs = (date: Date | string) => {
    if (!date) return 0;
    if (typeof date === 'string') {
      const cleanStr = date.split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        dateObj.setHours(0, 0, 0, 0);
        return dateObj.getTime();
      }
    }
    const dObj = new Date(date);
    dObj.setHours(0, 0, 0, 0);
    return dObj.getTime();
  };

  const activeBookings = bookings.filter(b => 
    b.status !== 'CheckedOut' && 
    b.status !== 'checked_out' && 
    b.status !== 'Cancelled' && 
    b.status !== 'cancelled'
  );

  // Map active bookings by room and date
  const getBookingMap = () => {
    const map: { [key: string]: Booking } = {}; // key: `roomId_YYYY-MM-DD`
    activeBookings.forEach((b) => {
      if (!b.checkInDate || !b.checkOutDate) return;
      const startMs = startOfDayMs(b.checkInDate);
      const endMs = startOfDayMs(b.checkOutDate);

      const rId = b.roomId || String(b.roomNumber);

      let curr = new Date(startMs);
      // Room is occupied for nights from startMs up to endMs (checkout date is available for new check-in)
      while (curr.getTime() < endMs) {
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        // Map for exact roomId and also branch + roomNumber match
        map[`${rId}_${dateStr}`] = b;
        if (b.branch && b.roomNumber) {
          map[`${b.branch.toLowerCase()}_${b.roomNumber}_${dateStr}`] = b;
        }

        curr.setDate(curr.getDate() + 1);
      }
    });
    return map;
  };

  const bookingMap = getBookingMap();

  const dayCells: React.ReactNode[] = [];

  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(<div key={`empty-${i}`} className="min-h-[90px] p-1 border border-zinc-100 dark:border-zinc-800/40 opacity-30 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl" />);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  for (let day = 1; day <= totalDays; day++) {
    const moStr = String(month + 1).padStart(2, '0');
    const dyStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${moStr}-${dyStr}`;
    const isToday = dateStr === todayStr;

    if (selectedRoomId !== 'ALL') {
      const targetRoom = rooms.find(r => r.id === selectedRoomId || r.roomNumber === selectedRoomId);
      const bBranch = targetRoom?.branch?.toLowerCase() || '';
      const matchedBooking = bookingMap[`${selectedRoomId}_${dateStr}`] || (targetRoom ? (bookingMap[`${targetRoom.id}_${dateStr}`] || bookingMap[`${bBranch}_${targetRoom.roomNumber}_${dateStr}`]) : undefined);
      const isBooked = !!matchedBooking;
      const tileKey = `${selectedRoomId}_${dateStr}`;

      dayCells.push(
        <div
          key={`day-${day}`}
          className={`min-h-[90px] p-2 rounded-2xl border transition-all relative flex flex-col justify-between ${
            isBooked
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-200 hover:border-emerald-500 hover:shadow-md'
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
          onMouseEnter={() => setHoveredTileKey(tileKey)}
          onMouseLeave={() => setHoveredTileKey(null)}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isToday ? 'bg-blue-600 text-white px-1.5 py-0.5 rounded-md' : ''}`}>{day}</span>
            {isBooked ? (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-rose-500 text-white">Booked</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-600 text-white">Available</span>
            )}
          </div>

          <div className="mt-1">
            {isBooked && matchedBooking ? (
              <div className="text-[10px] font-bold truncate text-rose-600 dark:text-rose-400">
                👤 {matchedBooking.guestName}
              </div>
            ) : (
              <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                Ready to Book
              </div>
            )}
          </div>

          {/* Hover Detailed Tooltip */}
          {isBooked && matchedBooking && hoveredTileKey === tileKey && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-[100] w-64 p-3 rounded-2xl bg-zinc-950 text-white shadow-2xl border border-rose-500/40 text-left pointer-events-none animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2">
                <span className="text-[11px] font-extrabold text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Room {matchedBooking.roomNumber} Booked
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-300">
                  {matchedBooking.status}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{matchedBooking.guestName}</span>
                </div>
                {matchedBooking.guestContact && (
                  <div className="text-[10px] text-zinc-400 font-mono">
                    📞 {matchedBooking.guestContact}
                  </div>
                )}
                <div className="text-[10px] text-zinc-400 font-mono pt-1 border-t border-zinc-800/60 mt-1">
                  📅 {matchedBooking.checkInDate?.slice(0, 10)} ➔ {matchedBooking.checkOutDate?.slice(0, 10)}
                </div>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-zinc-950" />
            </div>
          )}
        </div>
      );
    } else {
      // ALL ROOMS OVERVIEW FOR THIS DAY
      let bookedCount = 0;
      let availableCount = 0;

      const roomStatusesForDay = rooms.map(room => {
        const b = bookingMap[`${room.id}_${dateStr}`] || bookingMap[`${room.roomNumber}_${dateStr}`];
        if (b) {
          bookedCount++;
          return { room, isBooked: true, booking: b };
        } else {
          availableCount++;
          return { room, isBooked: false, booking: null };
        }
      });

      const tileKey = `ALL_${dateStr}`;

      dayCells.push(
        <div
          key={`day-${day}`}
          className={`min-h-[90px] p-2 rounded-2xl border transition-all relative flex flex-col justify-between ${
            isDarkMode ? 'bg-zinc-900/60 border-zinc-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-400'
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
          onMouseEnter={() => setHoveredTileKey(tileKey)}
          onMouseLeave={() => setHoveredTileKey(null)}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isToday ? 'bg-blue-600 text-white px-1.5 py-0.5 rounded-md' : ''}`}>{day}</span>
            <span className="text-[9px] font-mono text-zinc-500">{rooms.length} Rooms</span>
          </div>

          <div className="space-y-1 my-1">
            <div className="flex items-center justify-between text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span>Available</span>
              <span>{availableCount}</span>
            </div>
            {bookedCount > 0 && (
              <div className="flex items-center justify-between text-[10px] font-bold px-1.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <span>Booked</span>
                <span>{bookedCount}</span>
              </div>
            )}
          </div>

          {/* Detailed Hover Popover for All Rooms on this day */}
          {hoveredTileKey === tileKey && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-[100] w-72 p-3 rounded-2xl bg-zinc-950 text-white shadow-2xl border border-zinc-800 text-left pointer-events-none animate-in fade-in zoom-in duration-150">
              <div className="text-[11px] font-extrabold text-blue-400 border-b border-zinc-800 pb-1.5 mb-2 flex justify-between items-center">
                <span>Availability on {monthNames[month]} {day}, {year}</span>
                <span className="text-[9px] text-zinc-400">{rooms.length} Total</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {roomStatusesForDay.map(({ room, isBooked, booking }) => (
                  <div 
                    key={room.id || Math.random()}
                    className={`p-1.5 rounded-xl border text-[10px] flex items-center justify-between ${
                      isBooked 
                        ? 'bg-rose-950/40 border-rose-900/60 text-rose-200' 
                        : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold">Room {room.roomNumber}</span>
                      <span className="text-[9px] opacity-75 ml-1">({room.roomType})</span>
                    </div>
                    {isBooked && booking ? (
                      <span className="font-semibold text-rose-300 truncate max-w-[110px]" title={booking.guestName}>
                        👤 {booking.guestName}
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-400">Available</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-zinc-950" />
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div id="quick-availability-calendar-root" className={`p-6 rounded-3xl border shadow-xl flex flex-col space-y-5 ${
      isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold tracking-tight">Room Availability Master Calendar</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Hover over any booked date tile to view room details and guest names.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Room Filter Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <Bed className="w-4 h-4 text-zinc-400 ml-2" />
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none pr-3 py-1 text-zinc-800 dark:text-zinc-100 cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">All Rooms Overview</option>
              {rooms.map((r) => (
                <option key={r.id || Math.random()} value={r.id} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">
                  Room {r.roomNumber} ({r.roomType})
                </option>
              ))}
            </select>
          </div>

          {/* Month Navigator */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold font-mono px-2 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-zinc-400 dark:text-zinc-500">
        {weekdays.map((wd) => (
          <div key={wd} className="py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Grid of Day Tiles */}
      <div className="grid grid-cols-7 gap-2">
        {dayCells}
      </div>

      {/* Legend & Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500" />
            <span>Booked (Hover for details)</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-zinc-400">
          Web app developed by SUALAH TELLEM (0553189032)
        </div>
      </div>
    </div>
  );
};
