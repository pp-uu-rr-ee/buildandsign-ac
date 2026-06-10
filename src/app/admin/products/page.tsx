import Link from "next/link";
import Image from "next/image";
import { getAdminProducts } from "@/lib/queries/admin";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ToggleProductStatus } from "@/components/admin/ToggleProductStatus";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { AdminListToolbar } from "@/components/admin/AdminListToolbar";
import { formatPrice } from "@/lib/helpers/price";
import { Package } from "lucide-react";

export const metadata = { title: "Products | Admin" };

type SP = {
  search?: string;
  status?: string;
  category?: string;
  page?: string;
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const { rows, total, pages, page } = await getAdminProducts({
    search: sp.search,
    status: sp.status,
    category: sp.category,
    page: sp.page ? Number(sp.page) : 1,
  });

  // Build base query string for pagination links (preserve filters, drop page)
  const pageBaseQs = new URLSearchParams();
  if (sp.search) pageBaseQs.set("search", sp.search);
  if (sp.status) pageBaseQs.set("status", sp.status);
  if (sp.category) pageBaseQs.set("category", sp.category);
  const pageBase = pageBaseQs.toString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Products{" "}
          <span className="text-gray-400 font-normal text-base sm:text-lg">
            ({total})
          </span>
        </h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
        >
          + Add Product
        </Link>
      </div>

      <AdminListToolbar
        basePath="/admin/products"
        searchPlaceholder="Search by name, slug, SKU, description…"
        chips={{
          key: "status",
          label: "Status",
          options: [
            { value: "", label: "All" },
            { value: "active", label: "Active" },
            { value: "draft", label: "Draft" },
            { value: "archived", label: "Archived" },
            { value: "out_of_stock", label: "Out of stock" },
          ],
        }}
        selects={[
          {
            key: "category",
            label: "Category",
            options: [
              { value: "", label: "All categories" },
              { value: "split", label: "Split" },
              { value: "window", label: "Window" },
              { value: "portable", label: "Portable" },
              { value: "central", label: "Central" },
              { value: "cassette", label: "Cassette" },
              { value: "ducted", label: "Ducted" },
            ],
          },
        ]}
      />

      <div className="rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Product", "Category", "Price", "Stock", "Status", "Featured", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No products found.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
                        {p.primaryImage?.url ? (
                          <Image
                            src={p.primaryImage.url}
                            alt={p.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {p.minPriceInSatang != null ? (
                      <>
                        <span className="text-xs text-gray-400 font-normal">From </span>
                        {formatPrice(p.minPriceInSatang)}
                      </>
                    ) : (
                      <span className="text-gray-300 font-normal">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-medium ${
                        p.totalStock === 0 ? "text-red-500" : p.totalStock <= 5 ? "text-orange-500" : "text-gray-700"
                      }`}
                    >
                      {p.totalStock}
                    </span>
                    <span className="ml-1 text-xs text-gray-400">
                      ({p.variantCount} {p.variantCount === 1 ? "size" : "sizes"})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    {p.isFeatured ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <ToggleProductStatus id={p.id} currentStatus={p.status} />
                      <DeleteProductButton id={p.id} name={p.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?${pageBase}${pageBase ? "&" : ""}page=${p}`}
              className={`h-8 w-8 flex items-center justify-center rounded-md text-sm ${
                p === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
