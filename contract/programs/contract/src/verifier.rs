
use anchor_lang::prelude::*;
use crate::errors::ShadowNetError;
use crate::types::*;

// ---- Verify Receipt ----
// Mirrors: verifier.cairo + mock_zk_verifier.cairo
// Replace mock_zk_verify() with a real ZK verifier CPI before mainnet
#[derive(Accounts)]
pub struct VerifyReceipt<'info> {
    #[account(
        mut,
        seeds = [b"receipt", receipt.issuer.as_ref(), &receipt.payload_hash],
        bump = receipt.bump,
    )]
    pub receipt: Account<'info, Receipt>,

    pub verifier: Signer<'info>,
}

pub fn verify_receipt(
    ctx: Context<VerifyReceipt>,
    proof: [u8; 64],
) -> Result<()> {
    let receipt = &mut ctx.accounts.receipt;

    require!(!receipt.revoked,  ShadowNetError::Revoked);
    require!(!receipt.verified, ShadowNetError::AlreadyVerified);

    // Mock ZK verifier — mirrors mock_zk_verifier.cairo
    // Rule: first 32 bytes of proof must match payload_hash
    // Swap this for Light Protocol / Groth16 CPI for real ZK proofs
    require!(
        mock_zk_verify(&proof, &receipt.payload_hash),
        ShadowNetError::InvalidProof
    );

    receipt.verified = true;

    emit!(ReceiptVerified {
        receipt:   ctx.accounts.receipt.key(),
        verifier:  ctx.accounts.verifier.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("ShadowNet: receipt verified → {}", ctx.accounts.receipt.key());
    Ok(())
}

/// Mock verifier — mirrors mock_zk_verifier.cairo logic
/// Replace with real ZK proof verification before mainnet
fn mock_zk_verify(proof: &[u8; 64], payload_hash: &[u8; 32]) -> bool {
    proof[..32] == *payload_hash
}
