"use client";

import { House as HouseIcon } from "@phosphor-icons/react";
import { useState } from "react";
import {
  ReceiptPrinter,
  type ReceiptPrinterStage,
} from "./ReceiptPrinter";
import { TactileButton } from "./TactileButton";

function Logo() {
  return (
    <div className="size-6 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-[10px]">
      NL
    </div>
  );
}

export function CheckoutStatus({ onBack }: { onBack: () => void }) {
  const [stage] = useState<ReceiptPrinterStage>("processing");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-8 flex flex-col items-center justify-center">
      <ReceiptPrinter.Root stage={stage}>
        <ReceiptPrinter.Machine>
          <ReceiptPrinter.Header>
            <Logo />
            <TactileButton depth="shallow" onClick={onBack} size="sm">
              <HouseIcon aria-hidden="true" size={13} weight="fill" />
              Home
            </TactileButton>
          </ReceiptPrinter.Header>

          <ReceiptPrinter.Screen>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">Reservation</p>
                  <p className="font-bold">Annual Membership</p>
                </div>
                <strong className="text-lg">GH₵230.40</strong>
              </div>
              <ReceiptPrinter.Status />
            </div>
          </ReceiptPrinter.Screen>
        </ReceiptPrinter.Machine>

        <ReceiptPrinter.Output>
          <ReceiptPrinter.Paper>
            <div className="text-center mb-8 border-b border-dashed border-slate-300 pb-4">
              <h2 className="text-xl font-black tracking-tighter">RECEIPT</h2>
              <p className="text-[10px] opacity-60 uppercase tracking-widest">Transaction #88F27EBA</p>
            </div>
            
            <dl className="space-y-4 text-xs">
              <div className="flex justify-between">
                <dt className="opacity-60">Total paid</dt>
                <dd className="font-bold font-mono text-emerald-600">GH₵230.40</dd>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2">
                <dt className="opacity-60">Date</dt>
                <dd className="font-mono">{new Date().toLocaleDateString()}</dd>
              </div>
            </dl>
            
            <div className="mt-12 text-center">
              <p className="text-sm font-bold">Thanks for your order.</p>
              <div className="mt-4 flex justify-center gap-1 opacity-20">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-slate-900" />
                ))}
              </div>
            </div>
          </ReceiptPrinter.Paper>
        </ReceiptPrinter.Output>
      </ReceiptPrinter.Root>
    </div>
  );
}
