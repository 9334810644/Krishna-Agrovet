import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dataService } from '../../lib/firebase';
import { Order, Product } from '../../types';
import { 
  ShoppingCart, Package, AlertTriangle, CheckCircle, 
  Clock, ArrowRight, Eye, RefreshCw, Scale 
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderList, prodList] = await Promise.all([
        dataService.getOrders(),
        dataService.getProducts(),
      ]);
      setOrders(orderList);
      setProducts(prodList);
    } catch (err) {
      console.error('Error loading dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const totalProducts = products.filter(p => p.is_active).length;
  const lowStockProducts = products.filter(
    p => p.is_active && p.available_stock <= p.low_stock_threshold
  ).length;

  const totalBagsOrdered = orders
    .reduce((sum, o) => sum + (o.total_bags || 0), 0);

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
          <h1 className="text-2xl sm:text-3xl font-black text-deep-charcoal font-heading mt-1">
            Radhe Krishna Pashu Aahar Overview
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Real-time cattle feed orders, customer WhatsApp dispatches, and inventory balances.
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
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-warm-cream text-krishna-red flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-deep-charcoal font-heading">{totalOrders}</div>
          <span className="text-[11px] text-charcoal-muted font-medium">All registered orders</span>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 font-heading">{pendingOrders}</div>
          <span className="text-[11px] text-charcoal-muted font-medium">Needs WhatsApp verify</span>
        </div>

        {/* Confirmed Orders */}
        <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Confirmed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 font-heading">{confirmedOrders}</div>
          <span className="text-[11px] text-charcoal-muted font-medium">Ready for dispatch</span>
        </div>

        {/* Total Sacks Ordered */}
        <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">Total Bags</span>
            <div className="w-8 h-8 rounded-lg bg-warm-cream text-feed-turquoise-dark flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-deep-charcoal font-heading">{totalBagsOrdered}</div>
          <span className="text-[11px] text-charcoal-muted font-medium">{totalBagsOrdered * 50} kg feed ordered</span>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-700 uppercase tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-800 font-heading">{lowStockProducts}</div>
          <span className="text-[11px] text-charcoal-muted font-medium">At or below threshold</span>
        </div>

        {/* Total Feed Products */}
        <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-charcoal-muted uppercase tracking-wider">Active Lines</span>
            <div className="w-8 h-8 rounded-lg bg-warm-cream text-krishna-red flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-deep-charcoal font-heading">{totalProducts}</div>
          <span className="text-[11px] text-charcoal-muted font-medium">Bypass, Ekstrapro, etc.</span>
        </div>

      </div>

      {/* Main Grid: Recent Orders & Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Recent Orders Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl border-2 border-warm-cream-dark shadow-sm overflow-hidden">
          <div className="p-5 border-b border-warm-cream-dark flex items-center justify-between bg-warm-cream/40">
            <div>
              <span className="text-[10px] font-black uppercase text-krishna-red">DISPATCH QUEUE</span>
              <h2 className="text-base font-black font-heading text-deep-charcoal">
                Recent Cattle Feed Orders
              </h2>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 text-xs font-black text-krishna-red hover:underline"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-cream text-deep-charcoal font-black border-b border-warm-cream-dark uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer & Farm</th>
                  <th className="py-3 px-4">Sacks</th>
                  <th className="py-3 px-4">Pricing</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-cream-dark bg-white">
                {orders.slice(0, 6).map((ord) => (
                  <tr key={ord.id} className="hover:bg-warm-cream/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-krishna-red">
                      {ord.order_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-deep-charcoal block">{ord.customer_name}</span>
                      <span className="text-charcoal-muted text-[11px] block">{ord.village_town}</span>
                    </td>

                    <td className="py-3.5 px-4 font-black text-deep-charcoal">
                      {ord.total_bags} bags ({ord.total_bags * 50} kg)
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-bold text-krishna-red bg-krishna-red/10 px-2 py-0.5 rounded-md inline-block">
                        Rate on WhatsApp
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        ord.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                        ord.status === 'confirmed' ? 'bg-amber-100 text-amber-800' :
                        'bg-warm-cream text-deep-charcoal'
                      }`}>
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/orders?highlight=${ord.id}`}
                        className="p-1.5 inline-flex text-deep-charcoal hover:text-krishna-red hover:bg-warm-cream rounded-lg transition-colors"
                        title="View and manage order"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-charcoal-muted font-bold">
                      No customer orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Signature Product Stock & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Signature Products Stock Card */}
          <div className="bg-white rounded-3xl border-2 border-warm-cream-dark p-6 shadow-sm space-y-4">
            <span className="text-[10px] font-black uppercase text-krishna-red tracking-wider block">
              SIGNATURE FEEDS STOCK
            </span>
            <h3 className="text-base font-black font-heading text-deep-charcoal">
              Core Product Line Balances
            </h3>

            <div className="space-y-3">
              {products.slice(0, 4).map((p) => (
                <div key={p.id} className="p-3 bg-warm-cream/50 rounded-2xl border border-warm-cream-dark flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-xs text-deep-charcoal block truncate">{p.name}</span>
                    <span className="text-[11px] text-charcoal-muted">Standard sack • Rate on WhatsApp</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${
                      p.available_stock <= p.low_stock_threshold ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.available_stock} bags
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/admin/inventory"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black text-xs rounded-xl transition-colors border border-brand-yellow-dark"
            >
              <span>Manage Warehouse Stock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white rounded-3xl border-2 border-warm-cream-dark p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-charcoal-muted">
              Quick Shortcuts
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/admin/products"
                className="p-3 bg-warm-cream hover:bg-warm-cream-dark rounded-xl font-bold text-deep-charcoal text-center border border-warm-cream-dark transition-colors"
              >
                Edit Prices
              </Link>
              <Link
                to="/admin/settings"
                className="p-3 bg-warm-cream hover:bg-warm-cream-dark rounded-xl font-bold text-deep-charcoal text-center border border-warm-cream-dark transition-colors"
              >
                Store Settings
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
