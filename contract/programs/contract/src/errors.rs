use anchor_lang::prelude::*;

#[error_code]
pub enum ShadowNetError {
    #[msg("ZK proof verification failed — proof does not match payload hash")]
    InvalidProof,
    #[msg("This receipt has already been verified")]
    AlreadyVerified,
    #[msg("This receipt has been revoked and is no longer valid")]
    Revoked,
    #[msg("Unauthorized: only the original issuer can perform this action")]
    Unauthorized,
    #[msg("Recipient address cannot be the same as the issuer")]
    InvalidRecipient,
}