import React, { useState, useMemo } from 'react';
import { Product, Category } from '../../types';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { useLanguage } from '../../context/LanguageContext';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  loading?: boolean;
  onProductUpdated?: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories: _categories,
  searchQuery,
  loading = false,
  onProductUpdated,
}) => {
  const { t } = useLanguage();
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Filtered products (by Search)
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Only hide if explicitly deactivated
        if (p.is_active === false) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = (p.name || '').toLowerCase().includes(q);
          const matchBrand = (p.brand || '').toLowerCase().includes(q);
          const matchDesc = (p.description || '').toLowerCase().includes(q);
          const matchSku = (p.sku || '').toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchDesc && !matchSku) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Featured products first, then by name
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [products, searchQuery]);

  const handleResetFilters = () => {
    window.location.href = '/#products';
  };

  return (
    <section id="products" className="py-12 sm:py-16 lg:py-20 bg-warm-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-deep-charcoal font-heading tracking-tight">
              {t('catalogTitle')}
            </h2>
            <p className="text-charcoal-muted text-sm sm:text-base mt-1">
              {t('catalogSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-white px-3 py-1.5 rounded-xl border border-warm-cream-dark">
            <span className="text-xs font-bold text-deep-charcoal">
              {filteredProducts.length} {t('bagsCount')}
            </span>
          </div>
        </div>


        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white rounded-3xl border-2 border-warm-cream-dark overflow-hidden shadow-xs">
                <div className="h-72 sm:h-80 animate-shimmer" />
                <div className="p-6 space-y-4">
                  <div className="h-6 animate-shimmer rounded-md w-3/4" />
                  <div className="h-4 animate-shimmer rounded-md w-full" />
                  <div className="h-4 animate-shimmer rounded-md w-5/6" />
                  <div className="h-16 animate-shimmer rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid - Fills available container area */}
        {!loading && filteredProducts.length > 0 && (
          <div className={`grid gap-8 ${
            filteredProducts.length === 1 
              ? 'grid-cols-1 max-w-3xl mx-auto' 
              : filteredProducts.length === 2 
              ? 'grid-cols-1 md:grid-cols-2' 
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          }`}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetails={(p) => setSelectedProductForModal(p)}
                onProductUpdated={(updatedP) => {
                  if (selectedProductForModal?.id === updatedP.id) {
                    setSelectedProductForModal(updatedP);
                  }
                  onProductUpdated?.(updatedP);
                }}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="bg-white rounded-3xl border-2 border-warm-cream-dark p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-brand-yellow/30 text-krishna-red rounded-2xl flex items-center justify-center mx-auto border border-brand-yellow">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-deep-charcoal font-heading">
              {t('noProductsFound')}
            </h3>
            <p className="text-sm text-charcoal-muted">
              {searchQuery
                ? `No products found for "${searchQuery}". Try searching for 'Bypass' or 'Ekstrapro'.`
                : 'No products currently fit the selected filters.'}
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-krishna-red text-white rounded-xl text-sm font-bold hover:bg-krishna-red-dark transition-colors shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('resetFilters')}</span>
            </button>
          </div>
        )}

      </div>

      {/* Product Details Modal with Related Products */}
      <ProductDetailModal
        product={selectedProductForModal}
        allProducts={products}
        onSelectProduct={(p) => setSelectedProductForModal(p)}
        onProductUpdated={(updatedP) => {
          setSelectedProductForModal(updatedP);
          onProductUpdated?.(updatedP);
        }}
        onClose={() => setSelectedProductForModal(null)}
      />
    </section>
  );
};
