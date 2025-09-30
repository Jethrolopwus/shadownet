use starknet::ContractAddress;

#[starknet::interface]
pub trait IShadowNetReceipt<TContractState> {
    fn submit_receipt(
        ref self: TContractState,
        payer_hash: felt252,
        payee_hash: felt252,
        amount_sats: felt252,
        timestamp: felt252,
        proof_hash: felt252
    );
    
    fn verify_receipt(ref self: TContractState, receipt_id: felt252, proof: felt252);
    
    fn get_receipt(self: @TContractState, receipt_id: felt252) -> (
        payer_hash: felt252,
        payee_hash: felt252,
        amount_sats: felt252,
        timestamp: felt252,
        verified: felt252
    );
    
    fn get_receipt_count(self: @TContractState) -> felt252;
    
    fn is_receipt_verified(self: @TContractState, receipt_id: felt252) -> felt252;
}

#[starknet::interface]
pub trait IShadowNetVerifier<TContractState> {
    fn verify_proof(ref self: TContractState, proof: felt252, public_inputs: felt252) -> felt252;
    
    fn get_verifier_address(self: @TContractState) -> ContractAddress;
}

#[starknet::interface]
pub trait IZKVerifier<TContractState> {
    fn verify(ref self: TContractState, proof: felt252, public_inputs: felt252) -> felt252;
}