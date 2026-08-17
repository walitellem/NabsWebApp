import React, { useState, useEffect } from 'react';
import { Booking, Room, User } from '../types';
import { motion } from 'motion/react';
import { X, ArrowRight, Home, CreditCard, Info } from 'lucide-react';
import { db } from '../firebase';
import { doc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { addAuditLog, getFormattedDateTime, getBookings } from '../data';
import { useToast } from './ToastContext';

interface TransferRoomModalProps {
  booking: Booking;
  rooms: Room[];
  isDarkMode: boolean;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferRoomModal: React.FC<TransferRoomModalProps> = ({
  booking, rooms, isDarkMode, currentUser, onClose, onSuccess
}) => {
  const { addToast } = useToast();
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [newTotalPrice, setNewTotalPrice] = useState<number>(booking.totalPrice || 0);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bookings = getBookings(); // We need all bookings to check scheduling conflicts

  // Check if room has any scheduling conflicts between now and the check-out date
  const isRoomAvailableForRemainingStay = (roomId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const reqEndStr = booking.checkOutDate?.split('T')[0] || todayStr;

    // If they are checking out today anyway, no future conflict check is needed beyond today
    if (reqEndStr <= todayStr) return true;

    // Check against all other bookings
    return !bookings.some(b => {
      // Ignore current booking
      if (b.id === booking.id) return false;
      
      // Ignore inactive bookings
      if (b.status === 'Cancelled' || b.status === 'No Show' || b.status === 'CheckedOut' || b.status === 'checked_out') return false;

      // Check if it's the target room
      const isSameRoom = b.roomId === roomId || b.roomNumber === roomId || `Room ${b.roomNumber}` === roomId;
      if (!isSameRoom) return false;

      const existStartStr = b.checkInDate ? b.checkInDate.split('T')[0] : '';
      const existEndStr = b.checkOutDate ? b.checkOutDate.split('T')[0] : '';
      if (!existStartStr || !existEndStr) return false;

      // Conflict exists if the existing booking overlaps with [today, reqEndStr]
      // A booking overlaps if it starts before our checkout AND ends after our check-in (today)
      return (todayStr < existEndStr) && (reqEndStr > existStartStr);
    });
  };
  
  const availableRooms = rooms.filter(r => 
    r.branch === booking.branch && 
    r.status !== 'Occupied' &&
    isRoomAvailableForRemainingStay(r.id)
  );
  
  const theme = {
    bg: isDarkMode ? 'bg-zinc-950 text-white' : 'bg-white text-slate-900',
    panel: isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200',
    input: isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-300 text-slate-900',
    text: isDarkMode ? 'text-zinc-300' : 'text-slate-600',
    border: isDarkMode ? 'border-zinc-800' : 'border-slate-200',
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  useEffect(() => {
    if (selectedRoom) {
      // Assuming a simple calculation for demo: base it on the target room price
      // This is a placeholder for your actual business logic if you have one.
      setNewTotalPrice(selectedRoom.price || booking.totalPrice || 0);
    }
  }, [selectedRoomId, selectedRoom]);

  const priceDiff = newTotalPrice - (booking.totalPrice || 0);

  const handleTransfer = async () => {
    if (!selectedRoomId) {
      addToast('Missing Room', 'error', 'Please select a new room for the transfer.');
      return;
    }
    if (!selectedRoom) return;

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      const bookingRef = doc(db, 'bookings', booking.id);
      
      const newBalanceDue = (booking.balance_due || 0) + priceDiff;

      // 1. Update Booking
      batch.update(bookingRef, {
        roomId: selectedRoom.id,
        roomNumber: selectedRoom.roomNumber,
        roomType: selectedRoom.roomType,
        totalPrice: newTotalPrice,
        balance_due: newBalanceDue,
        updatedAt: new Date().toISOString()
      });

      // 2. Sweep Drink Sales and update room numbers
      const drinksQ = query(collection(db, 'drinkSales'), where('bookingId', '==', booking.id));
      const drinksSnap = await getDocs(drinksQ);
      drinksSnap.forEach(dDoc => {
        batch.update(dDoc.ref, {
          roomId: selectedRoom.id,
          roomNumber: selectedRoom.roomNumber
        });
      });

      // 2.5 Sweep RoomRevenue and update room numbers
      const revsQ = query(collection(db, 'RoomRevenue'), where('bookingId', '==', booking.id));
      const revsSnap = await getDocs(revsQ);
      revsSnap.forEach(rDoc => {
        batch.update(rDoc.ref, {
          roomNumber: selectedRoom.roomNumber,
          roomType: selectedRoom.roomType
        });
      });

      // 3. Mark old room available, new room occupied
      const oldRoomRef = doc(db, 'rooms', booking.roomId);
      batch.update(oldRoomRef, { status: 'Available' });

      const newRoomRef = doc(db, 'rooms', selectedRoom.id);
      batch.update(newRoomRef, { status: 'Occupied' });

      await batch.commit();

      // Audit Log
      await addAuditLog(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        booking.branch,
        'Room Transfer',
        `Guest ${booking.guestName} transferred from Room ${booking.roomNumber} to Room ${selectedRoom.roomNumber}. Reason: ${reason || 'Not specified'}. Price adjusted by GH₵${priceDiff.toFixed(2)}.`
      );

      addToast('Transfer Complete', 'success', `Guest successfully moved to Room ${selectedRoom.roomNumber}`);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      addToast('Transfer Failed', 'error', 'Failed to complete the room transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl overflow-hidden border ${theme.bg} ${theme.border}`}
      >
        <div className={`p-4 border-b flex justify-between items-center shrink-0 ${theme.border}`}>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <ArrowRight className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Transfer Room (Folio Migration)</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Current Status */}
          <div className={`p-4 rounded-xl border ${theme.panel} flex items-center justify-between`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Current Assignment</p>
              <div className="flex items-center gap-2 mt-1">
                <Home className="w-4 h-4 text-purple-500" />
                <p className="font-bold text-lg">Room {booking.roomNumber}</p>
              </div>
              <p className="text-sm font-medium mt-1">{booking.guestName}</p>
            </div>
            <ArrowRight className="w-6 h-6 text-zinc-400" />
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">New Assignment</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <Home className="w-4 h-4 text-blue-500" />
                <p className="font-bold text-lg">{selectedRoom ? `Room ${selectedRoom.roomNumber}` : '---'}</p>
              </div>
              <p className="text-sm font-medium mt-1 text-zinc-400">{selectedRoom ? selectedRoom.roomType : 'Select below'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-zinc-500">Target Room</label>
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 transition-all ${theme.input}`}
              >
                <option value="">-- Select Available Room --</option>
                {availableRooms.map(r => (
                  <option key={r.id} value={r.id}>Room {r.roomNumber} - {r.roomType} (GH₵{r.price}/night)</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-zinc-500">Original Total</label>
                <div className={`w-full px-4 py-3 rounded-xl border font-mono opacity-70 ${theme.input}`}>
                  GH₵{booking.totalPrice?.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-zinc-500">New Adjusted Total</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-zinc-400 font-mono text-sm">GH₵</span>
                  </div>
                  <input
                    type="number"
                    value={newTotalPrice}
                    onChange={(e) => setNewTotalPrice(Number(e.target.value))}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border font-mono focus:ring-2 focus:ring-purple-500 transition-all ${theme.input}`}
                  />
                </div>
                <div className={`mt-2 text-xs font-bold ${priceDiff === 0 ? 'text-zinc-400' : priceDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {priceDiff >= 0 ? '+' : ''}GH₵{priceDiff.toFixed(2)} adjustment
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-zinc-500">Reason for Transfer (Optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. AC not working, Upgraded to suite"
                className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-purple-500 transition-all ${theme.input}`}
              />
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-medium">
              This is an atomic Folio Migration. All unpaid restaurant and drink bills linked to Room {booking.roomNumber} will automatically follow the guest to their new room.
            </p>
          </div>
        </div>

        <div className={`p-4 border-t shrink-0 flex justify-end gap-3 ${theme.border}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={!selectedRoomId || isSubmitting}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
          >
            {isSubmitting ? 'Transferring...' : 'Confirm Transfer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
