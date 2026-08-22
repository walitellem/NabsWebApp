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

  // Infer branch from roomId string if present (e.g., "room_ayigya_101")
  if (!bookingBranch && booking.roomId) {
    const lowId = String(booking.roomId).toLowerCase();
    if (lowId.includes('ayigya')) bookingBranch = 'Ayigya';
    else if (lowId.includes('annex')) bookingBranch = 'Annex';
  }

  // Fallback for legacy records without branch metadata: default to Annex
  if (!bookingBranch) {
    bookingBranch = 'Annex';
  }

  // Crucial check: If booking branch does not match room branch, fail immediately
  if (bookingBranch.toLowerCase() !== normRoomBranch) {
    return false;
  }

  // 2. Room ID or Room Number matching with strict composite room protection
  const bookedRoomIds = String(booking.roomId || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  // If booking has valid roomId(s), match primarily by roomId
  if (bookedRoomIds.length > 0) {
    if (bookedRoomIds.includes(normRoomId)) return true;

    // If booking's roomId matches a known room in allRooms, then booking explicitly references another room ID
    const matchesKnownRoomId = allRooms.some(r => bookedRoomIds.includes(String(r.id || '').trim().toLowerCase()));
    if (matchesKnownRoomId) {
      return false;
    }
  }

  // Fallback or secondary check using room numbers
  const normBookingRoomNum = String(booking.roomNumber || '').replace(/\s+/g, '').toLowerCase();
  const normTargetRoomNum = normRoomNum.replace(/\s+/g, '').toLowerCase();

  // Exact room number string match (e.g., "401,402,403" === "401,402,403" or "401" === "401")
  if (normBookingRoomNum && normBookingRoomNum === normTargetRoomNum) {
    return true;
  }

  // Check if any room in the same branch is a composite room whose roomNumber exactly equals booking.roomNumber
  if (allRooms.length > 0) {
    const sameBranchRooms = allRooms.filter(r => String(r.branch || 'Annex').trim().toLowerCase() === normRoomBranch);
    const hasExactCompositeRoom = sameBranchRooms.some(r => {
      const rNumNorm = String(r.roomNumber || '').replace(/\s+/g, '').toLowerCase();
      return rNumNorm === normBookingRoomNum;
    });

    // If an exact composite room exists for this booking's roomNumber (e.g. "401,402,403"), 
    // but the target room's roomNumber is not that exact string (e.g., target room is "401"),
    // then this booking belongs strictly to the composite room, NOT to the individual sub-room!
    if (hasExactCompositeRoom) {
      return false;
    }
  }

  // Sub-room / multi-room split matching only if no exact composite room exists
  const bookedRoomNums = String(booking.roomNumber || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (bookedRoomNums.includes(normRoomNum)) {
    return true;
  }

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
