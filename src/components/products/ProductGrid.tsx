import React, { useState, useMemo } from 'react';
import { Product, Category } from '../../types';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { useLanguage } from '../../context/LanguageContext';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  loading?: boolean;
  onProductUpdated?: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  searchQuery,
  loading = false,
  onProductUpdated,
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Filtered products (by Category & Search)
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        if (!p.is_active) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchBrand = p.brand?.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          const matchSku = p.sku?.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchDesc && !matchSku) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && p.category_id !== selectedCategory) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Featured products first, then by name
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [products, searchQuery, selectedCategory]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
  };

  return (
    <section id="products" className="py-12 sm:py-16 lg:py-20 bg-warm-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-krishna-red bg-white border border-krishna-red/20 px-3.5 py-1 rounded-full mb-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-yellow-dark" />
              <span>KRISHNA AGROVET • AUTHENTIC CATTLE FEED</span>
            </div>
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

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-krishna-red text-white shadow-md'
                : 'bg-white text-deep-charcoal border border-warm-cream-dark hover:bg-warm-cream-surface'
            }`}
          >
            {t('filterAll')} ({products.filter(p => p.is_active).length})
          </button>
          {categories.map((cat) => {
            const count = products.filter(p => p.is_active && p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-krishna-red text-white shadow-md'
                    : 'bg-white text-deep-charcoal border border-warm-cream-dark hover:bg-warm-cream-surface'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-3xl border-2 border-warm-cream-dark overflow-hidden shadow-xs">
                <div className="aspect-4/3 animate-shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-4 animate-shimmer rounded-md w-3/4" />
                  <div className="h-3 animate-shimmer rounded-md w-1/2" />
                  <div className="h-9 animate-shimmer rounded-xl mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
