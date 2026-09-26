import React, { useState, useEffect, useRef } from 'react';
import { Booking, Room } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Bed, User, CheckCircle2, XCircle, Search, Filter, X } from 'lucide-react';
import { generateKey } from '../utils/keyGenerator';

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
  const [activeTileKey, setActiveTileKey] = useState<string | null>(null);
  const [popoverFilter, setPopoverFilter] = useState<'ALL' | 'AVAILABLE' | 'BOOKED'>('ALL');
  const [popoverSearch, setPopoverSearch] = useState<string>('');
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setActiveTileKey(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveTileKey(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handlePrevMonth = () => {
    setActiveTileKey(null);
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setActiveTileKey(null);
    setCurrentDate(new Date(year, month + 1, 1));
  };
  const handleToday = () => {
    setActiveTileKey(null);
    setCurrentDate(new Date());
  };

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
    dayCells.push(<div key={generateKey(i, i, 'q-empty')} className="min-h-[90px] p-1 border border-zinc-100 dark:border-zinc-800/40 opacity-30 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-xl" />);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  for (let day = 1; day <= totalDays; day++) {
    const moStr = String(month + 1).padStart(2, '0');
    const dyStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${moStr}-${dyStr}`;
    const isToday = dateStr === todayStr;

    const slotIndex = firstDayIndex + day - 1;
    const colIndex = slotIndex % 7;
    const rowIndex = Math.floor(slotIndex / 7);

    // Open downward if top rows (0 or 1), else open upward
    const isTopRows = rowIndex <= 1;
    const verticalClass = isTopRows ? 'top-full mt-2' : 'bottom-full mb-2';

    let horizontalClass = 'left-1/2 -translate-x-1/2';
    let arrowPosClass = 'left-1/2 -translate-x-1/2';
    if (colIndex <= 1) {
      horizontalClass = 'left-0';
      arrowPosClass = 'left-6';
    } else if (colIndex >= 5) {
      horizontalClass = 'right-0';
      arrowPosClass = 'right-6';
    }

    const arrowClass = isTopRows
      ? 'bottom-full border-b-zinc-950 border-t-transparent'
      : 'top-full border-t-zinc-950 border-b-transparent';

    if (selectedRoomId !== 'ALL') {
      const targetRoom = rooms.find(r => r.id === selectedRoomId || r.roomNumber === selectedRoomId);
      const bBranch = targetRoom?.branch?.toLowerCase() || '';
      const matchedBooking = bookingMap[`${selectedRoomId}_${dateStr}`] || (targetRoom ? (bookingMap[`${targetRoom.id}_${dateStr}`] || bookingMap[`${bBranch}_${targetRoom.roomNumber}_${dateStr}`]) : undefined);
      const isBooked = !!matchedBooking;
      const tileKey = `${selectedRoomId}_${dateStr}`;
      const isActive = activeTileKey === tileKey;

      dayCells.push(
        <div
          key={generateKey(selectedRoomId, year + '-' + month + '-' + day, 'q-day-single')}
          className={`min-h-[95px] p-2 rounded-2xl border transition-all relative flex flex-col justify-between cursor-pointer select-none ${
            isBooked
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
              : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-200 hover:border-emerald-500 hover:shadow-md'
          } ${isToday ? 'ring-2 ring-blue-500' : ''} ${isActive ? 'ring-2 ring-blue-500 border-blue-500 shadow-xl z-40' : 'z-0'}`}
          onClick={() => setActiveTileKey(isActive ? null : tileKey)}
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

          {/* Detailed Click Tooltip */}
          {isActive && (
            <div 
              className={`absolute ${verticalClass} ${horizontalClass} z-[100] w-72 p-3.5 rounded-2xl bg-zinc-950 text-white shadow-2xl border ${isBooked ? 'border-rose-500/50' : 'border-emerald-500/50'} text-left pointer-events-auto animate-in fade-in zoom-in-95 duration-150`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                <span className={`text-xs font-extrabold flex items-center gap-1.5 ${isBooked ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isBooked ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  Room {targetRoom?.roomNumber || selectedRoomId} • {isBooked ? 'Occupied' : 'Available'}
                </span>
                <button 
                  onClick={() => setActiveTileKey(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {isBooked && matchedBooking ? (
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-zinc-100 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{matchedBooking.guestName}</span>
                  </div>
                  {matchedBooking.guestContact && (
                    <div className="text-[11px] text-zinc-300 font-mono flex items-center gap-1.5">
                      <span>📞</span>
                      <span>{matchedBooking.guestContact}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-zinc-400 font-mono pt-1.5 border-t border-zinc-800/80">
                    Stay: {matchedBooking.checkInDate?.slice(0, 10)} ➔ {matchedBooking.checkOutDate?.slice(0, 10)}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <p className="text-emerald-300 text-[11px]">
                    Room is open and ready for reservation on {monthNames[month]} {day}, {year}.
                  </p>
                  {targetRoom && (
                    <div className="text-[10px] text-zinc-400 space-y-0.5 border-t border-zinc-800/80 pt-1.5">
                      <div>Type: <span className="text-zinc-200 font-bold">{targetRoom.roomType}</span></div>
                      {targetRoom.price && <div>Rate: <span className="text-zinc-200 font-bold font-mono">GH₵{targetRoom.price}/night</span></div>}
                      {targetRoom.branch && <div>Lodge: <span className="text-zinc-200">{targetRoom.branch}</span></div>}
                    </div>
                  )}
                </div>
              )}

              {/* Arrow Indicator */}
              <div className={`absolute ${arrowClass} ${arrowPosClass} w-0 h-0 border-l-[6px] border-r-[6px] ${isTopRows ? 'border-b-[6px]' : 'border-t-[6px]'} border-l-transparent border-r-transparent ${isTopRows ? 'border-b-zinc-950' : 'border-t-zinc-950'}`} />
            </div>
          )}
        </div>
      );
    } else {
      // ALL ROOMS OVERVIEW FOR THIS DAY
      let bookedCount = 0;
      let availableCount = 0;

      const rawStatuses = rooms.map(room => {
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
      const isActive = activeTileKey === tileKey;

      // Filtered rooms for this day's popover
      const filteredStatuses = rawStatuses.filter(item => {
        if (popoverFilter === 'AVAILABLE' && item.isBooked) return false;
        if (popoverFilter === 'BOOKED' && !item.isBooked) return false;
        if (popoverSearch.trim()) {
          const q = popoverSearch.toLowerCase();
          const matchesRoom = String(item.room.roomNumber).toLowerCase().includes(q) || item.room.roomType.toLowerCase().includes(q);
          const matchesGuest = item.booking?.guestName?.toLowerCase().includes(q) || item.booking?.guestContact?.toLowerCase().includes(q);
          return matchesRoom || matchesGuest;
        }
        return true;
      });

      dayCells.push(
        <div
          key={generateKey(`${year}-${month}`, day, 'q-day')}
          className={`min-h-[95px] p-2 rounded-2xl border transition-all relative flex flex-col justify-between cursor-pointer select-none ${
            isDarkMode ? 'bg-zinc-900/60 border-zinc-800 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-400'
          } ${isToday ? 'ring-2 ring-blue-500' : ''} ${isActive ? 'ring-2 ring-blue-500 border-blue-500 shadow-xl z-40' : 'z-0'}`}
          onClick={() => {
            if (isActive) {
              setActiveTileKey(null);
            } else {
              setPopoverSearch('');
              setPopoverFilter('ALL');
              setActiveTileKey(tileKey);
            }
          }}
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

          {/* Detailed Click Popover for All Rooms on this day */}
          {isActive && (
            <div 
              className={`absolute ${verticalClass} ${horizontalClass} z-[100] w-80 max-w-[90vw] p-3.5 rounded-2xl bg-zinc-950 text-white shadow-2xl border border-zinc-700/80 text-left pointer-events-auto animate-in fade-in zoom-in-95 duration-150`}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                <div>
                  <h4 className="text-xs font-extrabold text-blue-400">
                    {monthNames[month]} {day}, {year}
                  </h4>
                  <div className="text-[10px] text-zinc-400">
                    <span className="text-emerald-400 font-bold">{availableCount} Free</span> • <span className="text-rose-400 font-bold">{bookedCount} Booked</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTileKey(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Filter Tabs & Search */}
              <div className="space-y-1.5 mb-2">
                <div className="flex items-center gap-1 text-[9px] font-bold">
                  <button
                    onClick={() => setPopoverFilter('ALL')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${popoverFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'}`}
                  >
                    All ({rawStatuses.length})
                  </button>
                  <button
                    onClick={() => setPopoverFilter('AVAILABLE')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${popoverFilter === 'AVAILABLE' ? 'bg-emerald-600 text-white' : 'bg-zinc-800/80 text-emerald-400/80 hover:text-emerald-300'}`}
                  >
                    Available ({availableCount})
                  </button>
                  <button
                    onClick={() => setPopoverFilter('BOOKED')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${popoverFilter === 'BOOKED' ? 'bg-rose-600 text-white' : 'bg-zinc-800/80 text-rose-400/80 hover:text-rose-300'}`}
                  >
                    Booked ({bookedCount})
                  </button>
                </div>

                {rooms.length > 5 && (
                  <div className="relative">
                    <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2" />
                    <input
                      type="text"
                      value={popoverSearch}
                      onChange={(e) => setPopoverSearch(e.target.value)}
                      placeholder="Search room or guest name..."
                      className="w-full bg-zinc-900/90 text-[10px] pl-6 pr-2 py-1 rounded-lg border border-zinc-800 focus:outline-none focus:border-blue-500 text-zinc-100 placeholder-zinc-500"
                    />
                  </div>
                )}
              </div>

              {/* Scrollable Room List */}
              <div 
                className="max-h-56 overflow-y-auto space-y-1.5 pr-1 overscroll-contain custom-inset-scrollbar"
                onWheel={(e) => e.stopPropagation()}
              >
                {filteredStatuses.length === 0 ? (
                  <div className="py-4 text-center text-[10px] text-zinc-500">
                    No matching rooms found
                  </div>
                ) : (
                  filteredStatuses.map(({ room, isBooked, booking }, idx) => (
                    <div 
                      key={generateKey(room.id || room.roomNumber, idx, 'q-room')}
                      className={`p-2 rounded-xl border text-[10px] flex items-center justify-between transition-colors ${
                        isBooked 
                          ? 'bg-rose-950/40 border-rose-900/60 text-rose-200' 
                          : 'bg-emerald-950/30 border-emerald-900/40 text-emerald-200'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isBooked ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                          <span className="font-bold text-white text-[11px]">Room {room.roomNumber}</span>
                          <span className="text-[9px] text-zinc-400 truncate">({room.roomType})</span>
                        </div>
                        {isBooked && booking?.guestContact && (
                          <div className="text-[9px] text-zinc-400 font-mono ml-3">
                            📞 {booking.guestContact}
                          </div>
                        )}
                      </div>
                      {isBooked && booking ? (
                        <span className="font-semibold text-rose-300 truncate max-w-[110px] shrink-0 text-right" title={booking.guestName}>
                          👤 {booking.guestName}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded-md text-[9px] shrink-0">
                          Available
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Arrow Indicator */}
              <div className={`absolute ${arrowClass} ${arrowPosClass} w-0 h-0 border-l-[6px] border-r-[6px] ${isTopRows ? 'border-b-[6px]' : 'border-t-[6px]'} border-l-transparent border-r-transparent ${isTopRows ? 'border-b-zinc-950' : 'border-t-zinc-950'}`} />
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div id="quick-availability-calendar-root" ref={calendarRef} className={`p-6 rounded-3xl flex flex-col space-y-5 ${
      isDarkMode ? 'neu-raised-lg text-zinc-100' : 'bg-white border border-slate-200 text-slate-800 shadow-xl'
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
              Click any date tile to lock room details. Scroll freely to browse rooms & guest names. Press Esc or click outside to close.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Room Filter Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <Bed className="w-4 h-4 text-zinc-400 ml-2" />
            <select
              value={selectedRoomId}
              onChange={(e) => {
                setActiveTileKey(null);
                setSelectedRoomId(e.target.value);
              }}
              className="bg-transparent text-xs font-bold focus:outline-none pr-3 py-1 text-zinc-800 dark:text-zinc-100 cursor-pointer"
            >
              <option value="ALL" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">All Rooms Overview</option>
              {rooms.map((r, idx) => (
                <option key={generateKey(r.id || r.roomNumber, idx, 'q-opt')} value={r.id} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">
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
        {weekdays.map((wd, idx) => (
          <div key={generateKey(wd, idx, 'q-wd')} className="py-1">
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
            <span>Booked (Click for details)</span>
          </div>
        </div>

        <div className="text-[10px] font-mono text-zinc-400">
          Web app developed by SUALAH TELLEM (0553189032)
        </div>
      </div>
    </div>
  );
};
