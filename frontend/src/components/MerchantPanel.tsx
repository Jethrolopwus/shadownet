"use client";

import { useState } from "react";
import { ReceiptMinting, ReceiptHistory } from "./ReceiptMinting";

interface Invoice {
  id: string;
  amount: number; // in sats
  description: string;
  customerEmail: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  btcAddress?: string;
  receiptNftId?: string;
}

export function MerchantPanel() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeMinting, setActiveMinting] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    customerEmail: '',
    dueDate: ''
  });

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      amount: parseFloat(formData.amount) * 100000000, // Convert BTC to sats
      description: formData.description,
      customerEmail: formData.customerEmail,
      dueDate: formData.dueDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
      btcAddress: generateBtcAddress() // Mock BTC address generation
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setFormData({ amount: '', description: '', customerEmail: '', dueDate: '' });
    setShowCreateForm(false);
  };

  const generateBtcAddress = () => {
    // Mock BTC address generation for demo
    return `bc1q${Math.random().toString(36).substring(2, 42)}`;
  };

  const handleMintingComplete = (receipt: any) => {
    setReceipts(prev => [receipt, ...prev]);
    setActiveMinting(null);
    
    // Update invoice with receipt NFT ID
    setInvoices(prev => prev.map(invoice => 
      invoice.id === receipt.invoiceId 
        ? { ...invoice, receiptNftId: receipt.tokenId, status: 'paid' as const }
        : invoice
    ));
  };

  const simulatePayment = (invoiceId: string) => {
    setActiveMinting(invoiceId);
  };

  const formatAmount = (sats: number) => {
    return (sats / 100000000).toFixed(8);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="space-y-6 p-6 border rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Merchant Dashboard</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800 transition-colors"
        >
          Create Invoice
        </button>
      </div>

      {/* Create Invoice Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-white bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (BTC)</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Customer Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800"
                >
                  Create Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Recent Invoices</h3>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No invoices created yet. Create your first invoice to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{invoice.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-lg font-semibold">{formatAmount(invoice.amount)} BTC</span>
                </div>
                <div className="text-sm text-gray-600 mb-2">{invoice.description}</div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Customer:</span> {invoice.customerEmail}
                  </div>
                  <div>
                    <span className="font-medium">Due:</span> {new Date(invoice.dueDate).toLocaleDateString()}
                  </div>
                </div>
                {invoice.btcAddress && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                    <span className="font-medium">Payment Address:</span>
                    <div className="font-mono text-xs break-all">{invoice.btcAddress}</div>
                  </div>
                )}
                {invoice.receiptNftId && (
                  <div className="mt-2 p-2 bg-green-100 rounded text-sm">
                    <span className="font-medium text-green-800">Receipt NFT:</span>
                    <div className="font-mono text-xs text-green-700">{invoice.receiptNftId}</div>
                  </div>
                )}
                {invoice.status === 'pending' && (
                  <div className="mt-2">
                    <button
                      onClick={() => simulatePayment(invoice.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Simulate Payment
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Minting */}
      {activeMinting && (
        <div className="mt-6">
          <ReceiptMinting
            invoiceId={activeMinting}
            amount={invoices.find(inv => inv.id === activeMinting)?.amount || 0}
            btcTxHash={`mock_tx_${Math.random().toString(36).substring(2, 15)}`}
            onMintingComplete={handleMintingComplete}
          />
        </div>
      )}

      {/* Receipt History */}
      {receipts.length > 0 && (
        <div className="mt-8">
          <ReceiptHistory receipts={receipts} />
        </div>
      )}
    </div>
  );
}
