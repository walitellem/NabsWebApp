import React from 'react';
import { DrinkItem, DrinkSale } from '../types';
import { Trophy } from 'lucide-react';

export const BestSellingDrinks: React.FC<{ drinks: DrinkItem[], sales: DrinkSale[] }> = ({ drinks, sales }) => {
  const safeDrinks = drinks || [];
  const safeSales = sales || [];
  
  const bestSellers = safeDrinks
    .map(drink => {
      const totalSold = safeSales
        .filter(s => s && s.drinkId === drink.id)
        .reduce((acc, s) => acc + (s.quantity || 0), 0);
      return { ...drink, totalSold };
    })
    .filter(d => d.totalSold > 0)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 3);

  return (
    <div className="border dark:border-zinc-800 rounded-3xl p-6 bg-white dark:bg-zinc-950">
      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        Best Selling Drinks
      </h3>
      {bestSellers.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          No drink sales recorded yet. Selling drinks from the Receptionist console will update this.
        </p>
      ) : (
        <div className="space-y-3">
          {bestSellers.map((drink, index) => (
            <div key={drink.id} className="flex justify-between items-center text-xs">
              <span className="font-medium text-zinc-600 dark:text-zinc-300">
                {index + 1}. {drink.name}
              </span>
              <span className="font-mono font-bold text-purple-500">{drink.totalSold} sold</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
