import React, { useState } from 'react';
import { Booking } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface FutureStayCalendarProps {
  selectedRoom: string; // The selected room ID
  bookings: Booking[];  // Branch bookings
  onSelectDate: (dateString: string) => void; // Clicking available date callback
  futureCheckIn: string; // Parent check-in state
  futureCheckOut: string; // Parent check-out state
  onClearSelection?: () => void;
  isDarkMode?: boolean;
}

export const FutureStayCalendar: React.FC<FutureStayCalendarProps> = ({
  selectedRoom,
  bookings,
  onSelectDate,
  futureCheckIn,
  futureCheckOut,
  onClearSelection,
  isDarkMode = true,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const getLocalDateMidnight = (dateVal: Date | string) => {
    if (!dateVal) return 0;
    if (typeof dateVal === 'string') {
      const cleanStr = dateVal.split('T')[0];
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        const d = Number(parts[2]);
        const dateObj = new Date(y, m, d);
        dateObj.setHours(0, 0, 0, 0);
        return dateObj.getTime();
      }
    }
    const dObj = new Date(dateVal);
    dObj.setHours(0, 0, 0, 0);
    return dObj.getTime();
  };

  const todayMidnight = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();

  const isDatePast = (date: Date) => {
    return getLocalDateMidnight(date) < todayMidnight;
  };

  // If no room is selected yet, render the clean placeholder state
  if (!selectedRoom) {
    return (
      <div id="future-stay-calendar-placeholder" className={`p-6 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[220px] ${
        isDarkMode ? 'bg-zinc-950 border-zinc-800/40 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <CalendarIcon className="w-8 h-8 text-emerald-500 mb-3 animate-pulse" />
        <p className={`text-xs font-semibold tracking-wide ${isDarkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
          ⚠️ Please select a Room Number to view calendar availability.
        </p>
        <p className={`text-[10px] mt-2 font-mono max-w-xs ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
          Selecting a room dynamically loads real-time booking slots for checking availability.
        </p>
        <div className={`mt-6 text-[10px] font-mono border-t w-full pt-4 ${isDarkMode ? 'text-zinc-600 border-zinc-900' : 'text-slate-400 border-slate-100'}`}>
          Web app developed by SUALAH TELLEM (0553189032)
        </div>
      </div>
    );
  }

  // Generate mapped blocked dates for the selected room
  const getBlockedDates = () => {
    const blocked: { [dateStr: string]: { guestName: string; roomNumber?: string; checkInDate?: string; checkOutDate?: string; bookingId: string } } = {};
    
    const activeBookings = bookings.filter((b) => {
      const isSameRoom = b.roomId === selectedRoom || b.roomNumber === selectedRoom || `Room ${b.roomNumber}` === selectedRoom || b.roomId === `room_annex_${selectedRoom}` || b.roomId === `room_ayigya_${selectedRoom}`;
      const isActiveStatus = b.status !== 'CheckedOut' && b.status !== 'checked_out' && b.status !== 'Cancelled' && b.status !== 'cancelled';
      return isSameRoom && isActiveStatus;
    });

    activeBookings.forEach((b) => {
      if (!b.checkInDate || typeof b.checkInDate !== 'string' || !b.checkOutDate || typeof b.checkOutDate !== 'string') return;
      const startStr = b.checkInDate.split('T')[0];
      const endStr = b.checkOutDate.split('T')[0];
      const startParts = startStr.split('-');
      const endParts = endStr.split('-');
      
      if (startParts.length === 3 && endParts.length === 3) {
        const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
        const end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]));
        
        const current = new Date(start);
        while (current < end) {
          const y = current.getFullYear();
          const m = String(current.getMonth() + 1).padStart(2, '0');
          const d = String(current.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          blocked[dateStr] = { 
            guestName: b.guestName, 
            roomNumber: b.roomNumber || selectedRoom, 
            checkInDate: b.checkInDate, 
            checkOutDate: b.checkOutDate, 
            bookingId: b.id 
          };
          current.setDate(current.getDate() + 1);
        }
      }
    });

    return blocked;
  };

  const blockedDates = getBlockedDates();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Sunday to Saturday weekday headers matching the screenshot!
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0, Monday is 1, etc.
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const dayCells: React.ReactNode[] = [];

  // Empty cells for Sunday alignment
  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(<div key={`empty-${i}`} className="h-9 w-9" />);
  }

  // Render day tiles
  for (let day = 1; day <= totalDays; day++) {
    const dObj = new Date(year, month, day);
    const moStr = String(month + 1).padStart(2, '0');
    const dyStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${moStr}-${dyStr}`;
    const blockedData = blockedDates[dateStr];
    const isLocked = !!blockedData;
    const isPast = isDatePast(dObj);

    const isCheckIn = futureCheckIn && futureCheckIn.split('T')[0] === dateStr;
    const isCheckOut = futureCheckOut && futureCheckOut.split('T')[0] === dateStr;
    
    const inRange = (() => {
      if (!futureCheckIn || !futureCheckOut) return false;
      const currentMs = getLocalDateMidnight(dateStr);
      const inMs = getLocalDateMidnight(futureCheckIn);
      const outMs = getLocalDateMidnight(futureCheckOut);
      return currentMs > inMs && currentMs < outMs;
    })();

    let cellClass = "";
    if (isPast) {
      cellClass = "bg-zinc-50 text-zinc-300 line-through cursor-not-allowed dark:bg-zinc-950 dark:text-zinc-700 opacity-30 pointer-events-none";
    } else if (isLocked) {
      cellClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 line-through cursor-not-allowed font-medium";
    } else if (isCheckIn || isCheckOut) {
      cellClass = "bg-blue-600 text-white font-bold cursor-pointer ring-2 ring-blue-500/20";
    } else if (inRange) {
      cellClass = "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer";
    } else {
      cellClass = "border border-zinc-150 dark:border-zinc-800 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/10 text-zinc-800 dark:text-zinc-200 cursor-pointer";
    }

    dayCells.push(
      <button
        key={`day-${day}`}
        type="button"
        disabled={isPast}
        className={`h-9 w-9 text-xs rounded-xl flex flex-col items-center justify-center transition-all relative font-medium ${cellClass}`}
        onClick={() => {
          if (!isPast && !isLocked) {
            onSelectDate(dateStr);
          }
        }}
        onMouseEnter={() => isLocked && setHoveredDate(dateStr)}
        onMouseLeave={() => setHoveredDate(null)}
      >
        <span>{day}</span>

        {!isPast && !isLocked && (
          <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2 ${isCheckIn || isCheckOut ? 'bg-white' : 'bg-emerald-500'}`} />
        )}

        {/* Detailed hover tooltip displaying room & guest details */}
        {isLocked && hoveredDate === dateStr && blockedData && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-[100] whitespace-nowrap bg-zinc-950 text-white text-[11px] p-2.5 rounded-2xl shadow-2xl border border-rose-500/40 transition-all pointer-events-none text-left min-w-[150px]">
            <div className="font-extrabold text-rose-400 flex items-center gap-1 text-[11px] mb-1">
              <span>🔒 Booked</span> • <span>Room {blockedData.roomNumber || selectedRoom}</span>
            </div>
            <div className="text-zinc-100 font-bold text-[11px]">👤 {blockedData.guestName}</div>
            {blockedData.checkInDate && blockedData.checkOutDate && (
              <div className="text-[10px] text-zinc-400 font-mono mt-1 pt-1 border-t border-zinc-800">
                📅 {blockedData.checkInDate.slice(0, 10)} ➔ {blockedData.checkOutDate.slice(0, 10)}
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-950" />
          </div>
        )}
      </button>
    );
  }

  return (
    <div id="future-stay-calendar-root" className={`p-4 rounded-2xl border flex flex-col space-y-3.5 shadow-2xl ${
      isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold font-mono tracking-wide">
            {monthNames[month]} {year}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className={`p-1.5 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday column labels (Sun-Sat) */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
        {weekdays.map((wd) => (
          <div key={wd} className="h-5 flex items-center justify-center">
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {dayCells}
      </div>

      {/* Controls & Legend & Footer */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex flex-col space-y-2">
        <div className="flex items-center justify-between text-[9px] text-zinc-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/10 border border-emerald-500 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </span>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 line-through text-[6px] flex items-center justify-center">✔</span>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-md bg-blue-600 inline-block" />
              <span>Selected</span>
            </div>
          </div>
          {onClearSelection && (futureCheckIn || futureCheckOut) && (
            <button
              type="button"
              onClick={onClearSelection}
              className="font-mono text-zinc-400 hover:text-blue-500 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Required developer signature layout */}
        <div className="text-center text-[10px] font-mono text-zinc-500 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/50">
          Web app developed by SUALAH TELLEM (0553189032)
        </div>
      </div>
    </div>
  );
};
