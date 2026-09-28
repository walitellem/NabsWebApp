import { collection, getDocs, doc } from 'firebase/firestore';
import { db, safeSetDoc } from '../firebase';
import { Booking } from '../types';
import { getBookings, saveBookings } from '../data';

/**
 * Sorts bookings in descending chronological order (newest check-ins and created dates first)
 */
export const sortBookingsDescending = (bookingsList: Booking[]): Booking[] => {
  const getTime = (b: any): number => {
    if (!b) return 0;
    const val = b.createdAt || b.dateCreated || b.checkInDate;
    if (!val) return 0;
    const t = new Date(val).getTime();
    return isNaN(t) ? 0 : t;
  };

  return [...bookingsList].sort((a, b) => getTime(b) - getTime(a));
};

/**
 * Reconciles remote Firestore bookings with local storage cache.
 * Firestore is the ONLY single source of truth.
 * Updates local storage cache to reflect current Firestore state.
 */
export const syncAndReconcileBookings = async (
  remoteBookings: Booking[]
): Promise<Booking[]> => {
  try {
    const sortedRemote = sortBookingsDescending(remoteBookings);
    saveBookings(sortedRemote);
    return sortedRemote;
  } catch (error) {
    console.warn('[Sync] Local cache write warning:', error);
    return sortBookingsDescending(remoteBookings);
  }
};

/**
 * Directly queries Firestore for the latest booking documents with a timeout fallback.
 */
export const fetchFreshBookingsFromFirestore = async (): Promise<Booking[]> => {
  try {
    const fetchPromise = getDocs(collection(db, 'bookings'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('FIRESTORE_TIMEOUT')), 7000)
    );

    const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
    const remoteData: Booking[] = [];
    snapshot.forEach((d) => {
      remoteData.push({ id: d.id, ...d.data() } as Booking);
    });

    return await syncAndReconcileBookings(remoteData);
  } catch (err) {
    console.warn('[Sync] Direct fetch failed or timed out. Serving local storage cache.', err);
    return sortBookingsDescending(getBookings());
  }
};
