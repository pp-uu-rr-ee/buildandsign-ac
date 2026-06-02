"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/store/cart";

type Props = {
  productId: string;
  productName: string;
  slug: string;
  imageUrl: string | null;
  priceInCents: number;
  stock: number;
};

export function AddToCartButton({
  productId,
  productName,
  slug,
  imageUrl,
  priceInCents,
  stock,
}: Props) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const isOutOfStock = stock === 0;

  const handleAdd = () => {
    addItem({ productId, name: productName, slug, imageUrl, unitPriceInCents: priceInCents, quantity: qty });
    setAdded(true);
    toast.success(`${productName} added to cart`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Quantity picker */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Quantity</span>
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            −
          </button>
          <span className="px-4 py-2 text-sm font-semibold border-x border-gray-300 min-w-[3rem] text-center">
            {qty}
          </span>
          <button
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            disabled={qty >= stock}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            +
          </button>
        </div>
        {stock <= 5 && stock > 0 && (
          <span className="text-xs text-orange-500 font-medium">
            Only {stock} left
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-all duration-200 ${
            added
              ? "bg-green-600 text-white"
              : isOutOfStock
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {added ? (
            <><Check className="h-4 w-4" /> Added to Cart</>
          ) : (
            <><ShoppingCart className="h-4 w-4" /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}</>
          )}
        </button>
        <a
          href="/checkout"
          onClick={!added ? handleAdd : undefined}
          className={`flex-1 flex items-center justify-center px-6 py-3 rounded-md border text-sm font-semibold transition-colors ${
            isOutOfStock
              ? "border-gray-200 text-gray-300 cursor-not-allowed pointer-events-none"
              : "border-blue-600 text-blue-600 hover:bg-blue-50"
          }`}
        >
          Buy Now
        </a>
      </div>
    </div>
  );
}
