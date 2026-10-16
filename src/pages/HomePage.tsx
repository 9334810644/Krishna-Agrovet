import React, { useState, useEffect } from 'react';
import { TopBannerSlider } from '../components/home/TopBannerSlider';
import { Hero } from '../components/home/Hero';
import { ProductGrid } from '../components/products/ProductGrid';
import { BrandStory } from '../components/home/BrandStory';
import { FAQSection } from '../components/home/FAQSection';
import { dataService } from '../lib/firebase';
import { Product, Category } from '../types';

interface HomePageProps {
  searchQuery?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ searchQuery = '' }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);

    const unsubProducts = dataService.subscribeProducts((list) => {
      setProducts(list);
      setLoading(false);
    });

    const unsubCategories = dataService.subscribeCategories((cats) => {
      setCategories(cats);
    });

    return () => {
      if (typeof unsubProducts === 'function') unsubProducts();
      if (typeof unsubCategories === 'function') unsubCategories();
    };
  }, []);

  const handleProductUpdated = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  return (
    <main className="flex-1">
      <TopBannerSlider />
      <Hero />
      <ProductGrid
        products={products}
        categories={categories}
        searchQuery={searchQuery}
        loading={loading}
        onProductUpdated={handleProductUpdated}
      />
      <BrandStory />
      <FAQSection />
    </main>
  );
};
