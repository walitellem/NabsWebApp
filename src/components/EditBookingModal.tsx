/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Booking, Room, User, PaymentStatus } from '../types';
import { motion } from 'motion/react';
import { X, AlertTriangle, ShieldCheck, CheckCircle, Clock, DollarSign, Calendar, UserCheck, RefreshCw } from 'lucide-react';
import { useToast } from './ToastContext';
import { db } from '../firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { addAuditLog, generateId, getBookings, saveBookings } from '../data';

interface EditBookingModalProps {
  booking: Booking;
  rooms: Room[];
  isDarkMode: boolean;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  booking,
  rooms,
  isDarkMode,
  currentUser,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();

  // Non-revenue details
  const [guestName, setGuestName] = useState(booking.guestName || '');
  const [guestContact, setGuestContact] = useState(booking.guestContact || '');
  const [guestEmail, setGuestEmail] = useState(booking.guestEmail || '');

  // Revenue-altering details
  const [selectedRoomId, setSelectedRoomId] = useState(booking.roomId);
  const [checkInDate, setCheckInDate] = useState(booking.checkInDate || '');
  const [checkOutDate, setCheckOutDate] = useState(booking.checkOutDate || '');
  const [proposedPrice, setProposedPrice] = useState<string>(booking.totalPrice?.toString() || '0');
  const [proposedPaymentStatus, setProposedPaymentStatus] = useState<PaymentStatus>(booking.paymentStatus);
  const [proposedAmountPaid, setProposedAmountPaid] = useState<string>(booking.amountPaid?.toString() || '0');
  const [proposedPaymentMethod, setProposedPaymentMethod] = useState<string>(booking.paymentMethod || 'Cash');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected room object
  const currentRoom = rooms.find(r => r.id === booking.roomId) || {
    id: booking.roomId,
    roomNumber: booking.roomNumber,
    price: booking.totalPrice
  };
  const proposedRoom = rooms.find(r => r.id === selectedRoomId) || currentRoom;

  // Detect changes
  const isGuestDetailsOnlyChanged =
    guestName.trim() !== booking.guestName ||
    guestContact.trim() !== booking.guestContact ||
    guestEmail.trim() !== (booking.guestEmail || '');

  const isRevenueAlteringChanged =
    selectedRoomId !== booking.roomId ||
    checkInDate !== booking.checkInDate ||
    checkOutDate !== booking.checkOutDate ||
    parseFloat(proposedPrice) !== booking.totalPrice ||
    proposedPaymentStatus !== booking.paymentStatus ||
    parseFloat(proposedAmountPaid) !== (booking.amountPaid || 0) ||
    proposedPaymentMethod !== (booking.paymentMethod || 'Cash');

  const numericProposedPrice = parseFloat(proposedPrice) || 0;
  const priceDifference = numericProposedPrice - booking.totalPrice;

  const handleAutoRecalculatePrice = (newRoomId: string, inDate: string, outDate: string) => {
    const rm = rooms.find(r => r.id === newRoomId);
    if (!rm) return;
    
    // Simple night calculation
    try {
      const start = new Date(inDate.split('T')[0]).getTime();
      const end = new Date(outDate.split('T')[0]).getTime();
      const diffMs = end - start;
      const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const calculatedTotal = nights * rm.price;
      setProposedPrice(calculatedTotal.toFixed(2));
    } catch (e) {
      // Keep existing
    }
  };

  const handleRoomChange = (newRoomId: string) => {
    setSelectedRoomId(newRoomId);
    handleAutoRecalculatePrice(newRoomId, checkInDate, checkOutDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isGuestDetailsOnlyChanged && !isRevenueAlteringChanged) {
      addToast("No Changes Detected", "info", "You haven't modified any booking fields.", 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      // CASE 1: ONLY Non-revenue details changed (Direct update by receptionist)
      if (!isRevenueAlteringChanged && isGuestDetailsOnlyChanged) {
        const updatedBooking = {
          ...booking,
          guestName: guestName.trim(),
          guestContact: guestContact.trim(),
          guestEmail: guestEmail.trim()
        };

        // Update Firestore
        if (db) {
          try {
            await updateDoc(doc(db, 'bookings', booking.id), {
              guestName: updatedBooking.guestName,
              guestContact: updatedBooking.guestContact,
              guestEmail: updatedBooking.guestEmail
            });
          } catch (err) {
            console.warn("Firestore sync warning, falling back to local:", err);
          }
        }

        // Update local storage
        const localBookings = getBookings();
        const updatedLocal = localBookings.map(b => b.id === booking.id ? updatedBooking : b);
        saveBookings(updatedLocal);

        // Audit log
        addAuditLog(
          currentUser.id,
          currentUser.name,
          currentUser.role,
          booking.branch,
          `Updated Guest Details for Booking #${booking.id.slice(-5)}`,
          `Updated Name: ${guestName}, Contact: ${guestContact}`
        );

        addToast("Guest Details Updated", "success", "Guest information has been updated immediately.", 4000);
        onSuccess();
        onClose();
        return;
      }

      // CASE 2: Revenue-Altering Changes (Submits Pending Edit Request for Manager Approval)
      const requestId = `req_${generateId()}`;
      const pendingRequest = {
        id: requestId,
        bookingId: booking.id,
        branch: booking.branch,
        receptionistId: currentUser.id,
        receptionistName: currentUser.name,
        createdAt: new Date().toISOString(),
        status: 'Pending' as const,

        currentRoomId: booking.roomId,
        currentRoomNumber: booking.roomNumber,
        currentCheckInDate: booking.checkInDate,
        currentCheckOutDate: booking.checkOutDate,
        currentTotalPrice: booking.totalPrice,

        proposedRoomId: proposedRoom.id,
        proposedRoomNumber: proposedRoom.roomNumber,
        proposedCheckInDate: checkInDate,
        proposedCheckOutDate: checkOutDate,
        proposedTotalPrice: numericProposedPrice,
        priceDifference: priceDifference,
        reason: reason.trim() || 'Correction requested by receptionist',
        
        currentPaymentStatus: booking.paymentStatus,
        currentAmountPaid: booking.amountPaid || 0,
        currentPaymentMethod: booking.paymentMethod || 'Cash',
        proposedPaymentStatus,
        proposedAmountPaid: parseFloat(proposedAmountPaid),
        proposedPaymentMethod,

        guestName: guestName.trim(),
        guestContact: guestContact.trim(),
        guestEmail: guestEmail.trim()
      };

      // Save to Firestore pendingEditRequests
      if (db) {
        try {
          await setDoc(doc(db, 'pendingEditRequests', requestId), pendingRequest);
        } catch (err) {
          console.warn("Firestore write pending edit error:", err);
        }
      }

      // Save to localStorage for offline access
      const localReqs = JSON.parse(localStorage.getItem('nabslodge_pending_edits') || '[]');
      localReqs.push(pendingRequest);
      localStorage.setItem('nabslodge_pending_edits', JSON.stringify(localReqs));

      // Audit log
      addAuditLog(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        booking.branch,
        `Submitted Booking Edit Request #${requestId.slice(-5)}`,
        `Booking: #${booking.id.slice(-5)}. Price Diff: GH₵${priceDifference.toFixed(2)}. Reason: ${reason}`
      );

      addToast(
        "Edit Request Submitted",
        "info",
        `Manager approval requested for Room ${proposedRoom.roomNumber} modification (${priceDifference >= 0 ? '+' : ''}GH₵${priceDifference.toFixed(2)}).`,
        5000
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error submitting edit request:", err);
      addToast("Submission Error", "error", err.message || "Could not process request.", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`border rounded-3xl p-6 w-full max-w-xl shadow-2xl relative max-h-[92vh] overflow-y-auto ${
          isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">Modify / Rectify Booking</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                Booking #{booking.id.slice(-6).toUpperCase()} • Room {booking.roomNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">

          {/* Section 1: Non-Revenue Guest Details */}
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-950/70 border-zinc-850' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                1. Guest Personal Details (Direct Update)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                  Guest Name *
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                  Contact Number *
                </label>
                <input
                  type="text"
                  required
                  value={guestContact}
                  onChange={(e) => setGuestContact(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                  Guest Email (Optional)
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="e.g. guest@example.com"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Revenue-Altering Stay Parameters */}
          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-950/70 border-zinc-850' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  2. Stay & Revenue Parameters (Requires Manager Approval)
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Audit Secured
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                  Target Room *
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                  }`}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} - {r.roomType} (GH₵{r.price.toFixed(2)}/night) {r.id === booking.roomId ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                    Check-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={checkInDate.split('T')[0]}
                    onChange={(e) => {
                      setCheckInDate(e.target.value);
                      handleAutoRecalculatePrice(selectedRoomId, e.target.value, checkOutDate);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                    Check-Out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={checkOutDate.split('T')[0]}
                    onChange={(e) => {
                      setCheckOutDate(e.target.value);
                      handleAutoRecalculatePrice(selectedRoomId, checkInDate, e.target.value);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                  Proposed Total Price (GH₵) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-zinc-400">GH₵</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className={`w-full pl-12 pr-3 py-2 rounded-xl text-xs border font-mono font-bold focus:outline-none transition-colors ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-amber-500' : 'bg-white border-slate-300 text-slate-900 focus:border-amber-600'
                    }`}
                  />
                </div>
              </div>

              {/* Payment Rectification Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <label className="block text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mb-1">Proposed Status</label>
                  <select value={proposedPaymentStatus} onChange={(e) => setProposedPaymentStatus(e.target.value as PaymentStatus)} className={`w-full px-3 py-2 rounded-xl text-xs border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-300'}`}>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Partially Paid (50% Deposit)">Partially Paid (50% Deposit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mb-1">Proposed Amount (GH₵)</label>
                  <input type="number" value={proposedAmountPaid} onChange={(e) => setProposedAmountPaid(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-xs border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-300'}`} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold font-mono text-zinc-500 dark:text-zinc-400 mb-1">Proposed Method</label>
                  <input type="text" value={proposedPaymentMethod} onChange={(e) => setProposedPaymentMethod(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-xs border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-300'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Money Expected / Financial Impact Summary Banner */}
          {isRevenueAlteringChanged && (
            <div className={`p-4 rounded-2xl border ${
              priceDifference > 0
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : priceDifference < 0
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
                : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-700 dark:text-zinc-300'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold font-mono uppercase tracking-wider">
                    Financial Impact & Prioritized Balance Expected:
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 font-mono">
                    <div>Original Price: <strong>GH₵{booking.totalPrice.toFixed(2)}</strong></div>
                    <div>Proposed Price: <strong>GH₵{numericProposedPrice.toFixed(2)}</strong></div>
                  </div>
                  <div className="text-sm font-extrabold font-mono pt-1">
                    {priceDifference > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">
                        ⚡ Extra Money Expected from Guest: +GH₵{priceDifference.toFixed(2)}
                      </span>
                    ) : priceDifference < 0 ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        📉 Balance Reduction / Refund Due: -GH₵{Math.abs(priceDifference).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-zinc-600 dark:text-zinc-400">
                        ⚖️ Net Zero Revenue Difference (GH₵0.00)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] opacity-80 pt-1">
                    This modification alters financial records. A pending edit request will be sent to Manager ({currentUser.name} as submitter) for verification & final approval.
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-amber-500/20">
                <label className="block text-[11px] font-bold font-mono mb-1">
                  Reason for Modification (Required for Manager Audit) *
                </label>
                <input
                  type="text"
                  required={isRevenueAlteringChanged}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Guest requested extended stay / Room downgrade due to maintenance issue"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (!isGuestDetailsOnlyChanged && !isRevenueAlteringChanged)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 text-white shadow-lg ${
                isRevenueAlteringChanged
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : isRevenueAlteringChanged ? (
                <>
                  <ShieldCheck className="w-4 h-4" /> Submit Request to Manager
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Save Guest Details
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
