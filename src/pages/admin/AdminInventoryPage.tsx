import React, { useState, useEffect } from 'react';
import { dataService } from '../../lib/firebase';
import { Product, InventoryMovement, InventoryMovementReason } from '../../types';
import { 
  Boxes, Plus, Minus, AlertTriangle, History, 
  RefreshCw, CheckCircle2, X, Loader2, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State for stock adjustment
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustQty, setAdjustQty] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<InventoryMovementReason>('restock');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubProducts = dataService.subscribeProducts((list) => {
      setProducts(list);
      setLoading(false);
    });

    const unsubMovements = dataService.subscribeInventoryMovements((moves) => {
      setMovements(moves);
    });

    return () => {
      if (typeof unsubProducts === 'function') unsubProducts();
      if (typeof unsubMovements === 'function') unsubMovements();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, moves] = await Promise.all([
        dataService.getProducts(),
        dataService.getInventoryMovements(),
      ]);
      setProducts(prods);
      setMovements(moves);
    } catch (err) {
      console.error('Error reloading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAdjustModal = (product: Product, type: 'add' | 'subtract' = 'add') => {
    setAdjustModalProduct(product);
    setAdjustType(type);
    setAdjustQty(10);
    setAdjustReason(type === 'add' ? 'restock' : 'spoilage_damage');
    setAdjustNotes('');
    setErrorMsg(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    setErrorMsg(null);

    if (adjustQty <= 0) {
      setErrorMsg('Quantity must be greater than 0.');
      return;
    }

    const changeQty = adjustType === 'add' ? adjustQty : -adjustQty;

    if (adjustType === 'subtract' && adjustQty > adjustModalProduct.available_stock) {
      setErrorMsg(`Cannot remove ${adjustQty} bags. Current available stock is only ${adjustModalProduct.available_stock} bags.`);
      return;
    }

    setSaving(true);
    try {
      const updated = await dataService.adjustInventory(
        adjustModalProduct.id,
        changeQty,
        adjustReason,
        adjustNotes || `Manual adjustment by admin (${adjustType})`
      );

      // Update product in list
      setProducts(products.map(p => p.id === updated.id ? updated : p));
      
      // Reload audit movements
      const updatedMovements = await dataService.getInventoryMovements();
      setMovements(updatedMovements);

      setAdjustModalProduct(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to adjust inventory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-krishna-red text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              KRISHNA AGROVET
            </span>
            <span className="text-xs font-bold text-charcoal-muted">Sack Inventory Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-deep-charcoal font-heading mt-1">
            Feed Inventory & Stock Audit
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Real-time bag balances, threshold monitors, and immutable stock audit logs.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-warm-cream text-deep-charcoal border-2 border-warm-cream-dark rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Stock Balances Table */}
      <div className="bg-white rounded-3xl border-2 border-warm-cream-dark shadow-sm overflow-hidden">
        <div className="p-5 border-b border-warm-cream-dark flex items-center justify-between bg-warm-cream/40">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-krishna-red" />
            <h2 className="text-base font-black text-deep-charcoal font-heading">
              Current Warehouse & Mill Stock Balances
            </h2>
          </div>
          <span className="text-xs font-bold text-charcoal-muted">
            {products.length} Products Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-warm-cream text-deep-charcoal font-black border-b border-warm-cream-dark uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU & Weight</th>
                <th className="py-3 px-4">Available Bags</th>
                <th className="py-3 px-4">Alert Threshold</th>
                <th className="py-3 px-4">Stock Health</th>
                <th className="py-3 px-4 text-right">Quick Stock Adjustment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-cream-dark bg-white">
              {products.map((prod) => {
                const isOut = prod.available_stock <= 0;
                const isLow = !isOut && prod.available_stock <= prod.low_stock_threshold;
                return (
                  <tr key={prod.id} className="hover:bg-warm-cream/30 transition-colors">
                    
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-deep-charcoal block">{prod.name}</span>
                      <span className="text-[11px] text-charcoal-muted">{prod.brand}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="block font-semibold text-deep-charcoal">{prod.sku}</span>
                      <span className="font-sans text-krishna-red text-[11px] font-bold">{prod.bag_weight_kg || 50}kg</span>
                    </td>

                    <td className="py-3.5 px-4 font-black text-base font-heading text-deep-charcoal">
                      {prod.available_stock} <span className="text-xs font-normal text-charcoal-muted font-sans">bags</span>
                    </td>

                    <td className="py-3.5 px-4 text-charcoal-muted font-bold">
                      {prod.low_stock_threshold} bags
                    </td>

                    <td className="py-3.5 px-4">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-md text-[10px] font-black">
                          <AlertTriangle className="w-3 h-3" /> Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-md text-[10px] font-black animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Low Stock Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md text-[10px] font-black">
                          <CheckCircle2 className="w-3 h-3" /> In Good Supply
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => openAdjustModal(prod, 'add')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal rounded-lg text-xs font-black border border-brand-yellow-dark transition-colors cursor-pointer"
                        title="Restock shipment"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openAdjustModal(prod, 'subtract')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-warm-cream hover:bg-warm-cream-dark text-deep-charcoal rounded-lg text-xs font-bold border border-warm-cream-dark transition-colors cursor-pointer"
                        title="Write off or deduct"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        <span>Deduct</span>
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Movements Audit Trail */}
      <div className="bg-white rounded-3xl border-2 border-warm-cream-dark shadow-sm overflow-hidden">
        <div className="p-5 border-b border-warm-cream-dark flex items-center justify-between bg-warm-cream/40">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-krishna-red" />
            <h2 className="text-base font-black text-deep-charcoal font-heading">
              Inventory Movement Audit Log
            </h2>
          </div>
          <span className="text-xs text-charcoal-muted font-bold">
            Immutable tracking for all sales deductions, cancellations & restocks
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-warm-cream text-deep-charcoal font-black border-b border-warm-cream-dark uppercase text-[11px] sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Feed Product</th>
                <th className="py-2.5 px-4">Change</th>
                <th className="py-2.5 px-4">Previous Stock</th>
                <th className="py-2.5 px-4">New Stock</th>
                <th className="py-2.5 px-4">Reason</th>
                <th className="py-2.5 px-4">Audit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-cream-dark bg-white">
              {movements.map((m) => {
                const isPositive = m.change_quantity > 0;
                return (
                  <tr key={m.id} className="hover:bg-warm-cream/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-charcoal-muted whitespace-nowrap font-medium">
                      {new Date(m.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>

                    <td className="py-2.5 px-4 font-bold text-deep-charcoal">
                      {m.product_name || m.product_id}
                    </td>

                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 font-black ${
                        isPositive ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                        {isPositive ? `+${m.change_quantity}` : m.change_quantity} bags
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-charcoal-muted">
                      {m.previous_stock}
                    </td>

                    <td className="py-2.5 px-4 font-black text-deep-charcoal">
                      {m.new_stock}
                    </td>

                    <td className="py-2.5 px-4">
                      <span className="capitalize bg-warm-cream text-deep-charcoal font-bold px-2 py-0.5 rounded border border-warm-cream-dark text-[11px]">
                        {m.reason.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-charcoal-muted italic truncate max-w-xs">
                      {m.notes || '—'}
                    </td>
                  </tr>
                );
              })}
              {movements.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-muted font-bold">
                    No movements recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-deep-charcoal/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-warm-cream-dark">
            <div className="p-5 border-b border-warm-cream-dark flex items-center justify-between bg-warm-cream">
              <div>
                <span className="text-[10px] font-black uppercase text-krishna-red">STOCK AUDIT ADJUSTMENT</span>
                <h3 className="text-base font-black font-heading text-deep-charcoal">
                  Adjust Feed Stock: {adjustModalProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAdjustModalProduct(null)}
                className="p-1.5 text-charcoal-muted hover:text-krishna-red rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
              
              <div className="bg-warm-cream p-3 rounded-xl border border-warm-cream-dark flex justify-between items-center text-xs">
                <span className="text-charcoal-muted font-bold">Current Available Stock:</span>
                <span className="font-black text-sm text-deep-charcoal">{adjustModalProduct.available_stock} bags</span>
              </div>

              {/* Action Type */}
              <div className="space-y-1">
                <label className="font-bold text-deep-charcoal">Action Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('add');
                      setAdjustReason('restock');
                    }}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      adjustType === 'add'
                        ? 'bg-brand-yellow text-deep-charcoal border-brand-yellow-dark shadow-xs'
                        : 'bg-warm-cream text-charcoal-muted border-warm-cream-dark'
                    }`}
                  >
                    + Add Bags (Restock)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType('subtract');
                      setAdjustReason('spoilage_damage');
                    }}
                    className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      adjustType === 'subtract'
                        ? 'bg-krishna-red text-white border-krishna-red shadow-xs'
                        : 'bg-warm-cream text-charcoal-muted border-warm-cream-dark'
                    }`}
                  >
                    - Deduct Bags
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="font-bold text-deep-charcoal">Number of Bags *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs font-black focus:ring-1 focus:ring-krishna-red"
                />
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="font-bold text-deep-charcoal">Audit Reason *</label>
                <select
                  value={adjustReason}
                  onChange={(e: any) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs font-bold focus:ring-1 focus:ring-krishna-red cursor-pointer"
                >
                  <option value="restock">Direct Mill Restock / New Batch</option>
                  <option value="manual_adjustment">Manual Physical Count Adjustment</option>
                  <option value="spoilage_damage">Damaged or Torn Sack Write-Off</option>
                  <option value="correction">Inventory Entry Correction</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-deep-charcoal">Audit Reference / Driver Note</label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Batch #401 arrived from Krishna Agrovet mill plant"
                  className="w-full px-3 py-2 rounded-xl border-2 border-warm-cream-dark bg-warm-cream/50 text-xs font-medium focus:ring-1 focus:ring-krishna-red"
                />
              </div>

              <div className="pt-3 border-t border-warm-cream-dark flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2 rounded-xl border border-warm-cream-dark text-charcoal-muted font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black rounded-xl shadow-xs transition-colors border border-brand-yellow-dark cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adjusting...</span>
                    </>
                  ) : (
                    <span>Confirm Stock Change</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
