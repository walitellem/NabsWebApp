import React, { useState } from 'react';
import { Booking } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { generateKey } from '../utils/keyGenerator';

interface RoomBookingCalendarProps {
  roomId: string;
  branch?: string;
  bookings: Booking[];
  checkInDate: string;
  checkOutDate: string;
  onDatesChange: (checkIn: string, checkOut: string) => void;
  isDarkMode: boolean;
}

export const RoomBookingCalendar: React.FC<RoomBookingCalendarProps> = ({
  roomId,
  branch,
  bookings,
  checkInDate,
  checkOutDate,
  onDatesChange,
  isDarkMode,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Get active, confirmed bookings for the selected room
  const activeBookings = bookings.filter(
    (b) => {
      const isInactive = b.status === 'CheckedOut' || b.status === 'checked_out' || b.status === 'Cancelled' || b.status === 'cancelled';
      if (isInactive) return false;
      if (b.roomId && b.roomId === roomId) return true;
      if (branch && b.branch && b.branch !== branch) return false;

      const cleanRoomNum = roomId.replace(/^Room\s+/i, '');
      return String(b.roomNumber) === String(cleanRoomNum);
    }
  );

  const startOfDay = (date: Date | string) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const todayTime = startOfDay(new Date());

  // Core availability check using normalized start-of-day
  // Note: Standard hospitality rule - a room is occupied for NIGHTS between checkInTime and checkOutTime.
  // On checkOutTime day, the previous guest departs, making checkOutTime available for new check-in!
  const getBookingForDate = (date: Date) => {
    const dateTime = startOfDay(date);
    return activeBookings.find((range) => {
      const checkInTime = startOfDay(range.checkInDate);
      const checkOutTime = startOfDay(range.checkOutDate);
      return dateTime >= checkInTime && dateTime < checkOutTime;
    });
  };

  const isDateBooked = (date: Date) => !!getBookingForDate(date);

  const isDatePast = (date: Date) => {
    return startOfDay(date) < todayTime;
  };

  // Helper to format date as YYYY-MM-DDTHH:MM for inputs
  const formatDateTimeLocal = (date: Date, hours: number, minutes: number = 0) => {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  // Get days in a month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectDay = (day: number) => {
    const targetDate = new Date(year, month, day);
    if (isDatePast(targetDate)) return;

    const targetTime = startOfDay(targetDate);
    const hasCheckInOnly = checkInDate && !checkOutDate;

    if (hasCheckInOnly) {
      const currentCheckInTime = startOfDay(checkInDate);

      if (targetTime > currentCheckInTime) {
        // Ensure no booked dates are overlapped in the stay range (nights before check-out)
        let overlapsBooked = false;
        const check = new Date(currentCheckInTime);
        while (check.getTime() < targetTime) {
          if (isDateBooked(check)) {
            overlapsBooked = true;
            break;
          }
          check.setDate(check.getDate() + 1);
        }

        if (!overlapsBooked) {
          // Set as check-out date
          const checkOutStr = formatDateTimeLocal(targetDate, 12, 0); // Default check-out time 12:00
          onDatesChange(checkInDate, checkOutStr);
          return;
        }
      }
    }

    // Default behavior if targetDate is booked or restarting check-in selection:
    if (isDateBooked(targetDate)) return;
    const checkInStr = formatDateTimeLocal(targetDate, 14, 0);
    onDatesChange(checkInStr, '');
  };

  // Check if a day is selected or within selected range
  const getDayState = (day: number) => {
    const d = new Date(year, month, day);
    const dTime = startOfDay(d);

    const hasIn = !!checkInDate;
    const hasOut = !!checkOutDate;
    const inTime = hasIn ? startOfDay(checkInDate) : 0;
    const outTime = hasOut ? startOfDay(checkOutDate) : 0;

    const isStart = hasIn && dTime === inTime;
    const isEnd = hasOut && dTime === outTime;
    const isInRange = hasIn && hasOut && dTime > inTime && dTime < outTime;

    return { isStart, isEnd, isInRange };
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days array for rendering
  const days: React.ReactNode[] = [];
  
  // Fill empty spaces before first day
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={generateKey(i, i, 'rb-empty')} className="h-9 w-9" />);
  }

  // Fill actual month days
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, month, day);
    const moStr = String(month + 1).padStart(2, '0');
    const dyStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${moStr}-${dyStr}`;
    const isPast = isDatePast(d);
    const bookingData = getBookingForDate(d);
    const isBooked = !!bookingData;
    const { isStart, isEnd, isInRange } = getDayState(day);

    const isValidCheckOutTarget = (() => {
      if (!checkInDate || checkOutDate) return false;
      const targetMs = startOfDay(d);
      const inMs = startOfDay(checkInDate);
      if (targetMs <= inMs) return false;

      let check = new Date(inMs);
      while (check.getTime() < targetMs) {
        if (isDateBooked(check)) return false;
        check.setDate(check.getDate() + 1);
      }
      return true;
    })();

    const canSelect = !isPast && (!isBooked || isValidCheckOutTarget);

    let cellClass = "";
    if (isPast) {
      cellClass = "bg-zinc-50 text-zinc-300 line-through cursor-not-allowed dark:bg-zinc-950 dark:text-zinc-700 opacity-30 pointer-events-none";
    } else if (isStart || isEnd) {
      cellClass = "bg-blue-600 text-white font-bold cursor-pointer ring-2 ring-blue-500/20";
    } else if (isInRange) {
      cellClass = "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer";
    } else if (isBooked && isValidCheckOutTarget) {
      cellClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-semibold cursor-pointer";
    } else if (isBooked) {
      cellClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 line-through cursor-not-allowed font-medium";
    } else {
      cellClass = "border border-zinc-150 dark:border-zinc-800 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/10 text-zinc-800 dark:text-zinc-200 cursor-pointer";
    }

    days.push(
      <button
        key={generateKey(`${currentDate.getFullYear()}-${currentDate.getMonth()}`, day, 'rb-day')}
        type="button"
        disabled={!canSelect}
        onClick={() => {
          if (canSelect) selectDay(day);
        }}
        onMouseEnter={() => isBooked && setHoveredDate(dateStr)}
        onMouseLeave={() => setHoveredDate(null)}
        className={`h-9 w-9 text-xs rounded-xl flex flex-col items-center justify-center transition-all relative font-medium ${cellClass}`}
      >
        <span>{day}</span>
        {!isPast && (!isBooked || isValidCheckOutTarget) && (
          <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2 ${isStart || isEnd ? 'bg-white' : 'bg-emerald-500'}`} />
        )}

        {/* Detailed hover tooltip displaying room & guest details */}
        {isBooked && hoveredDate === dateStr && bookingData && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-[100] whitespace-nowrap bg-zinc-950 text-white text-[11px] p-2.5 rounded-2xl shadow-2xl border border-rose-500/40 transition-all pointer-events-none text-left min-w-[150px]">
            <div className="font-extrabold text-rose-400 flex items-center gap-1 text-[11px] mb-1">
              <span>🔒 Booked</span> • <span>Room {bookingData.roomNumber || roomId}</span>
            </div>
            <div className="text-zinc-100 font-bold text-[11px]">👤 {bookingData.guestName}</div>
            {bookingData.checkInDate && bookingData.checkOutDate && (
              <div className="text-[10px] text-zinc-400 font-mono mt-1 pt-1 border-t border-zinc-800">
                📅 {bookingData.checkInDate.slice(0, 10)} ➔ {bookingData.checkOutDate.slice(0, 10)}
              </div>
            )}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-950" />
          </div>
        )}
      </button>
    );
  }

  return (
    <div className={`p-4 rounded-2xl ${isDarkMode ? 'neu-raised text-zinc-100' : 'bg-white border border-slate-200 text-slate-800'}`}>
      <div className="flex items-center justify-between mb-4">
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
            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">
        {weekdays.map((wd, idx) => (
          <div key={generateKey(wd, idx, 'rb-wd')} className="h-5 flex items-center justify-center">{wd}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[9px] border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/10 border border-emerald-500 flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 line-through text-[6px] flex items-center justify-center">✔</span>
          <span className="text-zinc-500 dark:text-zinc-400 font-medium font-mono">Booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-blue-600" />
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Selected</span>
        </div>
      </div>
    </div>
  );
};
