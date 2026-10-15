import React, { useState, useMemo } from 'react';
import { Product, Category } from '../../types';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { useLanguage } from '../../context/LanguageContext';
import { SlidersHorizontal, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedWeight, setSelectedWeight] = useState<string>('all');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'weight_desc' | 'name'>('featured');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Extract unique brands
  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [products]);

  // Extract unique bag weights
  const weights = useMemo(() => {
    const set = new Set<number>();
    products.forEach(p => {
      if (p.bag_weight_kg) set.add(p.bag_weight_kg);
    });
    return Array.from(set).sort((a, b) => b - a);
  }, [products]);

  // Filtered & Sorted products
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

        // Brand filter
        if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
          return false;
        }

        // Weight filter
        if (selectedWeight !== 'all' && p.bag_weight_kg !== Number(selectedWeight)) {
          return false;
        }

        // Only in stock
        if (onlyInStock && p.available_stock <= 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'weight_desc') return b.bag_weight_kg - a.bag_weight_kg;
        // Default 'featured'
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedWeight, onlyInStock, sortBy]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedWeight('all');
    setOnlyInStock(false);
    setSortBy('featured');
  };

  return (
    <section id="products" className="py-12 sm:py-16 lg:py-20 bg-warm-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-krishna-red bg-white border border-krishna-red/20 px-3.5 py-1 rounded-full mb-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-yellow-dark" />
              <span>KRISHNA AGROVET • 50 KG STANDARD BAGS</span>
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
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
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

        {/* Secondary Filter & Sort Controls */}
        <div className="bg-white p-4 rounded-2xl border border-warm-cream-dark shadow-xs mb-8 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Brand Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="brand-select" className="text-xs text-charcoal-muted font-bold">
                {t('filterBrand')}:
              </label>
              <select
                id="brand-select"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="text-xs bg-warm-cream border border-warm-cream-dark rounded-xl px-2.5 py-1.5 text-deep-charcoal focus:outline-hidden focus:ring-2 focus:ring-krishna-red font-semibold cursor-pointer"
              >
                <option value="all">{t('filterAll')}</option>
                {brands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Bag Weight Filter */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="weight-select" className="text-xs text-charcoal-muted font-bold">
                {t('filterWeight')}:
              </label>
              <select
                id="weight-select"
                value={selectedWeight}
                onChange={(e) => setSelectedWeight(e.target.value)}
                className="text-xs bg-warm-cream border border-warm-cream-dark rounded-xl px-2.5 py-1.5 text-deep-charcoal focus:outline-hidden focus:ring-2 focus:ring-krishna-red font-semibold cursor-pointer"
              >
                <option value="all">{t('filterAll')}</option>
                {weights.map(w => (
                  <option key={w} value={w.toString()}>{w} kg</option>
                ))}
              </select>
            </div>

            {/* In-Stock Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-deep-charcoal select-none bg-warm-cream px-3 py-1.5 rounded-xl border border-warm-cream-dark">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 rounded text-krishna-red focus:ring-krishna-red border-warm-cream-dark"
              />
              <span>{t('filterInStockOnly')}</span>
            </label>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-charcoal-muted" />
            <label htmlFor="sort-select" className="text-xs text-charcoal-muted font-bold">
              {t('sortLabel')}
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="text-xs bg-warm-cream border border-warm-cream-dark rounded-xl px-2.5 py-1.5 text-deep-charcoal focus:outline-hidden focus:ring-2 focus:ring-krishna-red font-semibold cursor-pointer"
            >
              <option value="featured">{t('sortFeatured')}</option>
              <option value="name">{t('sortName')}</option>
              <option value="weight_desc">{t('sortWeight')}</option>
            </select>
          </div>

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
                ? `No products found for "${searchQuery}". Try searching for 'Bypass', 'Ekstrapro', or '50kg'.`
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
