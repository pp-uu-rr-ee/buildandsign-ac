"use client";

import { useActionState } from "react";
import { Trash2, Star, CreditCard, AlertCircle } from "lucide-react";
import { deleteCardAction, setDefaultCardAction } from "@/lib/actions/cards";
import type { CardActionResult } from "@/lib/actions/cards";

type SavedCard = {
  id: string;
  last4: string;
  brand: string | null;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

const initialState: CardActionResult = { success: true };

function brandLabel(brand: string | null) {
  const b = (brand ?? "").toLowerCase();
  if (b === "visa") return "Visa";
  if (b === "mastercard") return "Mastercard";
  if (b === "jcb") return "JCB";
  if (b === "amex") return "Amex";
  return brand ?? "Card";
}

function CardRow({ card, isOnly }: { card: SavedCard; isOnly: boolean }) {
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteCardAction, initialState);
  const [defaultState, defaultAction, isSettingDefault] = useActionState(setDefaultCardAction, initialState);

  return (
    <li className="flex items-center gap-4 px-5 py-4">
      <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {brandLabel(card.brand)} •••• {card.last4}
          {card.isDefault && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
              <Star className="h-2.5 w-2.5" />
              Default
            </span>
          )}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
        </p>
        {!deleteState.success && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{deleteState.error}</p>
        )}
        {!defaultState.success && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{defaultState.error}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!card.isDefault && (
          <form action={defaultAction}>
            <input type="hidden" name="cardId" value={card.id} />
            <button
              type="submit"
              disabled={isSettingDefault}
              title="Set as default"
              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 dark:hover:text-blue-400 disabled:opacity-50 transition-colors"
            >
              <Star className="h-4 w-4" />
            </button>
          </form>
        )}
        <form action={deleteAction}>
          <input type="hidden" name="cardId" value={card.id} />
          <button
            type="submit"
            disabled={isDeleting}
            title="Remove card"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>
    </li>
  );
}

export function SavedCardsManager({ cards }: { cards: SavedCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <CreditCard className="h-7 w-7 text-gray-400 dark:text-gray-500" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No saved cards yet.</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs max-w-xs">
          Check "Remember this card" at checkout to save your card for faster payments.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {cards.map((card) => (
        <CardRow key={card.id} card={card} isOnly={cards.length === 1} />
      ))}
    </ul>
  );
}
