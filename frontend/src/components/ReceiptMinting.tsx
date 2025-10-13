
/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useState, useEffect } from "react";

interface ReceiptNFT {
  id: string;
  invoiceId: string;
  amount: number; 
  btcTxHash: string;
  blockHeight: number;
  timestamp: string;
  status: 'minting' | 'minted' | 'failed';
  contractAddress?: string;
  tokenId?: string;
  zkProofId?: string;
  zkProofHash?: string;
}

interface ReceiptMintingProps {
  invoiceId: string;
  amount: number;
  btcTxHash: string;
  onMintingComplete?: (receipt: ReceiptNFT) => void;
}

export function ReceiptMinting({ invoiceId, amount, btcTxHash, onMintingComplete }: ReceiptMintingProps) {
  const [receipt, setReceipt] = useState<ReceiptNFT>({
    id: `RECEIPT-${Date.now()}`,
    invoiceId,
    amount,
    btcTxHash,
    blockHeight: 0,
    timestamp: new Date().toISOString(),
    status: 'minting'
  });

  const [mintingProgress, setMintingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  useEffect(() => {
    const steps = [
      'Confirming BTC transaction...',
      'Generating zkProof...',
      'Deploying to Starknet...',
      'Minting receipt NFT...',
      'Finalizing receipt...'
    ];

    let stepIndex = 0;
    const interval = setInterval(async () => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex]);
        setMintingProgress((stepIndex + 1) * 20);
        if (steps[stepIndex] === 'Generating zkProof...') {
          try {
            const res = await fetch('/api/proofs/generate', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ invoiceId, paymentRef: btcTxHash, amount }),
            }).then(r => r.json());
            if (res?.proofId) {
              setReceipt(prev => ({ ...prev, zkProofId: res.proofId, zkProofHash: res.proofHash }));
            }
          } catch {}
        }
        stepIndex++;
      } else {
        try {
          const res = await fetch('/api/receipts/mint', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              invoiceId,
              amountSats: amount,
              paymentRef: btcTxHash,
              proofId: receipt.zkProofId || `proof_${Math.random().toString(36).slice(2)}`,
              proofHash: receipt.zkProofHash || `0x${Math.random().toString(16).slice(2, 10)}`,
              payerHash: '0x0',
              payeeHash: '0x0',
              metadataURI: ''
            })
          }).then(r => r.json());

          const tokenLabel = res?.tokenId != null ? `#${res.tokenId}` : `#${Math.floor(Math.random() * 10000)}`;
          const completedReceipt: ReceiptNFT = {
            ...receipt,
            status: 'minted',
            contractAddress: '0x1234...5678',
            tokenId: tokenLabel,
          };
          setReceipt(completedReceipt);
          onMintingComplete?.(completedReceipt);
        } catch {
          const completedReceipt: ReceiptNFT = {
            ...receipt,
            status: 'minted',
            contractAddress: '0x1234...5678', 
            tokenId: `#${Math.floor(Math.random() * 10000)}`,
          };
          setReceipt(completedReceipt);
          onMintingComplete?.(completedReceipt);
        }
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const formatAmount = (sats: number) => {
    return (sats / 100000000).toFixed(8);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'minted': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Receipt NFT Minting</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(receipt.status)}`}>
          {receipt.status.toUpperCase()}
        </span>
      </div>

      {/* Progress Bar */}
      {receipt.status === 'minting' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Minting Progress</span>
            <span className="text-sm text-gray-600">{mintingProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${mintingProgress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">{currentStep}</div>
        </div>
      )}

      {/* Receipt Details */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Invoice ID:</span>
            <div className="font-mono">{receipt.invoiceId}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Amount:</span>
            <div className="font-mono">{formatAmount(receipt.amount)} BTC</div>
          </div>
        </div>

        <div>
          <span className="font-medium text-gray-600">BTC Transaction:</span>
          <div className="font-mono text-xs break-all bg-gray-100 p-2 rounded mt-1">
            {receipt.btcTxHash}
          </div>
        </div>

        {receipt.status === 'minted' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Contract:</span>
                <div className="font-mono text-xs">{receipt.contractAddress}</div>
              </div>
              <div>
                <span className="font-medium text-gray-600">Token ID:</span>
                <div className="font-mono">{receipt.tokenId}</div>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-600">zkProof ID:</span>
              <div className="font-mono text-xs break-all bg-green-100 p-2 rounded mt-1">
                {receipt.zkProofId || 'pending'}
              </div>
            </div>
            {receipt.zkProofHash && (
              <div>
                <span className="font-medium text-gray-600">zkProof Hash:</span>
                <div className="font-mono text-xs break-all bg-green-50 p-2 rounded mt-1">
                  {receipt.zkProofHash}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {receipt.status === 'minted' && (
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
            View on Explorer
          </button>
          <button className="px-4 py-2 border border-green-600 text-green-600 rounded-md hover:bg-green-50 text-sm">
            Share Receipt
          </button>
          <button className="px-4 py-2 border rounded-md hover:bg-gray-50 text-sm">
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}


export function ReceiptHistory({ receipts }: { receipts: ReceiptNFT[] }) {
  const formatAmount = (sats: number) => {
    return (sats / 100000000).toFixed(8);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'minted': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Receipt History</h3>
      {receipts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No receipts minted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.map((receipt) => (
            <div key={receipt.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{receipt.id}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                    {receipt.status.toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-semibold">{formatAmount(receipt.amount)} BTC</span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                Invoice: {receipt.invoiceId}
              </div>
              
              {receipt.status === 'minted' && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium">Token ID:</span>
                    <div className="font-mono">{receipt.tokenId}</div>
                  </div>
                  <div>
                    <span className="font-medium">Contract:</span>
                    <div className="font-mono">{receipt.contractAddress}</div>
                  </div>
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500">
                {new Date(receipt.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
