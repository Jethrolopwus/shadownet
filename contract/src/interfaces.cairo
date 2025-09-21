use starknet::ContractAddress;

/// Interface for ShadowNet Receipt contract
#[starknet::interface]
pub trait IShadowNetReceipt<TContractState> {
    /// Submit a receipt with BTC transaction details and ZK proof hash
    fn submit_receipt(
        ref self: TContractState,
        payer_hash: felt252,
        payee_hash: felt252,
        amount_sats: felt252,
        timestamp: felt252,
        proof_hash: felt252
    );
    
    /// Verify a receipt using ZK proof
    fn verify_receipt(ref self: TContractState, receipt_id: felt252, proof: felt252);
    
    /// Get receipt details by ID
    fn get_receipt(self: @TContractState, receipt_id: felt252) -> (
        payer_hash: felt252,
        payee_hash: felt252,
        amount_sats: felt252,
        timestamp: felt252,
        verified: felt252
    );
    
    /// Get total number of receipts
    fn get_receipt_count(self: @TContractState) -> felt252;
    
    /// Check if a receipt is verified
    fn is_receipt_verified(self: @TContractState, receipt_id: felt252) -> felt252;
}

/// Interface for ShadowNet Verifier contract
#[starknet::interface]
pub trait IShadowNetVerifier<TContractState> {
    /// Verify a ZK proof
    fn verify_proof(ref self: TContractState, proof: felt252, public_inputs: felt252) -> felt252;
    
    /// Get verifier address
    fn get_verifier_address(self: @TContractState) -> ContractAddress;
}

/// Interface for ZK Proof verification
#[starknet::interface]
pub trait IZKVerifier<TContractState> {
    /// Verify a ZK proof with public inputs
    fn verify(ref self: TContractState, proof: felt252, public_inputs: felt252) -> felt252;
}