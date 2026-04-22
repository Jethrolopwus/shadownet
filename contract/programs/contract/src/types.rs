use anchor_lang::prelude::*;

#[account]
pub struct Receipt {
    pub issuer:       Pubkey,    // 32
    pub recipient:    Pubkey,    // 32
    pub payload_hash: [u8; 32], // 32
    pub verified:     bool,      // 1
    pub revoked:      bool,      // 1
    pub timestamp:    i64,       // 8
    pub bump:         u8,        // 1
}

impl Receipt {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 1 + 1 + 8 + 1; // = 115
}

// ---- Events (mirrors Cairo events) ----
#[event]
pub struct ReceiptIssued {
    pub receipt:      Pubkey,
    pub issuer:       Pubkey,
    pub recipient:    Pubkey,
    pub payload_hash: [u8; 32],
    pub timestamp:    i64,
}

#[event]
pub struct ReceiptVerified {
    pub receipt:   Pubkey,
    pub verifier:  Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ReceiptRevoked {
    pub receipt:   Pubkey,
    pub issuer:    Pubkey,
    pub timestamp: i64,
}