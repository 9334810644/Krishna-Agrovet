import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/firebase';
import { LocalStoreManager } from '../../lib/mockStore';
import { Product, Category } from '../../types';
import { 
  Plus, Search, Edit3, EyeOff, Eye, 
  X, Save, Loader2, RefreshCw, Trash2, AlertTriangle,
  UploadCloud, Image as ImageIcon, Camera, Link2, CheckCircle2
} from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      return LocalStoreManager.getProducts();
    } catch {
      return [];
    }
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      return LocalStoreManager.getCategories();
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState<boolean>(() => products.length === 0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Confirmation State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Image Upload State
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [showManualUrlInput, setShowManualUrlInput] = useState<boolean>(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    brand: 'Radhe Krishna (Krishna Agrovet)',
    sku: '',
    category_id: '',
    bag_weight_kg: 50,
    price: 1650,
    mrp: 1750,
    available_stock: 50,
    low_stock_threshold: 10,
    description: '',
    short_description: '',
    features: [] as string[],
    image_url: '/images/products/radhe-krishna-bypass-50kg.svg',
    crude_protein: '22.0%',
    crude_fat: '4.0%',
    crude_fiber: '9.5%',
    feeding_guide: 'Feed 400g per liter of cow milk; 500g per liter of buffalo milk.',
    ingredients: '',
    featured: false,
    is_active: true,
  });

  const handleAddFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const handleFeatureChange = (index: number, val: string) => {
    setFormData(prev => {
      const updated = [...prev.features];
      updated[index] = val;
      return { ...prev, features: updated };
    });
  };

  const handleRemoveFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  useEffect(() => {
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        dataService.getProducts(),
        dataService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Error reloading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select a valid image file (JPG, PNG, WEBP, or SVG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setImageUploadError('Selected image is too large (max 15 MB). Please choose a smaller photo.');
      return;
    }

    setIsProcessingImage(true);
    setImageUploadError(null);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        if (file.type === 'image/svg+xml') {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read SVG file.'));
          reader.readAsDataURL(file);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const MAX_DIMENSION = 900;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_DIMENSION) {
                height = Math.round((height * MAX_DIMENSION) / width);
                width = MAX_DIMENSION;
              }
            } else {
              if (height > MAX_DIMENSION) {
                width = Math.round((width * MAX_DIMENSION) / height);
                height = MAX_DIMENSION;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }

            // Draw image on canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Export as high quality JPEG
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            resolve(compressed);
          };
          img.onerror = () => {
            resolve(e.target?.result as string);
          };
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read image file.'));
        reader.readAsDataURL(file);
      });

      setFormData(prev => ({ ...prev, image_url: dataUrl }));
    } catch (err: any) {
      console.error('Image processing failed:', err);
      setImageUploadError(err.message || 'Failed to process image.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setImageUploadError(null);
    setShowManualUrlInput(false);
    setFormData({
      name: '',
      brand: 'Radhe Krishna (Krishna Agrovet)',
      sku: `RKPA-SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category_id: categories[0]?.id || '',
      bag_weight_kg: 50,
      price: 1650,
      mrp: 1750,
      available_stock: 50,
      low_stock_threshold: 10,
      description: '',
      short_description: '',
      features: [
        'Specially packaged in signature sealed feed bags with authentic formulation.',
        'Optimal 22% - 24% protein balance designed to elevate daily milk quantity, FAT percentage, and SNF.',
        '100% natural, digestible ingredients manufactured without synthetic urea or harmful adulterants.',
        'Proven results for milking dairy cows and Murrah buffaloes across regional dairy farms.',
      ],
      image_url: '/images/products/radhe-krishna-bypass-50kg.svg',
      crude_protein: '22.0%',
      crude_fat: '4.0%',
      crude_fiber: '9.5%',
      feeding_guide: '',
      ingredients: 'Grains & Cereals, Mustard Oil Cake, De-Oiled Rice Bran, Cane Molasses, Bypass Fat, Chelated Minerals & Vitamins',
      featured: false,
      is_active: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setImageUploadError(null);
    setShowManualUrlInput(false);
    setFormData({
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      category_id: product.category_id || categories[0]?.id || '',
      bag_weight_kg: product.bag_weight_kg,
      price: product.price || 0,
      mrp: product.mrp || 0,
      available_stock: product.available_stock,
      low_stock_threshold: product.low_stock_threshold,
      description: product.description,
      short_description: product.short_description || '',
      features: (product.features && product.features.length > 0)
        ? [...product.features]
        : (product.description ? product.description.split('\n').map(s => s.trim()).filter(Boolean) : [
            'Specially packaged in signature sealed feed bags.',
            'Optimal protein balance designed to elevate milk yield and butterfat.',
          ]),
      image_url: product.image_url,
      crude_protein: product.nutritional_info?.crude_protein || '',
      crude_fat: product.nutritional_info?.crude_fat || '',
      crude_fiber: product.nutritional_info?.crude_fiber || '',
      feeding_guide: product.feeding_guide || '',
      ingredients: (product.ingredients && product.ingredients.length > 0) ? product.ingredients.join(', ') : '',
      featured: product.featured,
      is_active: product.is_active,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const updated = await dataService.toggleProductActive(product.id);
      setProducts(products.map(p => p.id === product.id ? updated : p));
    } catch (err: any) {
      alert(`Could not change product status: ${err.message}`);
    }
  };

  const handleRequestDelete = (prod: Product) => {
    setDeleteError(null);
    setProductToDelete(prod);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await dataService.deleteProduct(productToDelete.id);
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
      if (editingProduct?.id === productToDelete.id) {
        setIsModalOpen(false);
        setEditingProduct(null);
      }
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setDeleteError(err.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.name.trim()) {
      setModalError('Product title is required.');
      return;
    }

    setSaving(true);
    try {
      const cleanedFeatures = formData.features
        .map(f => f.trim())
        .filter(Boolean);

      const cleanedIngredients = formData.ingredients
        ? formData.ingredients.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : [];

      const payload: any = {
        name: formData.name.trim(),
        brand: (formData.brand || editingProduct?.brand || 'Radhe Krishna (Krishna Agrovet)').trim(),
        sku: (formData.sku || editingProduct?.sku || `RKPA-${Date.now().toString(36).toUpperCase()}`).trim(),
        category_id: formData.category_id || editingProduct?.category_id || categories[0]?.id || 'cat-1',
        bag_weight_kg: Number(formData.bag_weight_kg) || 50,
        price: 0,
        available_stock: Number(formData.available_stock) || 0,
        low_stock_threshold: Number(formData.low_stock_threshold) || 10,
        description: formData.description.trim() || cleanedFeatures.join('. '),
        short_description: formData.short_description.trim() || (cleanedFeatures[0] || ''),
        features: cleanedFeatures,
        ingredients: cleanedIngredients,
        image_url: formData.image_url.trim() || '/images/products/radhe-krishna-bypass-50kg.svg',
        nutritional_info: {
          crude_protein: formData.crude_protein || '22.0%',
          crude_fat: formData.crude_fat || '4.0%',
          crude_fiber: formData.crude_fiber || '9.5%',
        },
        feeding_guide: formData.feeding_guide.trim(),
        featured: Boolean(formData.featured),
        is_active: formData.is_active !== undefined ? Boolean(formData.is_active) : true,
      };

      if (editingProduct) {
        payload.id = editingProduct.id;
      }

      const saved = await dataService.saveProduct(payload);
      
      if (editingProduct) {
        setProducts(products.map(p => p.id === saved.id ? saved : p));
      } else {
        setProducts([saved, ...products]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving product:', err);
      setModalError(err.message || 'Failed to save product record.');
    } finally {
      setSaving(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-krishna-red text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              KRISHNA AGROVET
            </span>
            <span className="text-xs font-bold text-charcoal-muted">Cattle Feed Inventory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-deep-charcoal font-heading mt-1">
            Cattle Feed Products & Packaging
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Manage product catalog, bag photos, WhatsApp inquiries, and stock balances.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-krishna-red hover:bg-krishna-red-dark text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors border border-brand-yellow/40 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-brand-yellow" />
          <span>Add New Feed Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
          <input
            type="text"
            placeholder="Search products by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-warm-cream border border-warm-cream-dark rounded-xl text-xs text-deep-charcoal focus:outline-hidden focus:ring-2 focus:ring-krishna-red font-medium"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={loadData}
            className="p-2 text-charcoal-muted hover:text-krishna-red bg-warm-cream border border-warm-cream-dark rounded-xl cursor-pointer"
            title="Reload list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border-2 border-warm-cream-dark shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-warm-cream text-deep-charcoal font-black border-b border-warm-cream-dark uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Bag Weight</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-cream-dark bg-white">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-warm-cream/30 transition-colors">
                  
                  {/* Title */}
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-12 h-12 rounded-xl object-contain bg-warm-cream p-1 border border-warm-cream-dark shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-deep-charcoal block truncate max-w-xs sm:max-w-sm">
                        {prod.name}
                      </span>
                    </div>
                  </td>

                  {/* Bag Weight */}
                  <td className="py-3.5 px-4">
                    <span className="text-krishna-red text-xs font-bold">{prod.bag_weight_kg || 50} kg Bag</span>
                  </td>

                  {/* Stock */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-block font-black px-2.5 py-0.5 rounded text-xs ${
                      prod.available_stock <= 0
                        ? 'bg-rose-100 text-rose-800'
                        : prod.available_stock <= prod.low_stock_threshold
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {prod.available_stock} bags
                    </span>
                    <span className="text-[10px] text-charcoal-muted block mt-0.5">
                      Low threshold: {prod.low_stock_threshold}
                    </span>
                  </td>

                  {/* Active / Inactive */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      prod.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-600'
                    }`}>
                      {prod.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Action buttons */}
                  <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 text-deep-charcoal hover:text-krishna-red hover:bg-warm-cream rounded-lg transition-colors cursor-pointer"
                      title="Edit Product Details & Photo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(prod)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        prod.is_active
                          ? 'text-charcoal-muted hover:text-rose-600 hover:bg-rose-50'
                          : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50'
                      }`}
                      title={prod.is_active ? 'Deactivate Product' : 'Reactivate Product'}
                    >
                      {prod.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(prod)}
                      className="p-1.5 text-charcoal-muted hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>

                </tr>
              ))}
              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-charcoal-muted font-bold">
                    No products found.
                  </td>
                </tr>
              )}
              {filteredProducts.length === 0 && loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-charcoal-muted font-bold">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-krishna-red" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-deep-charcoal/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-warm-cream-dark">
            
            <div className="p-5 border-b border-warm-cream-dark flex items-center justify-between bg-warm-cream">
              <div>
                <span className="text-[10px] font-black uppercase text-krishna-red">
                  KRISHNA AGROVET PRODUCT MANAGEMENT
                </span>
                <h2 className="text-base font-black font-heading text-deep-charcoal">
                  {editingProduct ? 'Edit Cattle Feed Product & Pricing' : 'Add New Cattle Feed Product'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-charcoal-muted hover:text-krishna-red rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="m-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="p-5 sm:p-6 space-y-4 text-xs">
              
              {/* Product Name */}
              <div className="space-y-1">
                <label className="font-bold text-deep-charcoal">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Radhe Krishna Bypass Protein (बाईपास)"
                  className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-warm-cream/40 text-xs focus:ring-1 focus:ring-krishna-red font-medium"
                />
              </div>

              {/* Bag Weight & WhatsApp Pricing Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-warm-cream/60 p-3.5 rounded-2xl border border-warm-cream-dark items-center">
                <div className="space-y-1">
                  <label className="font-bold text-deep-charcoal text-xs">Bag Weight (kg) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={formData.bag_weight_kg}
                    onChange={(e) => setFormData({ ...formData, bag_weight_kg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-white text-xs focus:ring-1 focus:ring-krishna-red font-bold"
                  />
                  <span className="text-[10px] text-charcoal-muted block">Standard cattle feed sack</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-warm-cream-dark space-y-1">
                  <span className="text-[11px] font-black text-krishna-red uppercase tracking-wide block">
                    Pricing on WhatsApp
                  </span>
                  <p className="text-[11px] text-charcoal-muted leading-relaxed">
                    Product prices are not displayed as fixed tags. Rates are quoted and negotiated directly with customers over WhatsApp.
                  </p>
                </div>
              </div>

              {/* Stock and Low Stock Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-deep-charcoal">Available Stock (bags) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.available_stock}
                    onChange={(e) => setFormData({ ...formData, available_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-warm-cream/40 text-xs focus:ring-1 focus:ring-krishna-red font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-deep-charcoal">Low Stock Alert Threshold *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-warm-cream/40 text-xs focus:ring-1 focus:ring-krishna-red"
                  />
                </div>
              </div>

              {/* Description & Key Features (Checklist style as displayed in product modal) */}
              <div className="bg-warm-cream/50 p-4 rounded-2xl border-2 border-warm-cream-dark space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="font-black text-deep-charcoal text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Description & Key Features</span>
                    </label>
                    <span className="text-[10px] text-charcoal-muted block mt-0.5">
                      Checklist points displayed on product cards and in the product detail view.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-warm-cream border border-warm-cream-dark text-deep-charcoal rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-98 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add Point</span>
                  </button>
                </div>

                <div className="space-y-2.5 pt-1">
                  {formData.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-warm-cream-dark shadow-2xs">
                      <div className="w-5 h-5 rounded-full bg-stone-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                        <span className="text-[10px] font-black leading-none">✓</span>
                      </div>
                      <textarea
                        rows={2}
                        value={feature}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        placeholder={`Bullet point ${idx + 1} (e.g. Specially packaged in signature red and yellow bags...)`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-warm-cream-dark bg-warm-cream/20 text-xs font-medium focus:ring-1 focus:ring-krishna-red resize-y text-deep-charcoal leading-relaxed"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="p-1.5 text-charcoal-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer mt-1"
                        title="Remove point"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {formData.features.length === 0 && (
                    <div className="p-4 bg-white rounded-xl border border-dashed border-warm-cream-dark text-center">
                      <p className="text-xs text-charcoal-muted font-medium">No key feature points added.</p>
                      <button
                        type="button"
                        onClick={handleAddFeature}
                        className="mt-1 text-xs text-krishna-red font-bold hover:underline"
                      >
                        + Add the first key feature bullet point
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes Textarea (Optional) */}
              <div className="space-y-1">
                <label className="font-bold text-deep-charcoal">Additional Formulation Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional formulation details or fallback text..."
                  className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-warm-cream/40 text-xs focus:ring-1 focus:ring-krishna-red font-medium"
                />
              </div>

              {/* Product Image Upload Section */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border-2 border-warm-cream-dark">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-deep-charcoal text-xs sm:text-sm flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-krishna-red" />
                    <span>Product Sack Image *</span>
                  </label>
                  <span className="text-[11px] text-charcoal-muted">
                    Take photo or pick from gallery
                  </span>
                </div>

                {/* Upload Error Banner */}
                {imageUploadError && (
                  <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{imageUploadError}</span>
                  </div>
                )}

                {/* Hidden File Input (supports mobile camera or gallery) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Main Image Dropzone & Preview Box */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  
                  {/* Left: Interactive Sack Preview Container */}
                  <div className="sm:col-span-5 flex flex-col items-center">
                    <div className="relative aspect-[3/4] w-full max-w-[160px] bg-gradient-to-b from-warm-cream to-white rounded-2xl p-2.5 border-2 border-dashed border-warm-cream-dark shadow-xs flex items-center justify-center overflow-hidden group">
                      {formData.image_url ? (
                        <>
                          <img
                            src={formData.image_url}
                            alt="Product preview"
                            className="w-full h-full object-contain filter drop-shadow-sm transition-transform group-hover:scale-105"
                          />
                          <div className="absolute top-2 left-2 bg-deep-charcoal/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-xs">
                            {formData.bag_weight_kg || 50} KG
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-3 text-charcoal-muted">
                          <ImageIcon className="w-10 h-10 mx-auto text-warm-cream-dark mb-1" />
                          <span className="text-[11px] font-bold block">No Photo</span>
                        </div>
                      )}

                      {/* Loading overlay when compressing/reading image */}
                      {isProcessingImage && (
                        <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center text-xs font-bold text-krishna-red gap-1">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Optimizing photo...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Upload Dropzone & Actions */}
                  <div className="sm:col-span-7 space-y-2.5">
                    
                    {/* Drag and Drop Box */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`cursor-pointer p-3.5 rounded-2xl border-2 border-dashed text-center transition-all ${
                        isDragging
                          ? 'border-krishna-red bg-krishna-red/10'
                          : 'border-warm-cream-dark hover:border-krishna-red/50 bg-warm-cream/30 hover:bg-warm-cream/60'
                      }`}
                    >
                      <UploadCloud className="w-6 h-6 mx-auto text-krishna-red mb-1" />
                      <span className="text-xs font-black text-deep-charcoal block">
                        Click or Drop Product Photo Here
                      </span>
                      <span className="text-[10px] text-charcoal-muted block mt-0.5">
                        JPG, PNG, WebP (Camera or Gallery)
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessingImage}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-krishna-red hover:bg-krishna-red-dark active:scale-98 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{formData.image_url ? 'Choose Another Photo' : 'Upload From Device'}</span>
                      </button>

                      {formData.image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="Clear image"
                        >
                          Clear
                        </button>
                      )}
                    </div>


                    {/* Manual URL toggle */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowManualUrlInput(prev => !prev)}
                        className="text-[10px] font-bold text-charcoal-muted hover:text-krishna-red flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>{showManualUrlInput ? 'Hide manual image URL' : 'Or enter custom image URL/path'}</span>
                      </button>

                      {showManualUrlInput && (
                        <div className="mt-2 space-y-1 animate-in fade-in duration-150">
                          <input
                            type="text"
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="/images/products/... or https://..."
                            className="w-full px-3 py-1.5 rounded-xl border border-warm-cream-dark bg-warm-cream/40 text-xs font-mono focus:ring-1 focus:ring-krishna-red"
                          />
                          <span className="text-[10px] text-charcoal-muted block">
                            Direct image link or local path.
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              </div>

              {/* Nutritional Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-deep-charcoal">Crude Protein</label>
                  <input
                    type="text"
                    value={formData.crude_protein}
                    onChange={(e) => setFormData({ ...formData, crude_protein: e.target.value })}
                    placeholder="22.0% - 24.0%"
                    className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-warm-cream/40 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-deep-charcoal">Crude Fat</label>
                  <input
                    type="text"
                    value={formData.crude_fat}
                    onChange={(e) => setFormData({ ...formData, crude_fat: e.target.value })}
                    placeholder="4.0% min"
                    className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-warm-cream/40 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-deep-charcoal">Crude Fiber</label>
                  <input
                    type="text"
                    value={formData.crude_fiber}
                    onChange={(e) => setFormData({ ...formData, crude_fiber: e.target.value })}
                    placeholder="9.5% max"
                    className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-warm-cream/40 text-xs"
                  />
                </div>
              </div>

              {/* Feeding guide */}
              <div className="space-y-1">
                <label className="font-bold text-deep-charcoal">Feeding Guide</label>
                <input
                  type="text"
                  value={formData.feeding_guide}
                  onChange={(e) => setFormData({ ...formData, feeding_guide: e.target.value })}
                  placeholder="Feed 400g per liter of cow milk; 500g per liter of buffalo milk."
                  className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-warm-cream/40 text-xs"
                />
              </div>

              {/* Product Ingredients */}
              <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/80">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                    <span className="text-sm">🌾</span>
                    <span>Product Ingredients / मुख्य सामग्री</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Separate by commas (,) or newlines
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="e.g. Grains & Cereals, Mustard Oil Cake, De-Oiled Rice Bran, Cane Molasses, Rumen Protected Bypass Fat, Minerals & Vitamins"
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300/80 bg-white text-xs text-deep-charcoal focus:ring-1 focus:ring-emerald-600 font-medium leading-relaxed"
                />
                
                {/* Live Ingredients Badges Preview */}
                {formData.ingredients && formData.ingredients.trim() && (
                  <div className="pt-1">
                    <span className="text-[10px] text-charcoal-muted uppercase font-bold block mb-1">
                      Live Preview on Homepage & Details:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.ingredients
                        .split(/[,;\n]/)
                        .map(s => s.trim())
                        .filter(Boolean)
                        .map((ing, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>{ing}</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Flags: Featured & Active */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-deep-charcoal">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded text-krishna-red focus:ring-krishna-red"
                  />
                  <span>Mark as Featured Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-deep-charcoal">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-krishna-red focus:ring-krishna-red"
                  />
                  <span>Product is Active in Store</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-warm-cream-dark flex items-center justify-between gap-3">
                {editingProduct ? (
                  <button
                    type="button"
                    onClick={() => handleRequestDelete(editingProduct)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-warm-cream-dark text-charcoal-muted hover:bg-warm-cream font-bold cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black rounded-xl shadow-sm transition-colors border border-brand-yellow-dark cursor-pointer disabled:opacity-50 text-xs"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{editingProduct ? 'Update Product & Price' : 'Save Feed Product'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-deep-charcoal/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-warm-cream-dark p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black font-heading text-deep-charcoal">
                Delete Cattle Feed Product?
              </h3>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-deep-charcoal">{productToDelete.name}</strong> ({productToDelete.bag_weight_kg || 50} kg)?
              </p>
              <div className="p-3 bg-warm-cream rounded-xl text-[11px] text-charcoal-muted mt-2 border border-warm-cream-dark text-left space-y-1">
                <div>• SKU: <strong>{productToDelete.sku}</strong></div>
                <div>• Current Stock: <strong>{productToDelete.available_stock} bags</strong></div>
                <div className="text-rose-700 font-bold">This action cannot be undone and removes it from the store catalog.</div>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-warm-cream-dark text-xs font-bold text-deep-charcoal hover:bg-warm-cream transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 px-4 bg-krishna-red hover:bg-krishna-red-dark text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
