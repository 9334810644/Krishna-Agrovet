import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../../lib/firebase';
import { Product, InventoryMovement } from '../../types';
import { 
  Package, Boxes, AlertTriangle, ArrowRight, 
  RefreshCw, Scale, History, Plus, Settings, 
  ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodList, moveList] = await Promise.all([
        dataService.getProducts(),
        dataService.getInventoryMovements(),
      ]);
      setProducts(prodList);
      setMovements(moveList);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const unsubProducts = dataService.subscribeProducts((prods) => {
      setProducts(prods);
      setLoading(false);
    });

    const unsubMovements = dataService.subscribeInventoryMovements((moves) => {
      setMovements(moves);
    });

    return () => {
      unsubProducts();
      unsubMovements();
    };
  }, []);

  // Compute inventory & catalog metrics
  const activeProducts = products.filter(p => p.is_active);
  const totalStockBags = activeProducts.reduce((sum, p) => sum + (p.available_stock || 0), 0);
  const totalStockWeightKg = totalStockBags * 50;

  const lowStockProducts = activeProducts.filter(
    p => p.available_stock > 0 && p.available_stock <= p.low_stock_threshold
  );

  const outOfStockProducts = activeProducts.filter(
    p => p.available_stock <= 0
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-krishna-red text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              KRISHNA AGROVET
            </span>
            <span className="text-xs font-bold text-charcoal-muted">Operations Dashboard</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <img
              src="/images/radhe-krishna-transparent-wordmark.png"
              alt="राधे कृष्णा पशु आहार"
              className="h-8 sm:h-10 w-auto object-contain filter drop-shadow-xs"
            />
            <span className="text-xl sm:text-2xl font-black text-deep-charcoal font-heading">
              Overview & Mill Balances
            </span>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Real-time cattle feed catalog, packaging, and mill inventory balances.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-warm-cream text-deep-charcoal border-2 border-warm-cream-dark rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Stock in Mill */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-warm-cream-dark shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">Total Warehouse Stock</span>
            <div className="w-9 h-9 rounded-xl bg-warm-cream text-krishna-red flex items-center justify-center border border-warm-cream-dark">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-deep-charcoal font-heading">
            {totalStockBags} <span className="text-xs font-bold text-charcoal-muted">bags</span>
          </div>
          <span className="text-[11px] text-charcoal-muted font-medium block">
            {totalStockWeightKg.toLocaleString('en-IN')} kg net cattle feed
          </span>
        </div>

        {/* Active Product Lines */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-warm-cream-dark shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">Active Products</span>
            <div className="w-9 h-9 rounded-xl bg-warm-cream text-feed-turquoise-dark flex items-center justify-center border border-warm-cream-dark">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-deep-charcoal font-heading">
            {activeProducts.length} <span className="text-xs font-bold text-charcoal-muted">lines</span>
          </div>
          <span className="text-[11px] text-charcoal-muted font-medium block">
            Bypass, Ekstrapro, etc.
          </span>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-warm-cream-dark shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Low Stock</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-800 font-heading">
            {lowStockProducts.length} <span className="text-xs font-bold text-charcoal-muted">products</span>
          </div>
          <span className="text-[11px] text-charcoal-muted font-medium block">
            At or below threshold
          </span>
        </div>

        {/* Out of Stock Alert */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-warm-cream-dark shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-700 uppercase tracking-wider">Out of Stock</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-800 font-heading">
            {outOfStockProducts.length} <span className="text-xs font-bold text-charcoal-muted">products</span>
          </div>
          <span className="text-[11px] text-charcoal-muted font-medium block">
            Needs production replenishment
          </span>
        </div>

      </div>

      {/* Main Grid: Stock Balances & Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Product Stock Balances Table */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white rounded-3xl border-2 border-warm-cream-dark shadow-sm overflow-hidden">
            <div className="p-5 border-b border-warm-cream-dark flex items-center justify-between bg-warm-cream/40">
              <div>
                <span className="text-[10px] font-black uppercase text-krishna-red">STOCK MONITOR</span>
                <h2 className="text-base font-black font-heading text-deep-charcoal">
                  Cattle Feed Product Balances
                </h2>
              </div>
              <Link
                to="/admin/inventory"
                className="inline-flex items-center gap-1.5 text-xs font-black text-krishna-red hover:underline"
              >
                <span>Full Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-warm-cream text-deep-charcoal font-black border-b border-warm-cream-dark uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Feed Product</th>
                    <th className="py-3 px-4">Bag Weight</th>
                    <th className="py-3 px-4">Available Bags</th>
                    <th className="py-3 px-4">Health Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-cream-dark bg-white">
                  {activeProducts.map((prod) => {
                    const isOut = prod.available_stock <= 0;
                    const isLow = !isOut && prod.available_stock <= prod.low_stock_threshold;
                    return (
                      <tr key={prod.id} className="hover:bg-warm-cream/30 transition-colors">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-10 h-10 rounded-xl object-contain bg-warm-cream p-1 border border-warm-cream-dark shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-deep-charcoal block truncate max-w-xs">
                              {prod.name}
                            </span>
                            <span className="text-[11px] text-charcoal-muted">
                              SKU: {prod.sku || 'N/A'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-krishna-red">
                          {prod.bag_weight_kg || 50} kg Standard Sack
                        </td>

                        <td className="py-3.5 px-4 font-black text-deep-charcoal text-sm">
                          {prod.available_stock} <span className="text-xs font-normal text-charcoal-muted">bags</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy Stock'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to="/admin/inventory"
                            className="p-1.5 inline-flex text-deep-charcoal hover:text-krishna-red hover:bg-warm-cream rounded-lg transition-colors font-bold text-xs"
                            title="Adjust inventory"
                          >
                            Adjust Stock
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {activeProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-charcoal-muted font-bold">
                        No active cattle feed products found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Stock Audit Trail Preview */}
          <div className="bg-white rounded-3xl border-2 border-warm-cream-dark shadow-sm overflow-hidden">
            <div className="p-5 border-b border-warm-cream-dark flex items-center justify-between bg-warm-cream/40">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-krishna-red" />
                <h3 className="text-sm font-black font-heading text-deep-charcoal">
                  Recent Inventory Adjustments
                </h3>
              </div>
              <Link
                to="/admin/inventory"
                className="text-xs font-bold text-krishna-red hover:underline"
              >
                View Audit Log
              </Link>
            </div>

            <div className="divide-y divide-warm-cream-dark">
              {movements.slice(0, 4).map((m) => {
                const isPositive = m.change_quantity > 0;
                return (
                  <div key={m.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-warm-cream/20">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                        isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-bold text-deep-charcoal block">{m.product_name || m.product_id}</span>
                        <span className="text-[11px] text-charcoal-muted capitalize">
                          {m.reason.replace(/_/g, ' ')} • {new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <span className={`font-black text-sm ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isPositive ? `+${m.change_quantity}` : m.change_quantity} bags
                    </span>
                  </div>
                );
              })}
              {movements.length === 0 && (
                <div className="p-6 text-center text-charcoal-muted text-xs font-bold">
                  No stock adjustments recorded yet.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Quick Actions & Management */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Shortcuts */}
          <div className="bg-white rounded-3xl border-2 border-warm-cream-dark p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-charcoal-muted">
              Quick Management Shortcuts
            </h4>

            <div className="space-y-2.5">
              <Link
                to="/admin/products"
                className="flex items-center justify-between p-3.5 bg-warm-cream hover:bg-warm-cream-dark rounded-2xl font-bold text-xs text-deep-charcoal border border-warm-cream-dark transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-krishna-red" />
                  <span>Manage Products & Photos</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-charcoal-muted" />
              </Link>

              <Link
                to="/admin/inventory"
                className="flex items-center justify-between p-3.5 bg-warm-cream hover:bg-warm-cream-dark rounded-2xl font-bold text-xs text-deep-charcoal border border-warm-cream-dark transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="w-4 h-4 text-krishna-red" />
                  <span>Adjust Warehouse Stock</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-charcoal-muted" />
              </Link>

              <Link
                to="/admin/settings"
                className="flex items-center justify-between p-3.5 bg-warm-cream hover:bg-warm-cream-dark rounded-2xl font-bold text-xs text-deep-charcoal border border-warm-cream-dark transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-krishna-red" />
                  <span>Store Contact & WhatsApp</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-charcoal-muted" />
              </Link>
            </div>
          </div>

          {/* Reorder / Low Stock Card */}
          {lowStockProducts.length > 0 && (
            <div className="bg-amber-50 rounded-3xl border-2 border-amber-300 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Restock Attention Needed</span>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
                {lowStockProducts.length} feed product(s) have reached minimum bag threshold in the mill.
              </p>
              <div className="space-y-1.5 pt-1">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center text-xs font-bold text-amber-950 bg-white/70 px-3 py-2 rounded-xl border border-amber-200">
                    <span className="truncate pr-2">{p.name}</span>
                    <span className="shrink-0 text-amber-800">{p.available_stock} bags left</span>
                  </div>
                ))}
              </div>
              <Link
                to="/admin/inventory"
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black text-xs rounded-xl transition-colors border border-brand-yellow-dark shadow-xs mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Restock Bags Now</span>
              </Link>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
