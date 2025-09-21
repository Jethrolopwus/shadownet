use starknet::{
    ContractAddress, get_caller_address,
    storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
};

/// Simple ShadowNet Receipt Contract
/// A minimal implementation for MVP
#[starknet::contract]
pub mod SimpleShadowNetReceipt {
    use starknet::{
        ContractAddress, get_caller_address,
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
    };

    #[storage]
    struct Storage {
        receipt_counter: felt252,
        payer_hashes: Map<felt252, felt252>,
        payee_hashes: Map<felt252, felt252>,
        amounts: Map<felt252, felt252>,
        timestamps: Map<felt252, felt252>,
        proof_hashes: Map<felt252, felt252>,
        verified: Map<felt252, felt252>,
        admin: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ReceiptSubmitted: ReceiptSubmitted,
        ReceiptVerified: ReceiptVerified,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ReceiptSubmitted {
        pub receipt_id: felt252,
        pub payer_hash: felt252,
        pub payee_hash: felt252,
        pub amount_sats: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ReceiptVerified {
        pub receipt_id: felt252,
        pub verifier: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.receipt_counter.write(0);
        self.admin.write(get_caller_address());
    }

    /// Submit a receipt with BTC transaction details
    #[external(v0)]
    fn submit_receipt(
        ref self: ContractState,
        payer_hash: felt252,
        payee_hash: felt252,
        amount_sats: felt252,
        timestamp: felt252,
        proof_hash: felt252
    ) {
        // Basic validation
        assert(payer_hash != 0, 'Invalid payer hash');
        assert(payee_hash != 0, 'Invalid payee hash');
        assert(amount_sats > 0, 'Invalid amount');
        assert(proof_hash != 0, 'Invalid proof hash');
        
        // Get next receipt ID
        let current_id = self.receipt_counter.read();
        let new_id = current_id + 1;
        
        // Store receipt data
        self.payer_hashes.write(new_id, payer_hash);
        self.payee_hashes.write(new_id, payee_hash);
        self.amounts.write(new_id, amount_sats);
        self.timestamps.write(new_id, timestamp);
        self.proof_hashes.write(new_id, proof_hash);
        self.verified.write(new_id, 0); // 0 = pending
        
        // Update counter
        self.receipt_counter.write(new_id);
        
        // Emit event
        self.emit(ReceiptSubmitted {
            receipt_id: new_id,
            payer_hash,
            payee_hash,
            amount_sats,
        });
    }

    /// Verify a receipt (simplified - just marks as verified)
    #[external(v0)]
    fn verify_receipt(ref self: ContractState, receipt_id: felt252) {
        // Check if receipt exists
        let payer_hash = self.payer_hashes.read(receipt_id);
        assert(payer_hash != 0, 'Receipt does not exist');
        
        // Check if already verified
        let is_verified = self.verified.read(receipt_id);
        assert(is_verified == 0, 'Receipt already verified');
        
        // Mark as verified
        self.verified.write(receipt_id, 1);
        
        // Emit event
        self.emit(ReceiptVerified {
            receipt_id,
            verifier: get_caller_address(),
        });
    }

    /// Get receipt details
    #[external(v0)]
    fn get_receipt(self: @ContractState, receipt_id: felt252) -> (
        payer_hash: felt252,
        payee_hash: felt252,
        amount_sats: felt252,
        timestamp: felt252,
        verified: felt252
    ) {
        let payer_hash = self.payer_hashes.read(receipt_id);
        assert(payer_hash != 0, 'Receipt does not exist');
        
        (
            payer_hash,
            self.payee_hashes.read(receipt_id),
            self.amounts.read(receipt_id),
            self.timestamps.read(receipt_id),
            self.verified.read(receipt_id)
        )
    }

    /// Get total number of receipts
    #[external(v0)]
    fn get_receipt_count(self: @ContractState) -> felt252 {
        self.receipt_counter.read()
    }

    /// Check if a receipt is verified
    #[external(v0)]
    fn is_receipt_verified(self: @ContractState, receipt_id: felt252) -> felt252 {
        let payer_hash = self.payer_hashes.read(receipt_id);
        if payer_hash == 0 {
            return 0; // Receipt doesn't exist
        };
        self.verified.read(receipt_id)
    }

    /// Admin function to update admin
    #[external(v0)]
    fn update_admin(ref self: ContractState, new_admin: ContractAddress) {
        let current_admin = self.admin.read();
        assert(get_caller_address() == current_admin, 'Unauthorized');
        self.admin.write(new_admin);
    }
}
