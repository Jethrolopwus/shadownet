use starknet::{
    ContractAddress, get_caller_address, get_block_timestamp,
    storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
};
use super::interfaces::{IShadowNetReceipt, IZKVerifier};
use super::types::{ReceiptData, create_receipt_data, validate_receipt_data, RECEIPT_PENDING, RECEIPT_VERIFIED, ERROR_INVALID_RECEIPT_ID, ERROR_RECEIPT_ALREADY_VERIFIED, ERROR_INVALID_PROOF, ERROR_INVALID_AMOUNT};

/// ShadowNet Receipt Contract
/// Handles BTC payment receipt submission, verification, and management
#[starknet::contract]
pub mod ShadowNetReceipt {
    use super::{
        IShadowNetReceipt, IZKVerifier, ReceiptData, create_receipt_data, 
        validate_receipt_data, RECEIPT_PENDING, RECEIPT_VERIFIED,
        ERROR_INVALID_RECEIPT_ID, ERROR_RECEIPT_ALREADY_VERIFIED, 
        ERROR_INVALID_PROOF, ERROR_INVALID_AMOUNT
    };
    use starknet::{
        ContractAddress, get_caller_address, get_block_timestamp,
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
    };

    #[storage]
    struct Storage {
        receipt_counter: felt252,
        receipts: Map<felt252, ReceiptData>,
        verifier_contract: ContractAddress,
        admin: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ReceiptSubmitted: ReceiptSubmitted,
        ReceiptVerified: ReceiptVerified,
        AdminUpdated: AdminUpdated,
        VerifierUpdated: VerifierUpdated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ReceiptSubmitted {
        pub receipt_id: felt252,
        pub payer_hash: felt252,
        pub payee_hash: felt252,
        pub amount_sats: felt252,
        pub timestamp: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ReceiptVerified {
        pub receipt_id: felt252,
        pub verifier: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AdminUpdated {
        pub old_admin: ContractAddress,
        pub new_admin: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct VerifierUpdated {
        pub old_verifier: ContractAddress,
        pub new_verifier: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, verifier_contract: ContractAddress) {
        self.receipt_counter.write(0);
        self.verifier_contract.write(verifier_contract);
        self.admin.write(get_caller_address());
    }

    #[abi(embed_v0)]
    impl ShadowNetReceiptImpl of IShadowNetReceipt<ContractState> {
        fn submit_receipt(
            ref self: ContractState,
            payer_hash: felt252,
            payee_hash: felt252,
            amount_sats: felt252,
            timestamp: felt252,
            proof_hash: felt252
        ) {
            // Validate receipt data
            assert(validate_receipt_data(payer_hash, payee_hash, amount_sats, timestamp, proof_hash), ERROR_INVALID_AMOUNT);
            
            // Get next receipt ID
            let current_id = self.receipt_counter.read();
            let new_id = current_id + 1;
            
            // Create receipt data
            let receipt_data = create_receipt_data(payer_hash, payee_hash, amount_sats, timestamp, proof_hash);
            
            // Store receipt
            self.receipts.write(new_id, receipt_data);
            self.receipt_counter.write(new_id);
            
            // Emit event
            self.emit(ReceiptSubmitted {
                receipt_id: new_id,
                payer_hash,
                payee_hash,
                amount_sats,
                timestamp,
            });
        }

        fn verify_receipt(ref self: ContractState, receipt_id: felt252, proof: felt252) {
            // Check if receipt exists
            let receipt = self.receipts.read(receipt_id);
            assert(receipt.payer_btc_address != 0, ERROR_INVALID_RECEIPT_ID);
            
            // Check if already verified
            assert(receipt.verified != RECEIPT_VERIFIED, ERROR_RECEIPT_ALREADY_VERIFIED);
            
            // Get verifier contract
            let verifier_contract = self.verifier_contract.read();
            
            // Call ZK verifier
            let dispatcher = IZKVerifierDispatcher { contract_address: verifier_contract };
            let public_inputs = receipt.proof_hash;
            let is_valid = dispatcher.verify(proof, public_inputs);
            
            // Verify proof is valid
            assert(is_valid == 1, ERROR_INVALID_PROOF);
            
            // Update receipt as verified
            let mut updated_receipt = receipt;
            updated_receipt.verified = RECEIPT_VERIFIED;
            self.receipts.write(receipt_id, updated_receipt);
            
            // Emit event
            self.emit(ReceiptVerified {
                receipt_id,
                verifier: get_caller_address(),
            });
        }

        fn get_receipt(self: @ContractState, receipt_id: felt252) -> (
            payer_hash: felt252,
            payee_hash: felt252,
            amount_sats: felt252,
            timestamp: felt252,
            verified: felt252
        ) {
            let receipt = self.receipts.read(receipt_id);
            assert(receipt.payer_btc_address != 0, ERROR_INVALID_RECEIPT_ID);
            
            (
                receipt.payer_btc_address,
                receipt.payee_btc_address,
                receipt.amount_sats,
                receipt.timestamp,
                receipt.verified
            )
        }

        fn get_receipt_count(self: @ContractState) -> felt252 {
            self.receipt_counter.read()
        }

        fn is_receipt_verified(self: @ContractState, receipt_id: felt252) -> felt252 {
            let receipt = self.receipts.read(receipt_id);
            if receipt.payer_btc_address == 0 {
                return 0; // Receipt doesn't exist
            };
            receipt.verified
        }
    }

    /// Admin functions
    #[generate_trait]
    pub impl AdminImpl of AdminTrait {
        fn update_admin(ref self: ContractState, new_admin: ContractAddress) {
            let current_admin = self.admin.read();
            assert(get_caller_address() == current_admin, 'Unauthorized');
            
            self.admin.write(new_admin);
            self.emit(AdminUpdated {
                old_admin: current_admin,
                new_admin,
            });
        }

        fn update_verifier(ref self: ContractState, new_verifier: ContractAddress) {
            let current_admin = self.admin.read();
            assert(get_caller_address() == current_admin, 'Unauthorized');
            
            let old_verifier = self.verifier_contract.read();
            self.verifier_contract.write(new_verifier);
            
            self.emit(VerifierUpdated {
                old_verifier,
                new_verifier,
            });
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }

        fn get_verifier(self: @ContractState) -> ContractAddress {
            self.verifier_contract.read()
        }
    }
}