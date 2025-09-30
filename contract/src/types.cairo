use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
pub struct ReceiptData {
    pub payer_btc_address: felt252,
    pub payee_btc_address: felt252,
    pub amount_sats: felt252,
    pub timestamp: felt252,
    pub proof_hash: felt252,
    pub verified: felt252,
}

pub const RECEIPT_PENDING: felt252 = 0;
pub const RECEIPT_VERIFIED: felt252 = 1;
pub const RECEIPT_INVALID: felt252 = 2;

pub const ERROR_INVALID_RECEIPT_ID: felt252 = 'Invalid receipt ID';
pub const ERROR_RECEIPT_ALREADY_VERIFIED: felt252 = 'Receipt already verified';
pub const ERROR_INVALID_PROOF: felt252 = 'Invalid proof';
pub const ERROR_INVALID_AMOUNT: felt252 = 'Invalid amount';
pub const ERROR_INVALID_TIMESTAMP: felt252 = 'Invalid timestamp';
pub const ERROR_UNAUTHORIZED: felt252 = 'Unauthorized access';

pub fn validate_receipt_data(
    payer_hash: felt252,
    payee_hash: felt252,
    amount_sats: felt252,
    timestamp: felt252,
    proof_hash: felt252,
) -> bool {
    let payer_valid = payer_hash != 0;
    let payee_valid = payee_hash != 0;
    let proof_valid = proof_hash != 0;

    let amount_valid = amount_sats > 0;

    let current_time = starknet::get_block_timestamp();
    let future_limit = current_time + 3600;
    let timestamp_valid = timestamp > 0 && timestamp <= future_limit;

    payer_valid && payee_valid && proof_valid && amount_valid && timestamp_valid
}

pub fn create_receipt_data(
    payer_btc_address: felt252,
    payee_btc_address: felt252,
    amount_sats: felt252,
    timestamp: felt252,
    proof_hash: felt252,
) -> ReceiptData {
    ReceiptData {
        payer_btc_address,
        payee_btc_address,
        amount_sats,
        timestamp,
        proof_hash,
        verified: RECEIPT_PENDING,
    }
}
