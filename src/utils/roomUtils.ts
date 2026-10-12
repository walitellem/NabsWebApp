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

  // Primary Check: If booking.roomId directly contains room.id, it is a DEFINITIVE match!
  const bookedRoomIds = String(booking.roomId || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (bookedRoomIds.length > 0 && bookedRoomIds.includes(normRoomId)) {
    return true;
  }

  // Branch normalization helper ("Ayigya", "Ayigya Branch", "Main" -> "ayigya"; "Annex", "Annex Branch" -> "annex")
  const normalizeBranch = (b?: string): string => {
    if (!b) return '';
    const low = String(b).toLowerCase().trim();
    if (low.includes('ayigya') || low.includes('main')) return 'ayigya';
    if (low.includes('annex')) return 'annex';
    return low;
  };

  let bookingBranchNorm = normalizeBranch(booking.branch || booking.lodgeBranch);
  const roomBranchNorm = normalizeBranch(room.branch);

  if (!bookingBranchNorm && booking.roomId && allRooms.length > 0) {
    const matchedRoom = allRooms.find(rm => String(rm.id || '').trim().toLowerCase() === String(booking.roomId || '').trim().toLowerCase());
    if (matchedRoom?.branch) {
      bookingBranchNorm = normalizeBranch(matchedRoom.branch);
    }
  }

  if (!bookingBranchNorm && booking.roomId) {
    bookingBranchNorm = normalizeBranch(booking.roomId);
  }

  // Strict branch isolation ONLY if both branches are explicitly known and different
  if (bookingBranchNorm && roomBranchNorm && bookingBranchNorm !== roomBranchNorm) {
    return false;
  }

  // Room ID or Room Number matching with strict composite room protection
  if (bookedRoomIds.length > 0) {
    const matchesKnownRoomId = allRooms.some(r => bookedRoomIds.includes(String(r.id || '').trim().toLowerCase()));
    if (matchesKnownRoomId) {
      return false;
    }
  }

  // Fallback or secondary check using room numbers
  const normBookingRoomNum = String(booking.roomNumber || '').replace(/\s+/g, '').toLowerCase();
  const normTargetRoomNum = normRoomNum.replace(/\s+/g, '').toLowerCase();

  if (normBookingRoomNum && normBookingRoomNum === normTargetRoomNum) {
    return true;
  }

  // Check if any room in the same branch is a composite room whose roomNumber exactly equals booking.roomNumber
  if (allRooms.length > 0) {
    const sameBranchRooms = allRooms.filter(r => normalizeBranch(r.branch) === (roomBranchNorm || 'annex'));
    const hasExactCompositeRoom = sameBranchRooms.some(r => {
      const rNumNorm = String(r.roomNumber || '').replace(/\s+/g, '').toLowerCase();
      return rNumNorm === normBookingRoomNum;
    });

    if (hasExactCompositeRoom) {
      return false;
    }
  }

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
