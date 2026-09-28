export const getThemeClasses = (isDarkMode: boolean) => ({
  bg: isDarkMode ? 'bg-[#0d1527] text-zinc-50 transition-colors duration-200 min-h-screen w-full' : 'bg-[#e6eaf0] text-zinc-900 transition-colors duration-200 min-h-screen w-full',
  sidebar: isDarkMode ? 'bg-[#131e36] border-r border-zinc-800/50 neu-raised' : 'bg-[#e6eaf0] border-r border-zinc-200/60 neu-raised',
  card: isDarkMode ? 'neu-raised text-zinc-50' : 'neu-raised text-zinc-900',
  cardHeader: isDarkMode ? 'border-zinc-800/50' : 'border-zinc-200/60',
  text: isDarkMode ? 'text-zinc-50 font-bold' : 'text-zinc-900 font-bold',
  textMuted: isDarkMode ? 'text-zinc-400 text-sm' : 'text-zinc-500 text-sm',
  textMutedLight: isDarkMode ? 'text-zinc-500' : 'text-zinc-450',
  border: isDarkMode ? 'border-zinc-800/50' : 'border-zinc-200/60',
  borderLight: isDarkMode ? 'border-zinc-800/40' : 'border-zinc-100',
  tableHeader: isDarkMode ? 'bg-[#0a101f] text-zinc-300 font-bold' : 'bg-zinc-200/50 text-zinc-700 font-bold',
  tableContainer: isDarkMode ? 'neu-raised' : 'neu-raised',
  tableRowHover: isDarkMode ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-100/50',
  input: isDarkMode ? 'neu-inset text-zinc-50 focus:ring-1 focus:ring-blue-500' : 'neu-inset text-zinc-900 focus:ring-1 focus:ring-blue-500',
  buttonPrimary: isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white neu-glow-blue' : 'bg-blue-600 hover:bg-blue-700 text-white neu-glow-blue',
  buttonSecondary: isDarkMode ? 'neu-button text-zinc-200' : 'neu-button text-zinc-700',
  buttonDanger: 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20',
  buttonDangerOutline: isDarkMode ? 'neu-button text-red-400 hover:text-red-300' : 'neu-button text-red-600 hover:text-red-700',
  badgeSuccess: isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-100 text-emerald-600',
  badgeWarning: isDarkMode ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' : 'bg-yellow-50 border border-yellow-100 text-yellow-700',
  badgeError: isDarkMode ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-100 text-red-700',
  badgeNeutral: isDarkMode ? 'neu-inset text-zinc-300' : 'neu-inset text-zinc-700',
  infoBanner: isDarkMode ? 'neu-inset text-zinc-300' : 'neu-inset text-zinc-650',
  modalBackdrop: 'fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm',
});

export const getRoomStatusClasses = (status: string, isDarkMode: boolean) => {
  switch(status) {
    case 'Available':
    case 'vacant':
      return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
    case 'Occupied':
      return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
    case 'occupied_hold':
      return 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
    case 'Cleaning':
      return 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
    case 'Maintenance':
      return 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20';
    default:
      return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  }
};

