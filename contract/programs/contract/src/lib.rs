
use anchor_lang::prelude::*;

pub mod errors;
pub mod types;
pub mod receipt;
pub mod verifier;

use receipt::*;
use verifier::*;

declare_id!("BFBhJ97pvs6iFpBx8jjjrUteTeLjc6eag67ZbMRL25v7");

#[program]
pub mod contract {
    use super::*;

    /// Issue a new on-chain receipt PDA
    /// Mirrors: receipt.cairo → issue_receipt()
    pub fn issue_receipt(
        ctx: Context<IssueReceipt>,
        payload_hash: [u8; 32],
        recipient: Pubkey,
    ) -> Result<()> {
        receipt::issue_receipt(ctx, payload_hash, recipient)
    }

    /// Verify a receipt using a ZK proof
    /// Mirrors: verifier.cairo + mock_zk_verifier.cairo
    pub fn verify_receipt(
        ctx: Context<VerifyReceipt>,
        proof: [u8; 64],
    ) -> Result<()> {
        verifier::verify_receipt(ctx, proof)
    }

    /// Revoke a receipt — issuer only
    /// Mirrors: receipt.cairo → revoke_receipt()
    pub fn revoke_receipt(ctx: Context<RevokeReceipt>) -> Result<()> {
        receipt::revoke_receipt(ctx)
    }
}
