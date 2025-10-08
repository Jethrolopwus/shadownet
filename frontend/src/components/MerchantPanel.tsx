"use client";

import React, { useState } from "react";
import { getMintInfo, lightningToEcash, ecashToLightning } from "@/lib/cashu";
import { ReceiptMinting, ReceiptHistory } from "./ReceiptMinting";

interface Invoice {
  id: string;
  amount: number; 
  description: string;
  customerEmail: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  btcAddress?: string;
  receiptNftId?: string;

  bolt11?: string;
  lnAmountMsat?: number; 
  lnExpiry?: number; 
  lnStatus?: 'unpaid' | 'settled' | 'expired';
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
  // start light polling
  React.useEffect(() => {
    const id = setInterval(() => {
      void pollLightning();
    }, 4000);
    return () => clearInterval(id);
  }, [invoices]);

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      amount: parseFloat(formData.amount) * 100000000, 
      description: formData.description,
      customerEmail: formData.customerEmail,
      dueDate: formData.dueDate,
      status: 'pending',
      createdAt: new Date().toISOString(),
      btcAddress: generateBtcAddress(),
      ...createMockLightningInvoice(parseFloat(formData.amount))
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setFormData({ amount: '', description: '', customerEmail: '', dueDate: '' });
    setShowCreateForm(false);
  };

  const generateBtcAddress = () => {
    // Mock BTC address generation for demo
    return `bc1q${Math.random().toString(36).substring(2, 42)}`;
  };

  function createMockLightningInvoice(amountBtc: number) {
    // Very lightweight mock of a BOLT11 invoice for demo purposes only
    const msat = Math.round((amountBtc || 0) * 100000000 * 1000);
    const expirySec = Math.floor(Date.now() / 1000) + 15 * 60; 
    const rand = Math.random().toString(36).substring(2, 15);
    const bolt11 = `lnbc${Math.max(1, Math.floor((amountBtc || 0) * 1e8))}n1p${rand}`;
    return {
      bolt11,
      lnAmountMsat: msat,
      lnExpiry: expirySec,
      lnStatus: 'unpaid' as const,
    };
  }

  function formatMsat(msat?: number) {
    if (!msat) return '-';
    return `${(msat / 1000 / 1e8).toFixed(8)} BTC`;
  }

  function isExpired(expiry?: number) {
    if (!expiry) return false;
    return Math.floor(Date.now() / 1000) > expiry;
  }

  async function payWithAtomiq(invoice: Invoice) {
    if (!invoice.bolt11) return;
    try {
      const mintUrl = process.env.NEXT_PUBLIC_CASHU_MINT_URL || 'https://cashu.example';
      await getMintInfo(mintUrl);
      const ecash = await lightningToEcash({ mintUrl, amountMsat: invoice.lnAmountMsat || 0 });
      const redeemed = await ecashToLightning({ mintUrl, ecashToken: ecash.ecashToken, bolt11: invoice.bolt11 });
      if (redeemed.settled) {
        setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, lnStatus: 'settled' } : i));
        setActiveMinting(invoice.id);
      } else {
        alert('Cashu redemption failed');
      }
    } catch (e: any) {
      alert(`Payment failed: ${e?.message || 'unknown error'}`);
    }
  }

  const handleMintingComplete = (receipt: any) => {
    setReceipts(prev => [receipt, ...prev]);
    setActiveMinting(null);
  
    setInvoices(prev => prev.map(invoice => 
      invoice.id === receipt.invoiceId 
        ? { ...invoice, receiptNftId: receipt.tokenId, status: 'paid' as const }
        : invoice
    ));
  };

  const simulatePayment = (invoiceId: string) => {
    setActiveMinting(invoiceId);
  };

  async function pollLightning() {
    const targets = invoices.filter(i => i.bolt11 && i.lnStatus !== 'settled');
    if (targets.length === 0) return;
    for (const inv of targets) {
      try {
        // Prefer Xverse proxy if configured, otherwise fallback to local mock
        let res: any;
        if (process.env.NEXT_PUBLIC_XVERSE_API_BASE) {
          // Example path: replace with actual invoice lookup if your backend keeps a mapping
          res = await fetch(`/api/ln/status?invoiceId=${encodeURIComponent(inv.id)}`).then(r => r.json());
        } else {
          res = await fetch(`/api/ln/status?invoiceId=${encodeURIComponent(inv.id)}`).then(r => r.json());
        }
        if (res?.status === 'settled') {
          setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, lnStatus: 'settled' } : i));
          if (!activeMinting) setActiveMinting(inv.id);
        }
      } catch {}
    }
  }

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
                {/* Lightning Section */}
                {invoice.bolt11 && (
                  <div className="mt-3 space-y-2 p-3 bg-orange-50 border border-orange-200 rounded">
                    <div className="text-sm font-medium text-orange-800">Lightning (Private/Fast)</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600">BOLT11</div>
                        <div className="font-mono text-xs break-all bg-white p-2 rounded border">{invoice.bolt11}</div>
                        <div className="text-xs text-gray-600">Amount: {formatMsat(invoice.lnAmountMsat)}</div>
                        <div className="text-xs text-gray-600">Expiry: {invoice.lnExpiry ? new Date(invoice.lnExpiry * 1000).toLocaleTimeString() : '-'}</div>
                      </div>
                      <div className="flex items-center justify-center">
                        <img
                          alt="BOLT11 QR"
                          className="w-36 h-36 border rounded bg-white"
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(invoice.bolt11)}`}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <button
                        onClick={() => navigator.clipboard.writeText(invoice.bolt11!)}
                        className="px-3 py-1 border rounded text-sm hover:bg-white"
                      >
                        Copy BOLT11
                      </button>
                      <button
                        disabled={isExpired(invoice.lnExpiry)}
                        onClick={() => payWithAtomiq(invoice)}
                        className="px-3 py-1 rounded text-sm text-white bg-black hover:bg-zinc-800 disabled:opacity-60"
                      >
                        Pay with Atomiq
                      </button>
                      {invoice.lnStatus === 'settled' && (
                        <span className="text-xs text-green-700 font-medium">Lightning paid</span>
                      )}
                      {isExpired(invoice.lnExpiry) && (
                        <span className="text-xs text-red-600">Invoice expired</span>
                      )}
                    </div>
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
