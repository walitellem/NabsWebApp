import React, { useState, useMemo } from 'react';
import { 
  Wine, 
  Search, 
  Calendar, 
  Filter, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CreditCard, 
  DollarSign, 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Lock, 
  Edit2, 
  Trash2, 
  Printer, 
  ExternalLink,
  X,
  Sparkles,
  MapPin,
  FileText,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DrinkSale, DrinkItem, User as AppUser, Branch } from '../types';
import { parseSafeDate } from '../utils/formatters';
import { db, safeSetDoc, safeDeleteDoc } from '../firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

interface DrinkSalesLedgerProps {
  sales: DrinkSale[];
  drinks: DrinkItem[];
  currentUser: AppUser;
  branch?: Branch; // For receptionist: their branch. For manager: undefined or global.
  isDarkMode?: boolean;
  onEditSale?: (sale: DrinkSale) => void;
  onDeleteSale?: (sale: DrinkSale) => void;
  onSettleSale?: (sale: DrinkSale, method: 'Cash' | 'Mobile Money') => Promise<void> | void;
  onRecordNewSale?: () => void;
  staffList?: AppUser[]; // For manager: list of all receptionists
}

export const DrinkSalesLedger: React.FC<DrinkSalesLedgerProps> = ({
  sales,
  drinks,
  currentUser,
  branch,
  isDarkMode = false,
  onEditSale,
  onDeleteSale,
  onSettleSale,
  onRecordNewSale,
  staffList = []
}) => {
  const isManager = currentUser.role === 'Manager';

  // --- FILTERS STATE ---
  // 1. Search Query (Guest Name, Room, Drink Name, Serial, Staff)
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Order Type Filter
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'room' | 'walk_in'>('all');

  // 3. Payment Status Filter: 'all' | 'paid' | 'unpaid'
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  // 3. Shift / Issuer Scope Filter
  // For Receptionist: 'my_shift' (default) | 'all_branch'
  // For Manager: 'all_staff' | specific receptionist ID
  const [receptionistShiftFilter, setReceptionistShiftFilter] = useState<'my_shift' | 'all_branch'>('my_shift');
  const [managerStaffFilter, setManagerStaffFilter] = useState<string>('all_staff');
  const [managerBranchFilter, setManagerBranchFilter] = useState<string>(branch || 'all_branches');

  // 4. Date Filtering
  // Presets: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all_time' | 'custom'
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'all_time' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 5. Sorting
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 6. Selected Sale for Detail Modal / Quick Settle Modal
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<DrinkSale | null>(null);
  const [saleToSettle, setSaleToSettle] = useState<DrinkSale | null>(null);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<'Cash' | 'Mobile Money'>('Cash');
  const [isSettling, setIsSettling] = useState(false);

  // Helper: check if a sale is unpaid or split
  const isSaleUnpaid = (s: DrinkSale): boolean => {
    if (s.paymentStatus === 'Paid') return false;
    if (s.paymentStatus === 'Unpaid' || s.paymentMethod === 'Unpaid (Add to Room Bill)') return true;
    if (s.paymentStatus === 'Split' || s.paymentMethod === 'Split (Paid & Unpaid)') {
      return (Number(s.unpaidAmount) || 0) > 0;
    }
    return false;
  };

  const getSalePaidAmount = (s: DrinkSale): number => {
    if (s.paymentStatus === 'Paid') return Number(s.totalPrice || 0);
    if (s.paymentStatus === 'Unpaid' || s.paymentMethod === 'Unpaid (Add to Room Bill)') return 0;
    if (s.paymentStatus === 'Split' || s.paymentMethod === 'Split (Paid & Unpaid)') {
      return Number(s.paidAmount) || 0;
    }
    return Number(s.paidAmount || s.totalPrice || 0);
  };

  const getSaleUnpaidAmount = (s: DrinkSale): number => {
    if (s.paymentStatus === 'Paid') return 0;
    if (s.paymentStatus === 'Unpaid' || s.paymentMethod === 'Unpaid (Add to Room Bill)') return Number(s.totalPrice || 0);
    if (s.paymentStatus === 'Split' || s.paymentMethod === 'Split (Paid & Unpaid)') {
      return Number(s.unpaidAmount) || (Number(s.totalPrice || 0) - (Number(s.paidAmount) || 0));
    }
    return 0;
  };

  // Helper: check date boundaries
  const isDateInSelectedRange = (dateStr: string): boolean => {
    if (datePreset === 'all_time') return true;
    const saleDate = parseSafeDate(dateStr);
    if (!saleDate) return true; // fallback to include if unparseable

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (datePreset === 'today') {
      return saleDate >= todayStart && saleDate <= todayEnd;
    }

    if (datePreset === 'yesterday') {
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayEnd);
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      return saleDate >= yesterdayStart && saleDate <= yesterdayEnd;
    }

    if (datePreset === 'this_week') {
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      return saleDate >= weekStart && saleDate <= todayEnd;
    }

    if (datePreset === 'this_month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return saleDate >= monthStart && saleDate <= todayEnd;
    }

    if (datePreset === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      let startMatch = true;
      let endMatch = true;

      if (customStartDate) {
        const sD = new Date(customStartDate + 'T00:00:00');
        startMatch = saleDate >= sD;
      }
      if (customEndDate) {
        const eD = new Date(customEndDate + 'T23:59:59');
        endMatch = saleDate <= eD;
      }
      return startMatch && endMatch;
    }

    return true;
  };

  // --- FILTERED & SORTED SALES ---
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // 1. Branch filter (Manager can choose All or specific branch; Receptionist is locked to their branch)
      if (isManager) {
        if (managerBranchFilter !== 'all_branches' && sale.branch !== managerBranchFilter) {
          return false;
        }
      } else if (branch && sale.branch && sale.branch !== branch) {
        return false;
      }

      // 2. Issuer / Shift Filter
      if (isManager) {
        if (managerStaffFilter !== 'all_staff') {
          const matchStaffId = sale.receptionistId === managerStaffFilter;
          const matchStaffName = sale.receptionistName?.toLowerCase() === managerStaffFilter.toLowerCase();
          if (!matchStaffId && !matchStaffName) {
            return false;
          }
        }
      } else {
        // Receptionist logic
        if (receptionistShiftFilter === 'my_shift') {
          const isMe = sale.receptionistId === currentUser.id || 
                       (sale.receptionistName && currentUser.name && sale.receptionistName.toLowerCase() === currentUser.name.toLowerCase());
          if (!isMe) return false;
        }
      }

      // 3. Payment Status Filter
      if (paymentStatusFilter === 'paid') {
        if (sale.paymentStatus !== 'Paid' && !sale.settledPaymentMethod) return false;
      } else if (paymentStatusFilter === 'unpaid') {
        if (!isSaleUnpaid(sale)) return false;
      }

      // 4. Date Filter
      if (!isDateInSelectedRange(sale.timestamp)) {
        return false;
      }

      // 4.5 Order Type Filter
      if (orderTypeFilter === 'room') {
        if (!sale.roomNumber || sale.roomNumber.trim() === '') return false;
      } else if (orderTypeFilter === 'walk_in') {
        if (sale.roomNumber && sale.roomNumber.trim() !== '') return false;
      }

      // 5. Search Query Filter (Guest Name, Room, Drink Item, Serial, Receptionist, Phone, Payment)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const guestMatch = (sale.guestName || '').toLowerCase().includes(q);
        const roomMatch = (sale.roomNumber || '').toLowerCase().includes(q);
        const serialMatch = (sale.serialNumber || sale.id || '').toLowerCase().includes(q);
        const staffMatch = (sale.receptionistName || '').toLowerCase().includes(q);
        const phoneMatch = (sale.guestPhone || '').toLowerCase().includes(q);
        const statusMatch = (sale.paymentStatus || '').toLowerCase().includes(q);
        const methodMatch = (sale.paymentMethod || '').toLowerCase().includes(q);
        
        let itemMatch = (sale.drinkName || '').toLowerCase().includes(q);
        if (sale.items && sale.items.length > 0) {
          itemMatch = itemMatch || sale.items.some(i => (i.drinkName || '').toLowerCase().includes(q));
        }

        if (!guestMatch && !roomMatch && !serialMatch && !staffMatch && !phoneMatch && !statusMatch && !methodMatch && !itemMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const timeA = parseSafeDate(a.timestamp)?.getTime() || 0;
      const timeB = parseSafeDate(b.timestamp)?.getTime() || 0;
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [
    sales, 
    isManager, 
    branch, 
    managerBranchFilter, 
    managerStaffFilter, 
    receptionistShiftFilter, 
    currentUser, 
    orderTypeFilter,
    paymentStatusFilter, 
    datePreset, 
    customStartDate, 
    customEndDate, 
    searchQuery, 
    sortOrder
  ]);

  // --- SUMMARY KPI METRICS ---
  const summaryMetrics = useMemo(() => {
    let totalSalesGross = 0;
    let totalPaidRevenue = 0;
    let totalUnpaidBalance = 0;
    let totalUnitsSold = 0;
    let paidOrdersCount = 0;
    let unpaidOrdersCount = 0;

    filteredSales.forEach(s => {
      totalSalesGross += Number(s.totalPrice || 0);
      const paid = getSalePaidAmount(s);
      const unpaid = getSaleUnpaidAmount(s);
      totalPaidRevenue += paid;
      totalUnpaidBalance += unpaid;

      if (isSaleUnpaid(s)) {
        unpaidOrdersCount++;
      } else {
        paidOrdersCount++;
      }

      if (s.items && s.items.length > 0) {
        s.items.forEach(i => {
          totalUnitsSold += Number(i.quantity || 1);
        });
      } else {
        totalUnitsSold += Number(s.quantity || 1);
      }
    });

    return {
      totalOrders: filteredSales.length,
      totalSalesGross,
      totalPaidRevenue,
      totalUnpaidBalance,
      totalUnitsSold,
      paidOrdersCount,
      unpaidOrdersCount
    };
  }, [filteredSales]);

  // Distinct staff list for manager filter dropdown
  const uniqueStaffOptions = useMemo(() => {
    const map = new Map<string, string>();
    staffList.forEach(u => {
      map.set(u.id, u.name);
    });
    sales.forEach(s => {
      if (s.receptionistId && s.receptionistName) {
        map.set(s.receptionistId, s.receptionistName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [staffList, sales]);

  // Handle Quick Settle Submission
  const handleConfirmSettle = async () => {
    if (!saleToSettle) return;
    setIsSettling(true);
    try {
      if (onSettleSale) {
        await onSettleSale(saleToSettle, settlePaymentMethod);
      } else {
        // Fallback direct persistence
        const originalBarPaid = saleToSettle.paymentMethod === 'Split (Paid & Unpaid)' || saleToSettle.paymentStatus === 'Split'
          ? (Number(saleToSettle.paidAmount) || 0)
          : 0;

        const updated: DrinkSale = {
          ...saleToSettle,
          paymentStatus: 'Paid',
          paidAmount: originalBarPaid,
          unpaidAmount: 0,
          settledPaymentMethod: settlePaymentMethod
        };

        if (db) {
          await safeSetDoc(doc(db, 'drinkSales', updated.id), updated, { merge: true });
        }
      }
      setSaleToSettle(null);
    } catch (err) {
      console.error('Error settling drink sale:', err);
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* HEADER & TOP CONTROLS */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400">
                <Wine className="w-5 h-5" />
              </div>
              <h2 className={`text-xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {isManager ? 'Drink Sales & Bar Ledger' : 'My Shift & Branch Drink Sales'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                isDarkMode ? 'bg-purple-950/50 text-purple-300 border border-purple-800/60' : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                {filteredSales.length} {filteredSales.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              {isManager 
                ? 'Audit multi-branch beverage sales, filter by receptionist issuer, and track paid vs unpaid bar folios.'
                : 'Track drinks issued during your shift, monitor unpaid room charges, and reconcile cash/MoMo in hand.'}
            </p>
          </div>

          {onRecordNewSale && (
            <button
              onClick={onRecordNewSale}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-purple-600/20 flex items-center gap-2 self-start lg:self-auto"
            >
              <Receipt className="w-4 h-4" /> Record New Drink Sale
            </button>
          )}
        </div>

        {/* SUMMARY KPI METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-purple-950/20 border-purple-800/40 text-purple-300' : 'bg-purple-50/80 border-purple-200 text-purple-900'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold opacity-80 mb-1">
              <span>Gross Sales Value</span>
              <Wine className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-xl font-black font-mono">GH₵ {summaryMetrics.totalSalesGross.toFixed(2)}</div>
            <div className="text-[10px] mt-1 opacity-70 font-medium">{summaryMetrics.totalUnitsSold} Beverage Units Sold</div>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold opacity-80 mb-1">
              <span>Paid / Collected</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-80" />
            </div>
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              GH₵ {summaryMetrics.totalPaidRevenue.toFixed(2)}
            </div>
            <div className="text-[10px] mt-1 opacity-70 font-medium">{summaryMetrics.paidOrdersCount} Paid Orders</div>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold opacity-80 mb-1">
              <span>Unpaid / Room Tabs</span>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 opacity-80" />
            </div>
            <div className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
              GH₵ {summaryMetrics.totalUnpaidBalance.toFixed(2)}
            </div>
            <div className="text-[10px] mt-1 opacity-70 font-medium">{summaryMetrics.unpaidOrdersCount} Unpaid / Open Tabs</div>
          </div>

          <div className={`p-4 rounded-2xl border ${
            isDarkMode ? 'bg-blue-950/20 border-blue-800/40 text-blue-300' : 'bg-blue-50/80 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider font-bold opacity-80 mb-1">
              <span>Active Scope</span>
              <User className="w-3.5 h-3.5 opacity-60" />
            </div>
            <div className="text-sm font-black truncate mt-1">
              {!isManager 
                ? (receptionistShiftFilter === 'my_shift' ? `${currentUser.name} (Shift)` : `All ${branch} Sales`)
                : (managerStaffFilter === 'all_staff' ? 'All Staff Members' : (uniqueStaffOptions.find(s => s.id === managerStaffFilter)?.name || 'Selected Staff'))}
            </div>
            <div className="text-[10px] mt-1 text-blue-600 dark:text-blue-400 font-mono font-bold capitalize">
              {datePreset.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* --- FILTER CONTROL BAR --- */}
        <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {/* Row 1: Search & Issuer / Shift Scopes */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guest name, room number, drink, or receipt ID..."
                className={`w-full pl-10 pr-9 py-2.5 rounded-xl text-xs font-medium border outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500 focus:border-purple-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-600'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Shift & Staff Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Receptionist Mode: Shift vs All Branch Toggle */}
              {!isManager ? (
                <div className={`flex items-center p-1 rounded-xl border ${
                  isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setReceptionistShiftFilter('my_shift')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      receptionistShiftFilter === 'my_shift'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Shift (Issued By Me)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceptionistShiftFilter('all_branch')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      receptionistShiftFilter === 'all_branch'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>All {branch || 'Branch'} Sales</span>
                  </button>
                </div>
              ) : (
                /* Manager Mode: Branch & Staff Member Dropdowns */
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={managerBranchFilter}
                    onChange={(e) => setManagerBranchFilter(e.target.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="all_branches">🏢 All Branches</option>
                    <option value="Ayigya">Nabslodge Ayigya</option>
                    <option value="Annex">Nabslodge Annex</option>
                  </select>

                  <select
                    value={managerStaffFilter}
                    onChange={(e) => setManagerStaffFilter(e.target.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="all_staff">👤 All Receptionists / Staff</option>
                    {uniqueStaffOptions.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        Issued by: {staff.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Type Filters & Payment Status Chips & Date Presets */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pt-2">
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Order Type Filter Tabs */}
              <div className={`flex items-center p-1 rounded-xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-slate-100/50 border-slate-200'}`}>
                <button
                  onClick={() => setOrderTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    orderTypeFilter === 'all'
                      ? (isDarkMode ? 'bg-zinc-800 text-white shadow-xs' : 'bg-white text-slate-800 shadow-xs')
                      : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-700')
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setOrderTypeFilter('room')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderTypeFilter === 'room'
                      ? (isDarkMode ? 'bg-purple-900/50 text-purple-300 shadow-xs' : 'bg-purple-100 text-purple-800 shadow-xs')
                      : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-700')
                  }`}
                >
                  🏨 Room Assigned
                </button>
                <button
                  onClick={() => setOrderTypeFilter('walk_in')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    orderTypeFilter === 'walk_in'
                      ? (isDarkMode ? 'bg-blue-900/50 text-blue-300 shadow-xs' : 'bg-blue-100 text-blue-800 shadow-xs')
                      : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-slate-700')
                  }`}
                >
                  🍸 Walk-In / Bar
                </button>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setPaymentStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    paymentStatusFilter === 'all'
                      ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-xs'
                      : isDarkMode ? 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Statuses
                </button>
                <button
                onClick={() => setPaymentStatusFilter('paid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  paymentStatusFilter === 'paid'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isDarkMode ? 'bg-emerald-950/30 text-emerald-400 hover:bg-emerald-950/50' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Paid Drinks</span>
              </button>
              <button
                onClick={() => setPaymentStatusFilter('unpaid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  paymentStatusFilter === 'unpaid'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : isDarkMode ? 'bg-amber-950/30 text-amber-400 hover:bg-amber-950/50' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Unpaid / Open Tabs</span>
                {summaryMetrics.unpaidOrdersCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-black text-[9px] font-black rounded-full">
                    {summaryMetrics.unpaidOrdersCount}
                  </span>
                )}
              </button>
            </div>
            </div>

            {/* Date Preset Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-mono uppercase font-bold mr-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                Date:
              </span>
              {(['today', 'yesterday', 'this_week', 'this_month', 'all_time', 'custom'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer capitalize ${
                    datePreset === preset
                      ? 'bg-purple-600 text-white font-bold shadow-xs'
                      : isDarkMode 
                        ? 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-zinc-200' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range Selector (When 'custom' preset is active) */}
          <AnimatePresence>
            {datePreset === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 rounded-2xl border flex flex-wrap items-center gap-3 text-xs ${
                  isDarkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  <span className="font-bold">Custom Range:</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase font-mono text-zinc-400">From:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className={`px-2.5 py-1 rounded-lg border outline-none font-mono text-xs ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase font-mono text-zinc-400">To:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className={`px-2.5 py-1 rounded-lg border outline-none font-mono text-xs ${
                      isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="text-[10px] text-purple-500 hover:underline cursor-pointer font-bold ml-auto"
                  >
                    Clear Dates
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- DRINK SALES TRANSACTIONS TABLE --- */}
      <div className={`border rounded-3xl overflow-hidden transition-all ${
        isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b text-[10px] font-mono uppercase tracking-wider ${
                isDarkMode ? 'bg-zinc-900 text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                <th className="py-3.5 px-4 font-bold">Serial / Time</th>
                <th className="py-3.5 px-4 font-bold">Assigned Room</th>
                <th className="py-3.5 px-4 font-bold">Guest Name</th>
                <th className="py-3.5 px-4 font-bold">Beverage Items</th>
                <th className="py-3.5 px-4 font-bold text-center">Qty</th>
                <th className="py-3.5 px-4 font-bold">Issued By (Staff)</th>
                <th className="py-3.5 px-4 font-bold">Payment Status</th>
                <th className="py-3.5 px-4 font-bold text-right font-mono">Total (GH₵)</th>
                <th className="py-3.5 px-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-zinc-800/60' : 'divide-slate-100'}`}>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Wine className="w-10 h-10 opacity-20 text-purple-500" />
                      <span className="text-sm font-semibold">No drink sales found matching active filters.</span>
                      <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                        {searchQuery 
                          ? `No results for "${searchQuery}". Ensure you are searching the correct shift or branch. You may need to click "All Types" or "All Statuses" to find what you are looking for.` 
                          : 'No transactions recorded under this specific criteria.'}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setOrderTypeFilter('all');
                            setPaymentStatusFilter('all');
                            setDatePreset('all_time');
                            if (!isManager) setReceptionistShiftFilter('all_branch');
                          }}
                          className="px-4 py-2 mt-2 text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-xl hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          Clear Filters & Find "{searchQuery}"
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isUnpaid = isSaleUnpaid(sale);
                  const isCurrentUserIssuer = sale.receptionistId === currentUser.id || 
                    (sale.receptionistName && currentUser.name && sale.receptionistName.toLowerCase() === currentUser.name.toLowerCase());

                  return (
                    <tr 
                      key={sale.id} 
                      className={`transition-colors ${
                        isDarkMode ? 'hover:bg-zinc-800/40' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Serial & Timestamp */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-extrabold text-[11px] text-purple-400 flex items-center gap-1">
                          <span>{sale.serialNumber || sale.id.slice(-6)}</span>
                          {sale.branch && (
                            <span className={`text-[8px] px-1 py-0.2 rounded font-bold uppercase ${
                              sale.branch === 'Ayigya' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {sale.branch}
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                          <Clock className="w-3 h-3 opacity-70" />
                          <span>{sale.timestamp || 'N/A'}</span>
                        </div>
                      </td>

                      {/* Dedicated Assigned Room */}
                      <td className="py-3.5 px-4">
                        {sale.roomNumber ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${
                              isUnpaid
                                ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            }`}>
                              Room {sale.roomNumber}
                            </span>
                            {isUnpaid && (
                              <span className="text-[9px] font-bold text-rose-500/90 uppercase tracking-tight">
                                Room Tab Due
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                            isDarkMode 
                              ? 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50' 
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            Walk-In / Bar
                          </span>
                        )}
                      </td>

                      {/* Guest Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-xs">
                          {sale.guestName || 'Walk-In Guest'}
                        </div>
                        {sale.guestPhone && (
                          <div className={`text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                            {sale.guestPhone}
                          </div>
                        )}
                      </td>

                      {/* Beverage Items */}
                      <td className="py-3.5 px-4">
                        {sale.items && sale.items.length > 0 ? (
                          <div className="space-y-0.5">
                            {sale.items.map((item, idx) => (
                              <div key={`${item.drinkId}-${idx}`} className="text-xs font-semibold">
                                {item.drinkName} 
                                <span className={`text-[10px] font-normal ml-1 ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                                  (GH₵{item.unitPrice?.toFixed(2)} ea)
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-xs">{sale.drinkName || 'Beverage'}</div>
                            {sale.unitPrice && (
                              <div className={`text-[10px] ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                                GH₵{sale.unitPrice.toFixed(2)} each
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-center font-bold text-xs">
                        x{sale.quantity || (sale.items ? sale.items.reduce((s, i) => s + (i.quantity || 1), 0) : 1)}
                      </td>

                      {/* Issued By (Receptionist Name) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs">
                            {sale.receptionistName || 'Front Desk Staff'}
                          </span>
                          {isCurrentUserIssuer && (
                            <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-400 text-[9px] font-black rounded uppercase">
                              You
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] font-mono ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {sale.branch || branch || 'Branch'}
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            sale.paymentMethod?.includes('Cash')
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : sale.paymentMethod?.includes('Mobile Money')
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                          }`}>
                            {sale.paymentMethod || 'Cash'}
                          </span>

                          {sale.paymentStatus === 'Paid' || sale.settledPaymentMethod ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[9px] font-black uppercase tracking-wider">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Paid {sale.settledPaymentMethod ? `(Settled: ${sale.settledPaymentMethod})` : ''}</span>
                            </span>
                          ) : sale.paymentStatus === 'Split' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[9px] font-black uppercase tracking-wider">
                                <AlertCircle className="w-2.5 h-2.5" />
                                <span>Partial Unpaid</span>
                              </span>
                              <div className="text-[9px] font-mono text-zinc-400">
                                Paid: GH₵{(sale.paidAmount || 0).toFixed(2)} | Due: GH₵{(sale.unpaidAmount || 0).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 text-[9px] font-black uppercase tracking-wider">
                              <AlertCircle className="w-2.5 h-2.5" />
                              <span>Unpaid (Room Tab)</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="py-3.5 px-4 text-right font-black font-mono text-sm text-purple-500 dark:text-purple-400">
                        GH₵ {sale.totalPrice?.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Settle Unpaid Bill Button (Visible in Receptionist Session ONLY) */}
                          {!isManager && isUnpaid && (
                            <button
                              type="button"
                              onClick={() => {
                                setSaleToSettle(sale);
                                setSettlePaymentMethod('Cash');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1"
                              title="Settle Outstanding Bill"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}

                          {/* Detail View */}
                          <button
                            type="button"
                            onClick={() => setSelectedSaleForDetails(sale)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                            }`}
                            title="View Full Details"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit (if available and not locked) */}
                          {onEditSale && !sale.settledPaymentMethod && (
                            <button
                              type="button"
                              onClick={() => onEditSale(sale)}
                              className="p-1.5 rounded-lg hover:bg-purple-500/10 text-purple-400 transition-colors cursor-pointer"
                              title="Edit Sale"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete (if available and not locked) */}
                          {onDeleteSale && !sale.settledPaymentMethod && (
                            <button
                              type="button"
                              onClick={() => onDeleteSale(sale)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors cursor-pointer"
                              title="Delete Sale"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL: VIEW ORDER DETAILS --- */}
      <AnimatePresence>
        {selectedSaleForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
                isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold">Drink Order Details</h3>
                    <p className="text-[11px] font-mono text-purple-400 font-bold">
                      {selectedSaleForDetails.serialNumber || selectedSaleForDetails.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSaleForDetails(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Meta details grid */}
                <div className={`p-3.5 rounded-2xl border grid grid-cols-2 gap-3 ${
                  isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Guest Name</span>
                    <span className="font-bold text-sm">{selectedSaleForDetails.guestName || 'Walk-In'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Room Assigned</span>
                    <span className="font-bold text-sm">
                      {selectedSaleForDetails.roomNumber ? `Room ${selectedSaleForDetails.roomNumber}` : 'None (Bar Area)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Issued By (Staff)</span>
                    <span className="font-bold text-purple-400">{selectedSaleForDetails.receptionistName || 'Staff'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Branch & Time</span>
                    <span className="font-medium text-[11px]">{selectedSaleForDetails.branch} • {selectedSaleForDetails.timestamp}</span>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div>
                  <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-zinc-400 mb-2">
                    Itemized Beverages
                  </h4>
                  <div className="space-y-1.5">
                    {selectedSaleForDetails.items && selectedSaleForDetails.items.length > 0 ? (
                      selectedSaleForDetails.items.map((item, idx) => {
                        // Resilient check: if there is only 1 item in the items array and the top-level quantity/price were updated, stay in sync
                        const isSingleItem = selectedSaleForDetails.items!.length === 1;
                        const displayQty = (isSingleItem && selectedSaleForDetails.quantity && selectedSaleForDetails.quantity !== item.quantity)
                          ? selectedSaleForDetails.quantity
                          : (item.quantity || 1);
                        const displayUnitPrice = item.unitPrice || selectedSaleForDetails.unitPrice || 0;
                        const displaySubtotal = (isSingleItem && selectedSaleForDetails.totalPrice)
                          ? selectedSaleForDetails.totalPrice
                          : (item.subtotal || (displayQty * displayUnitPrice));

                        return (
                          <div 
                            key={idx} 
                            className={`flex justify-between items-center p-2.5 rounded-xl border ${
                              isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div>
                              <span className="font-bold">{item.drinkName || selectedSaleForDetails.drinkName}</span>
                              <div className="text-[10px] text-zinc-400">Qty: {displayQty} × GH₵{displayUnitPrice.toFixed(2)}</div>
                            </div>
                            <span className="font-mono font-bold text-purple-400">GH₵{displaySubtotal.toFixed(2)}</span>
                          </div>
                        );
                      })
                    ) : (
                      <div className={`flex justify-between items-center p-2.5 rounded-xl border ${
                        isDarkMode ? 'bg-zinc-900/30 border-zinc-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div>
                          <span className="font-bold">{selectedSaleForDetails.drinkName}</span>
                          <div className="text-[10px] text-zinc-400">Qty: {selectedSaleForDetails.quantity || 1}</div>
                        </div>
                        <span className="font-mono font-bold text-purple-400">
                          GH₵{selectedSaleForDetails.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className={`p-3.5 rounded-2xl border space-y-2 ${
                  isDarkMode ? 'bg-purple-950/20 border-purple-800/40' : 'bg-purple-50/60 border-purple-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-zinc-400">Total Order Amount:</span>
                    <span className="font-black font-mono text-base text-purple-400">
                      GH₵ {selectedSaleForDetails.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-400">Payment Method:</span>
                    <span className="font-bold">{selectedSaleForDetails.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-zinc-400">Payment Status:</span>
                    <span className={`font-black uppercase tracking-wider ${
                      selectedSaleForDetails.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {selectedSaleForDetails.paymentStatus}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSaleForDetails(null)}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: QUICK SETTLE UNPAID DRINK SALE --- */}
      <AnimatePresence>
        {saleToSettle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl ${
                isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Settle Drink Order</h3>
                  <p className="text-xs text-zinc-400">Mark pending tab as fully settled</p>
                </div>
              </div>

              <div className="space-y-4 text-xs my-4">
                <div className={`p-3 rounded-xl border ${
                  isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-400">Guest:</span>
                    <strong className="text-sm">{saleToSettle.guestName}</strong>
                  </div>
                  {saleToSettle.roomNumber && (
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-zinc-400">Room:</span>
                      <strong>Room {saleToSettle.roomNumber}</strong>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-700/40">
                    <span className="text-zinc-400">Amount Due:</span>
                    <strong className="text-base font-mono text-emerald-500">
                      GH₵ {getSaleUnpaidAmount(saleToSettle).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-bold text-zinc-400 mb-1.5">
                    Settlement Payment Method *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettlePaymentMethod('Cash')}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        settlePaymentMethod === 'Cash'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      💵 Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettlePaymentMethod('Mobile Money')}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        settlePaymentMethod === 'Mobile Money'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      📱 Mobile Money
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSettling}
                  onClick={() => setSaleToSettle(null)}
                  className={`flex-1 py-2.5 rounded-xl font-bold cursor-pointer ${
                    isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSettling}
                  onClick={handleConfirmSettle}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSettling ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Paid</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
