import { Room, Booking, RoomStatus } from '../types';

/**
 * Deterministically checks if a booking is active (CheckedIn) for a given room.
 * Handled with dual ID + Room Number matching and strict branch isolation.
 */
export function isBookingForRoom(booking: Booking, room: Room, allRooms: Room[] = []): boolean {
  if (!booking || !room) return false;

  const isActive = booking.status === 'CheckedIn' || (booking.status as string) === 'checked_in';
  if (!isActive) return false;

  const normRoomId = String(room.id || '').trim().toLowerCase();
  const normRoomNum = String(room.roomNumber || '').trim().toLowerCase();
  const normRoomBranch = String(room.branch || 'Annex').trim().toLowerCase();

  // 1. Determine booking's true branch
  let bookingBranch = (booking.branch || booking.lodgeBranch || '').trim();
  if (!bookingBranch && booking.roomId && allRooms.length > 0) {
    const matchedRoom = allRooms.find(rm => String(rm.id || '').trim().toLowerCase() === String(booking.roomId || '').trim().toLowerCase());
    if (matchedRoom?.branch) {
      bookingBranch = matchedRoom.branch;
    }
  }

  // If booking branch is known, it MUST match the room's branch
  if (bookingBranch) {
    if (bookingBranch.toLowerCase() !== normRoomBranch) {
      return false;
    }
  }

  // 2. Check room ID or room number match
  const bookedRoomIds = String(booking.roomId || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const bookedRoomNums = String(booking.roomNumber || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  if (bookedRoomIds.includes(normRoomId)) return true;
  if (bookedRoomNums.includes(normRoomNum)) return true;

  return false;
}

/**
 * Single ground truth function for effective room status.
 * Returns 'Occupied' IF AND ONLY IF there is an active CheckedIn booking for that room.
 * Otherwise respects 'Maintenance' or 'Cleaning', defaulting to 'Available'.
 */
export function computeEffectiveRoomStatus(room: Room, bookings: Booking[], allRooms: Room[] = []): RoomStatus {
  if (!room) return 'Available';

  const activeBooking = bookings.find(b => isBookingForRoom(b, room, allRooms));
  if (activeBooking) {
    return 'Occupied';
  }

  // Maintenance and Cleaning override Available when no active guest is checked in
  if (room.status === 'Maintenance') return 'Maintenance';
  if (room.status === 'Cleaning') return 'Cleaning';

  return 'Available';
}

/**
 * Returns the active booking object associated with a room, or null if none.
 */
export function getActiveBookingForRoom(room: Room, bookings: Booking[], allRooms: Room[] = []): Booking | null {
  if (!room || !bookings || bookings.length === 0) return null;
  return bookings.find(b => isBookingForRoom(b, room, allRooms)) || null;
}
