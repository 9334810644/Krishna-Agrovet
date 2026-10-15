import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dataService } from '../../lib/firebase';
import { Order, OrderStatus } from '../../types';
import { 
  Search, Filter, Eye, Printer, 
  MessageCircle, Phone, 
  RefreshCw, X, Loader2, Save 
} from 'lucide-react';
import { normalizeWhatsAppNumber } from '../../lib/whatsapp';

export const AdminOrdersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightOrderId = searchParams.get('highlight');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Selected order for Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await dataService.getOrders();
      setOrders(data);
      if (highlightOrderId) {
        const found = data.find(o => o.id === highlightOrderId);
        if (found) {
          setSelectedOrder(found);
          setNewStatus(found.status);
        }
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [highlightOrderId]);

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNotes('');
    setUpdateError(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      const updated = await dataService.updateOrderStatus(
        selectedOrder.id,
        newStatus,
        statusNotes.trim() || undefined
      );

      // Update in state
      setOrders(orders.map(o => o.id === updated.id ? updated : o));
      setSelectedOrder(updated);
      alert(`Order ${updated.order_number} status updated to ${updated.status}. ${newStatus === 'cancelled' ? '(Stock restored automatically)' : ''}`);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setUpdateError(err.message || 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    if (selectedStatus !== 'all' && o.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.village_town.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-krishna-red text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              KRISHNA AGROVET
            </span>
            <span className="text-xs font-bold text-charcoal-muted">Dispatch Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-deep-charcoal font-heading mt-1">
            Order Fulfillment & Farm Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Review incoming orders, verify customer delivery directions, and update delivery statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-warm-cream text-deep-charcoal border-2 border-warm-cream-dark rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-muted" />
          <input
            type="text"
            placeholder="Search Order #, customer name, phone, village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-warm-cream border border-warm-cream-dark rounded-xl text-xs text-deep-charcoal focus:outline-hidden focus:ring-2 focus:ring-krishna-red font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-charcoal-muted shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-warm-cream border border-warm-cream-dark rounded-xl px-3 py-2 text-deep-charcoal focus:outline-hidden font-bold cursor-pointer"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="pending">Pending ({orders.filter(o => o.status === 'pending').length})</option>
            <option value="confirmed">Confirmed ({orders.filter(o => o.status === 'confirmed').length})</option>
            <option value="packed">Packed ({orders.filter(o => o.status === 'packed').length})</option>
            <option value="out_for_delivery">Out For Delivery ({orders.filter(o => o.status === 'out_for_delivery').length})</option>
            <option value="delivered">Delivered ({orders.filter(o => o.status === 'delivered').length})</option>
            <option value="cancelled">Cancelled ({orders.filter(o => o.status === 'cancelled').length})</option>
          </select>
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border-2 border-warm-cream-dark shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-warm-cream text-deep-charcoal font-black border-b border-warm-cream-dark uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Order Number</th>
                <th className="py-3 px-4">Customer & Location</th>
                <th className="py-3 px-4">Feed Bags</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Placed At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-cream-dark bg-white">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-warm-cream/30 transition-colors">
                  
                  {/* Order Number */}
                  <td className="py-3.5 px-4 font-mono font-black text-krishna-red">
                    {ord.order_number}
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-deep-charcoal block">{ord.customer_name}</span>
                    <span className="text-charcoal-muted text-[11px] block">{ord.village_town} • {ord.district}</span>
                    <a
                      href={`tel:${ord.customer_phone}`}
                      className="text-krishna-red hover:underline font-mono text-[11px] font-bold"
                    >
                      +91 {ord.customer_phone}
                    </a>
                  </td>

                  {/* Bags */}
                  <td className="py-3.5 px-4 font-black text-deep-charcoal">
                    {ord.total_bags} bags ({ord.total_bags * 50} kg)
                  </td>

                  {/* Amount / Rate on WhatsApp */}
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-bold text-krishna-red bg-krishna-red/10 px-2 py-0.5 rounded-md inline-block">
                      Rate on WhatsApp
                    </span>
                    <span className="text-[10px] text-charcoal-muted font-bold block mt-0.5">Cash on Delivery (COD)</span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      ord.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                      ord.status === 'packed' ? 'bg-purple-100 text-purple-800' :
                      ord.status === 'confirmed' ? 'bg-amber-100 text-amber-800' :
                      ord.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                      'bg-warm-cream text-deep-charcoal'
                    }`}>
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-charcoal-muted whitespace-nowrap font-medium">
                    {new Date(ord.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(ord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black rounded-lg transition-colors border border-brand-yellow-dark cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Manage</span>
                    </button>
                  </td>

                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-charcoal-muted font-bold">
                    No matching orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Status Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-deep-charcoal/70 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l-2 border-warm-cream-dark">
              
              {/* Drawer Header */}
              <div className="p-5 border-b border-warm-cream-dark flex items-center justify-between bg-warm-cream">
                <div>
                  <span className="text-[10px] font-black uppercase text-krishna-red">
                    KRISHNA AGROVET ORDER DISPATCH
                  </span>
                  <h2 className="text-base font-black font-heading text-deep-charcoal flex items-center gap-2">
                    <span>Order: {selectedOrder.order_number}</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="p-2 text-charcoal-muted hover:text-deep-charcoal bg-white rounded-lg border border-warm-cream-dark"
                    title="Print receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 text-charcoal-muted hover:text-krishna-red rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs bg-warm-cream/30">
                
                {/* Customer Contact Card */}
                <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark space-y-3">
                  <span className="font-black text-charcoal-muted uppercase tracking-wider text-[10px] block">
                    Customer & Farm Delivery Address
                  </span>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-deep-charcoal">{selectedOrder.customer_name}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <a
                        href={`tel:${selectedOrder.customer_phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-warm-cream hover:bg-warm-cream-dark text-deep-charcoal rounded-lg font-bold border border-warm-cream-dark"
                      >
                        <Phone className="w-3.5 h-3.5 text-krishna-red" />
                        <span>Call +91 {selectedOrder.customer_phone}</span>
                      </a>
                      <a
                        href={`https://wa.me/${normalizeWhatsAppNumber(selectedOrder.customer_phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg font-bold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Customer</span>
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-warm-cream-dark space-y-1 text-charcoal-muted">
                    <p><strong className="text-deep-charcoal">Village:</strong> {selectedOrder.village_town}</p>
                    <p><strong className="text-deep-charcoal">Address:</strong> {selectedOrder.full_address}</p>
                    <p><strong className="text-deep-charcoal">PIN & District:</strong> {selectedOrder.pincode} • {selectedOrder.district}, {selectedOrder.state}</p>
                    {selectedOrder.delivery_notes && (
                      <p className="text-krishna-red font-semibold italic mt-1">
                        Note: "{selectedOrder.delivery_notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Ordered Items */}
                <div className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark space-y-3">
                  <span className="font-black text-charcoal-muted uppercase tracking-wider text-[10px] block">
                    Ordered Cattle Feed Bags
                  </span>

                  <div className="divide-y divide-warm-cream-dark">
                    {(selectedOrder.items || []).map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-deep-charcoal block">{item.product_name}</span>
                          <span className="text-[11px] text-charcoal-muted">
                            {item.bag_weight_kg}kg Standard Sack • Qty: <strong>{item.quantity} Bags</strong>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-krishna-red bg-krishna-red/10 px-2 py-0.5 rounded-md inline-block">
                            Rate on WhatsApp
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-warm-cream-dark space-y-1 font-bold text-charcoal-muted text-[11px]">
                    <div className="flex justify-between">
                      <span>Total Sacks:</span>
                      <span className="text-deep-charcoal font-black">{selectedOrder.total_bags} Bags ({selectedOrder.total_bags * 50} kg)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Service:</span>
                      <span className="text-deep-charcoal">
                        Doorstep Farm Delivery
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm font-black text-deep-charcoal pt-1.5 border-t border-warm-cream-dark">
                      <span>Payment & Pricing:</span>
                      <span className="text-krishna-red font-heading font-black">
                        व्हाट्सएप पर चर्चा / Rate on WhatsApp
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Update Form */}
                <form onSubmit={handleUpdateStatus} className="bg-white p-4 rounded-2xl border-2 border-warm-cream-dark space-y-3">
                  <span className="font-black text-charcoal-muted uppercase tracking-wider text-[10px] block">
                    Update Dispatch Status
                  </span>

                  {updateError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200">
                      {updateError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-deep-charcoal">Current Status *</label>
                    <select
                      value={newStatus}
                      onChange={(e: any) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-warm-cream text-xs font-bold cursor-pointer"
                    >
                      <option value="pending">Pending (Order Registered)</option>
                      <option value="confirmed">Confirmed (WhatsApp / Phone Verified)</option>
                      <option value="packed">Packed (Loaded in Tempo)</option>
                      <option value="out_for_delivery">Out for Delivery (On the road to farm)</option>
                      <option value="delivered">Delivered (Unloaded & Paid)</option>
                      <option value="cancelled">Cancelled (Restore Stock to Inventory)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-deep-charcoal">Internal Staff / Driver Note</label>
                    <input
                      type="text"
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="e.g. Driver Raju assigned with Tempo DL-1L"
                      className="w-full px-3 py-2 rounded-xl border border-warm-cream-dark bg-warm-cream text-xs font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-yellow hover:bg-brand-yellow-light text-deep-charcoal font-black rounded-xl shadow-xs transition-colors border border-brand-yellow-dark cursor-pointer disabled:opacity-50"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Status...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Update Order Status</span>
                      </>
                    )}
                  </button>
                </form>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
