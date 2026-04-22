use anchor_lang::prelude::*;
use crate::errors::ShadowNetError;
use crate::types::*;

// ---- Issue Receipt ----
#[derive(Accounts)]
#[instruction(payload_hash: [u8; 32], recipient: Pubkey)]
pub struct IssueReceipt<'info> {
    #[account(
        init,
        payer = issuer,
        space = Receipt::LEN,
        seeds = [b"receipt", issuer.key().as_ref(), &payload_hash],
        bump
    )]
    pub receipt: Account<'info, Receipt>,

    #[account(mut)]
    pub issuer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn issue_receipt(
    ctx: Context<IssueReceipt>,
    payload_hash: [u8; 32],
    recipient: Pubkey,
) -> Result<()> {
    require!(
        recipient != ctx.accounts.issuer.key(),
        ShadowNetError::InvalidRecipient
    );

    let receipt    = &mut ctx.accounts.receipt;
    let receipt_key = receipt.key();
    let clock      = Clock::get()?;

    receipt.issuer       = ctx.accounts.issuer.key();
    receipt.recipient    = recipient;
    receipt.payload_hash = payload_hash;
    receipt.verified     = false;
    receipt.revoked      = false;
    receipt.timestamp    = clock.unix_timestamp;
    receipt.bump         = ctx.bumps.receipt;

    emit!(ReceiptIssued {
        receipt:      receipt_key,
        issuer:       receipt.issuer,
        recipient:    receipt.recipient,
        payload_hash: receipt.payload_hash,
        timestamp:    receipt.timestamp,
    });

    msg!("ShadowNet: receipt issued → {}", receipt_key);
    Ok(())
}

// ---- Revoke Receipt ----
#[derive(Accounts)]
pub struct RevokeReceipt<'info> {
    #[account(
        mut,
        seeds = [b"receipt", issuer.key().as_ref(), &receipt.payload_hash],
        bump = receipt.bump,
        has_one = issuer @ ShadowNetError::Unauthorized
    )]
    pub receipt: Account<'info, Receipt>,

    pub issuer: Signer<'info>,
}

pub fn revoke_receipt(ctx: Context<RevokeReceipt>) -> Result<()> {
    let receipt = &mut ctx.accounts.receipt;
    require!(!receipt.revoked, ShadowNetError::Revoked);

    receipt.revoked = true;

    emit!(ReceiptRevoked {
        receipt:   ctx.accounts.receipt.key(),
        issuer:    ctx.accounts.issuer.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("ShadowNet: receipt revoked → {}", ctx.accounts.receipt.key());
    Ok(())
}
