import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/helpers/price";

type Props = {
  product: {
    name: string;
    slug: string;
    description: string | null;
    priceInSatang: number;
    stock: number;
    sku: string | null;
    primaryImageUrl?: string;
  };
};

export function ProductJsonLd({ product }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    sku: product.sku ?? undefined,
    image: product.primaryImageUrl
      ? `${siteConfig.url}${product.primaryImageUrl}`
      : undefined,
    url: `${siteConfig.url}/products/${product.slug}`,
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "PHP",
      price: (product.priceInSatang / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: siteConfig.name,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
