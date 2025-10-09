export interface InvoiceSettlementData {
    payer_hash: string;
    payee_hash: string;
    amount_sats: string | number;
    timestamp: number;
    proof_hash: string;
}

// Simulate Lightning invoice event listener
export const listenForInvoiceSettlement = (
    onPaid: (invoice: InvoiceSettlementData) => void
): (() => void) => {
    // Replace this with real WebSocket or polling logic from your Lightning backend
    const simulate = setTimeout(() => {
        onPaid({
            payer_hash: "0xabc123",
            payee_hash: "0xdef456",
            amount_sats: 50000,
            timestamp: Math.floor(Date.now() / 1000),
            proof_hash: "0xhashofproof",
        });
    }, 10000); // simulate after 10 seconds

    return () => clearTimeout(simulate);
};