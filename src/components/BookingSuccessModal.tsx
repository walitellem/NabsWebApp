import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Download, Share2, Printer } from 'lucide-react';
import { ReceiptPrinter, ReceiptPrinterStage } from './ReceiptPrinter';
import { Booking } from '../types';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onDownloadReceipt?: (booking: Booking) => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  isOpen,
  onClose,
  booking,
  onDownloadReceipt
}) => {
  const [stage, setStage] = useState<ReceiptPrinterStage>('processing');

  useEffect(() => {
    if (isOpen) {
      setStage('processing');
      const timer1 = setTimeout(() => setStage('printing'), 1000);
      const timer2 = setTimeout(() => setStage('complete'), 3500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  if (!booking) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Booking Confirmed</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Your reservation has been processed successfully.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="py-4">
                <ReceiptPrinter.Root stage={stage}>
                  <ReceiptPrinter.Machine>
                    <ReceiptPrinter.Header>
                      <ReceiptPrinter.Status />
                      <Printer size={20} className="text-zinc-400" />
                    </ReceiptPrinter.Header>
                    <ReceiptPrinter.Screen>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-widest opacity-50">Transaction ID</div>
                        <div className="text-xs font-mono truncate">{booking.id}</div>
                      </div>
                    </ReceiptPrinter.Screen>
                  </ReceiptPrinter.Machine>

                  <ReceiptPrinter.Output>
                    <ReceiptPrinter.Paper>
                      <div className="text-center space-y-1 mb-6 border-b border-dashed border-zinc-300 pb-4">
                        <div className="text-lg font-black tracking-tighter">NABSLODGE</div>
                        <div className="text-[10px] uppercase tracking-widest">{booking.branch} Branch</div>
                        <div className="text-[9px] opacity-70">{new Date().toLocaleString()}</div>
                      </div>

                      <div className="space-y-3 text-[11px]">
                        <div className="flex justify-between">
                          <span className="opacity-60">GUEST:</span>
                          <span className="font-bold">{booking.guestName.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-60">ROOM:</span>
                          <span className="font-bold">{booking.roomNumber} ({booking.roomType})</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-zinc-200 pt-2">
                          <span className="opacity-60">CHECK-IN:</span>
                          <span>{new Date(booking.checkInDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-60">CHECK-OUT:</span>
                          <span>{new Date(booking.checkOutDate).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="mt-6 border-t-2 border-zinc-900 dark:border-zinc-300 pt-3 space-y-2">
                          <div className="flex justify-between text-sm font-black">
                            <span>TOTAL:</span>
                            <span>GH₵{booking.totalPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold text-emerald-600">
                            <span>PAID:</span>
                            <span>GH₵{(booking.amountPaid || 0).toFixed(2)}</span>
                          </div>
                          {((booking.totalPrice || 0) - (booking.amountPaid || 0)) > 0 && (
                            <div className="flex justify-between text-xs font-bold text-red-600">
                              <span>BALANCE:</span>
                              <span>GH₵{((booking.totalPrice || 0) - (booking.amountPaid || 0)).toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 text-center space-y-2">
                        <div className="text-[10px] font-bold">THANK YOU FOR CHOOSING US</div>
                        <div className="flex justify-center gap-1">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-zinc-300" />
                          ))}
                        </div>
                      </div>
                    </ReceiptPrinter.Paper>
                  </ReceiptPrinter.Output>
                </ReceiptPrinter.Root>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <button
                  onClick={() => onDownloadReceipt?.(booking)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold transition-all"
                >
                  <Download className="w-4 h-4" />
                  Receipt
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
