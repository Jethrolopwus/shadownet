"use client";

import { useState } from "react";

interface VerificationResult {
  id: string;
  timestamp: string;
  type: 'receipt_nft' | 'zk_proof' | 'btc_transaction';
  input: string;
  status: 'valid' | 'invalid' | 'pending' | 'error';
  details: {
    contractAddress?: string;
    tokenId?: string;
    btcTxHash?: string;
    blockHeight?: number;
    amount?: number;
    zkProofId?: string;
    proofValid?: boolean;
    nftExists?: boolean;
    ownershipVerified?: boolean;
  };
  errorMessage?: string;
}

export function VerifierPanel() {
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationInput, setVerificationInput] = useState('');
  const [verificationType, setVerificationType] = useState<'receipt_nft' | 'zk_proof' | 'btc_transaction'>('receipt_nft');

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput.trim()) return;

    setIsVerifying(true);
    
    // Simulate verification process
    const result: VerificationResult = {
      id: `VERIFY-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: verificationType,
      input: verificationInput,
      status: 'pending',
      details: {}
    };

    setVerificationResults(prev => [result, ...prev]);

    // Simulate async verification
    setTimeout(() => {
      const mockResult = generateMockVerificationResult(verificationType, verificationInput);
      setVerificationResults(prev => 
        prev.map(r => r.id === result.id ? { ...r, ...mockResult } : r)
      );
      setIsVerifying(false);
    }, 2000);

    setVerificationInput('');
  };

  const generateMockVerificationResult = (type: string, input: string) => {
    const isSuccess = Math.random() > 0.3; // 70% success rate for demo
    
    switch (type) {
      case 'receipt_nft':
        return {
          status: isSuccess ? 'valid' : 'invalid',
          details: {
            contractAddress: isSuccess ? '0x1234...5678' : undefined,
            tokenId: isSuccess ? `#${Math.floor(Math.random() * 10000)}` : undefined,
            btcTxHash: isSuccess ? `mock_tx_${Math.random().toString(36).substring(2, 15)}` : undefined,
            blockHeight: isSuccess ? Math.floor(Math.random() * 800000) + 700000 : undefined,
            amount: isSuccess ? Math.floor(Math.random() * 100000000) : undefined,
            nftExists: isSuccess,
            ownershipVerified: isSuccess
          },
          errorMessage: isSuccess ? undefined : 'NFT not found or invalid contract address'
        };
      
      case 'zk_proof':
        return {
          status: isSuccess ? 'valid' : 'invalid',
          details: {
            zkProofId: isSuccess ? `proof_${Math.random().toString(36).substring(2, 15)}` : undefined,
            proofValid: isSuccess,
            btcTxHash: isSuccess ? `mock_tx_${Math.random().toString(36).substring(2, 15)}` : undefined,
            amount: isSuccess ? Math.floor(Math.random() * 100000000) : undefined
          },
          errorMessage: isSuccess ? undefined : 'Invalid proof or proof expired'
        };
      
      case 'btc_transaction':
        return {
          status: isSuccess ? 'valid' : 'invalid',
          details: {
            btcTxHash: input,
            blockHeight: isSuccess ? Math.floor(Math.random() * 800000) + 700000 : undefined,
            amount: isSuccess ? Math.floor(Math.random() * 100000000) : undefined
          },
          errorMessage: isSuccess ? undefined : 'Transaction not found or invalid'
        };
      
      default:
        return {
          status: 'error',
          errorMessage: 'Invalid verification type'
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-green-600 bg-green-50 border-green-200';
      case 'invalid': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatAmount = (sats: number) => {
    return (sats / 100000000).toFixed(8);
  };

  return (
    <div className="space-y-6 p-6 border rounded-xl bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Proof Verifier</h2>
        <div className="text-sm text-gray-600">
          Verify receipts, proofs, and transactions
        </div>
      </div>

      {/* Verification Form */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-medium mb-4">Verify Proof</h3>
        <form onSubmit={handleVerification} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Verification Type</label>
            <select
              value={verificationType}
              onChange={(e) => setVerificationType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="receipt_nft">Receipt NFT (Token ID or Contract Address)</option>
              <option value="zk_proof">zkProof ID</option>
              <option value="btc_transaction">BTC Transaction Hash</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {verificationType === 'receipt_nft' && 'Token ID or Contract Address'}
              {verificationType === 'zk_proof' && 'zkProof ID'}
              {verificationType === 'btc_transaction' && 'BTC Transaction Hash'}
            </label>
            <input
              type="text"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              placeholder={
                verificationType === 'receipt_nft' ? 'Enter token ID or contract address...' :
                verificationType === 'zk_proof' ? 'Enter zkProof ID...' :
                'Enter BTC transaction hash...'
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full px-4 py-2 bg-black text-white rounded-md hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Verify Proof'}
          </button>
        </form>
      </div>

      {/* Verification Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Verification Results</h3>
        {verificationResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No verifications performed yet. Enter a proof ID to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {verificationResults.map((result) => (
              <div key={result.id} className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{result.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                      {result.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-600">
                      {result.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="text-sm mb-3">
                  <span className="font-medium">Input:</span>
                  <div className="font-mono text-xs break-all bg-white/50 p-2 rounded mt-1">
                    {result.input}
                  </div>
                </div>

                {result.status === 'valid' && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-800">✓ Verification Successful</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {result.details.contractAddress && (
                        <div>
                          <span className="font-medium">Contract:</span>
                          <div className="font-mono text-xs">{result.details.contractAddress}</div>
                        </div>
                      )}
                      {result.details.tokenId && (
                        <div>
                          <span className="font-medium">Token ID:</span>
                          <div className="font-mono">{result.details.tokenId}</div>
                        </div>
                      )}
                      {result.details.btcTxHash && (
                        <div>
                          <span className="font-medium">BTC Transaction:</span>
                          <div className="font-mono text-xs break-all">{result.details.btcTxHash}</div>
                        </div>
                      )}
                      {result.details.amount && (
                        <div>
                          <span className="font-medium">Amount:</span>
                          <div className="font-mono">{formatAmount(result.details.amount)} BTC</div>
                        </div>
                      )}
                      {result.details.blockHeight && (
                        <div>
                          <span className="font-medium">Block Height:</span>
                          <div className="font-mono">{result.details.blockHeight.toLocaleString()}</div>
                        </div>
                      )}
                      {result.details.zkProofId && (
                        <div>
                          <span className="font-medium">zkProof ID:</span>
                          <div className="font-mono text-xs break-all">{result.details.zkProofId}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                        View on Explorer
                      </button>
                      <button className="px-3 py-1 border border-green-600 text-green-600 rounded text-sm hover:bg-green-50">
                        Download Report
                      </button>
                    </div>
                  </div>
                )}

                {result.status === 'invalid' && (
                  <div className="text-sm text-red-800">
                    <div className="font-medium mb-1">✗ Verification Failed</div>
                    <div>{result.errorMessage}</div>
                  </div>
                )}

                {result.status === 'error' && (
                  <div className="text-sm text-orange-800">
                    <div className="font-medium mb-1">⚠ Verification Error</div>
                    <div>{result.errorMessage}</div>
                  </div>
                )}

                {result.status === 'pending' && (
                  <div className="text-sm text-blue-800">
                    <div className="font-medium mb-1">⏳ Verifying...</div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setVerificationType('receipt_nft');
              setVerificationInput('0x1234...5678');
            }}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-medium">Verify Sample NFT</div>
            <div className="text-sm text-gray-600">Test with mock contract address</div>
          </button>
          
          <button
            onClick={() => {
              setVerificationType('zk_proof');
              setVerificationInput('proof_abc123');
            }}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-medium">Verify Sample Proof</div>
            <div className="text-sm text-gray-600">Test with mock zkProof ID</div>
          </button>
          
          <button
            onClick={() => {
              setVerificationType('btc_transaction');
              setVerificationInput('mock_tx_123456');
            }}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-medium">Verify Sample TX</div>
            <div className="text-sm text-gray-600">Test with mock transaction hash</div>
          </button>
        </div>
      </div>
    </div>
  );
}
