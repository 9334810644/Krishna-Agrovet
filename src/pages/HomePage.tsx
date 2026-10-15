import React, { useState, useEffect } from 'react';
import { Hero } from '../components/home/Hero';
import { ProductGrid } from '../components/products/ProductGrid';
import { BrandStory } from '../components/home/BrandStory';
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
    const loadCatalog = async () => {
      setLoading(true);
      try {
        const [prodList, catList] = await Promise.all([
          dataService.getProducts(),
          dataService.getCategories(),
        ]);
        setProducts(prodList);
        setCategories(catList);
      } catch (err) {
        console.error('Error loading catalog data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, []);

  const handleProductUpdated = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  return (
    <main className="flex-1">
      <Hero />
      <ProductGrid
        products={products}
        categories={categories}
        searchQuery={searchQuery}
        loading={loading}
        onProductUpdated={handleProductUpdated}
      />
      <BrandStory />
    </main>
  );
};
