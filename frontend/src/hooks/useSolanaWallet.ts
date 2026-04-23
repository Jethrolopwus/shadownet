"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type SendOptions,
} from "@solana/web3.js";
import { Buffer } from "buffer";

type SolanaPublicKeyLike = {
  toString: () => string;
  toBytes?: () => Uint8Array;
};

type SolanaProvider = {
  isPhantom?: boolean;
  publicKey?: SolanaPublicKeyLike | null;
  isConnected?: boolean;
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey?: SolanaPublicKeyLike }>;
  disconnect: () => Promise<void>;
  signMessage?: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array }>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  sendTransaction?: (transaction: Transaction, connection: Connection, options?: SendOptions) => Promise<string>;
  on?: (event: "connect" | "disconnect" | "accountChanged", handler: (...args: unknown[]) => void) => void;
  off?: (event: "connect" | "disconnect" | "accountChanged", handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    solana?: SolanaProvider;
  }
}

const DEFAULT_PROGRAM_ID = "BFBhJ97pvs6iFpBx8jjjrUteTeLjc6eag67ZbMRL25v7";
const ISSUE_RECEIPT_NAMESPACE = "global:issue_receipt";

export type SolanaTransferResult = {
  signature: string;
  slot: number | null;
  explorerUrl: string;
};

export type SolanaIssueReceiptResult = {
  signature: string;
  slot: number | null;
  explorerUrl: string;
  receiptPda: string;
  payloadHashHex: string;
  programId: string;
};

export type DecodedReceiptAccount = {
  receiptPda: string;
  issuer: string;
  recipient: string;
  payloadHashHex: string;
  verified: boolean;
  revoked: boolean;
  timestamp: number;
  bump: number;
};

export type VerifyReceiptResult = {
  decoded: DecodedReceiptAccount;
  checks: {
    accountDiscriminatorMatches: boolean;
    ownerMatchesProgram: boolean;
    issuerMatchesExpected?: boolean;
    recipientMatchesExpected?: boolean;
    payloadHashMatchesExpected?: boolean;
    revokedIsFalse: boolean;
  };
};

export type SolanaVerifyReceiptResult = {
  signature: string;
  slot: number | null;
  explorerUrl: string;
  receiptPda: string;
};

export type SolanaRevokeReceiptResult = {
  signature: string;
  slot: number | null;
  explorerUrl: string;
  receiptPda: string;
};

export type SolanaWalletState = {
  connected: boolean;
  publicKey: string | null;
  walletName: string;
  supportsSignMessage: boolean;
  supportsSendTransaction: boolean;
  programId: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  sendDevnetTransfer: (recipient: string, lamports: number) => Promise<SolanaTransferResult>;
  issueReceiptOnDevnet: (paymentSignature: string, recipient: string) => Promise<SolanaIssueReceiptResult>;
  verifyReceiptOnDevnet: (receiptPda: string, paymentSignature: string) => Promise<SolanaVerifyReceiptResult>;
  revokeReceiptOnDevnet: (receiptPda: string) => Promise<SolanaRevokeReceiptResult>;
  verifyReceiptPdaOnDevnet: (args: {
    receiptPda: string;
    expectedIssuer?: string;
    expectedRecipient?: string;
    expectedPaymentSignature?: string;
  }) => Promise<VerifyReceiptResult>;
};

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return window.btoa(binary);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  return "";
}

function bytesToHex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

async function sha256Bytes(data: Uint8Array): Promise<Uint8Array> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("crypto.subtle is not available in this environment.");
  }
  const safeBuffer = new Uint8Array(data.byteLength);
  safeBuffer.set(data);
  const digest = await crypto.subtle.digest("SHA-256", safeBuffer.buffer);
  return new Uint8Array(digest);
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

async function anchorDiscriminator(namespace: string): Promise<Uint8Array> {
  return (await sha256Bytes(new TextEncoder().encode(namespace))).slice(0, 8);
}

async function sendAndConfirm(
  provider: SolanaProvider,
  connection: Connection,
  transaction: Transaction,
  blockhash: string,
  lastValidBlockHeight: number
): Promise<SolanaTransferResult> {
  let signature = "";

  if (provider.sendTransaction) {
    signature = await provider.sendTransaction(transaction, connection, {
      preflightCommitment: "confirmed",
    });
  } else if (provider.signTransaction) {
    const signed = await provider.signTransaction(transaction);
    signature = await connection.sendRawTransaction(signed.serialize(), {
      preflightCommitment: "confirmed",
    });
  } else {
    throw new Error("Connected wallet does not support transaction sending.");
  }

  const confirmed = await connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    "confirmed"
  );

  if (confirmed.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmed.value.err)}`);
  }

  const status = await connection.getSignatureStatus(signature, {
    searchTransactionHistory: true,
  });

  return {
    signature,
    slot: status.value?.slot ?? null,
    explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
  };
}

export function useSolanaWallet(): SolanaWalletState {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const provider = useMemo(() => {
    if (typeof window === "undefined") return null;
    return window.solana ?? null;
  }, []);

  const programId = process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || DEFAULT_PROGRAM_ID;

  const syncPublicKey = useCallback(() => {
    const key = provider?.publicKey?.toString() ?? null;
    setPublicKey(key);
  }, [provider]);

  const connect = useCallback(async () => {
    if (!provider) {
      throw new Error("No Solana wallet detected. Install Phantom or another wallet extension.");
    }

    const result = await provider.connect();
    const nextKey = result.publicKey?.toString() ?? provider.publicKey?.toString() ?? null;
    setPublicKey(nextKey);
  }, [provider]);

  const disconnect = useCallback(async () => {
    if (!provider) return;
    await provider.disconnect();
    setPublicKey(null);
  }, [provider]);

  const signMessage = useCallback(
    async (message: string) => {
      if (!provider) {
        throw new Error("No Solana wallet detected.");
      }
      if (!provider.signMessage) {
        throw new Error("Connected wallet does not support message signing.");
      }

      const encoded = new TextEncoder().encode(message);
      const signed = await provider.signMessage(encoded, "utf8");
      return bytesToBase64(signed.signature);
    },
    [provider]
  );

  const sendDevnetTransfer = useCallback(
    async (recipient: string, lamports: number): Promise<SolanaTransferResult> => {
      if (!provider) {
        throw new Error("No Solana wallet detected.");
      }

      const sender = provider.publicKey?.toString();
      if (!sender) {
        throw new Error("Connect your wallet before sending.");
      }

      if (!Number.isInteger(lamports) || lamports <= 0) {
        throw new Error("Lamports must be a positive integer.");
      }

      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const fromPubkey = new PublicKey(sender);
      const toPubkey = new PublicKey(recipient);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

      const transaction = new Transaction({
        feePayer: fromPubkey,
        recentBlockhash: blockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );

      return sendAndConfirm(provider, connection, transaction, blockhash, lastValidBlockHeight);
    },
    [provider]
  );

  const issueReceiptOnDevnet = useCallback(
    async (paymentSignature: string, recipient: string): Promise<SolanaIssueReceiptResult> => {
      if (!provider) {
        throw new Error("No Solana wallet detected.");
      }

      const issuer = provider.publicKey?.toString();
      if (!issuer) {
        throw new Error("Connect your wallet before issuing a receipt.");
      }

      const issuerPubkey = new PublicKey(issuer);
      const recipientPubkey = new PublicKey(recipient);
      const programPubkey = new PublicKey(programId);

      if (issuerPubkey.equals(recipientPubkey)) {
        throw new Error("Recipient cannot be the same as issuer.");
      }

      const payloadHash = await sha256Bytes(new TextEncoder().encode(paymentSignature));
      const discriminator = await anchorDiscriminator(ISSUE_RECEIPT_NAMESPACE);

      const ixData = concatBytes(discriminator, payloadHash, recipientPubkey.toBytes());

      const [receiptPda] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("receipt"), issuerPubkey.toBytes(), payloadHash],
        programPubkey
      );

      const instruction = new TransactionInstruction({
        programId: programPubkey,
        keys: [
          { pubkey: receiptPda, isSigner: false, isWritable: true },
          { pubkey: issuerPubkey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(ixData),
      });

      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

      const transaction = new Transaction({
        feePayer: issuerPubkey,
        recentBlockhash: blockhash,
      }).add(instruction);

      const sent = await sendAndConfirm(provider, connection, transaction, blockhash, lastValidBlockHeight);

      return {
        ...sent,
        receiptPda: receiptPda.toBase58(),
        payloadHashHex: bytesToHex(payloadHash),
        programId,
      };
    },
    [programId, provider]
  );

  const verifyReceiptOnDevnet = useCallback(
    async (receiptPda: string, paymentSignature: string): Promise<SolanaVerifyReceiptResult> => {
      if (!provider) {
        throw new Error("No Solana wallet detected.");
      }

      const verifier = provider.publicKey?.toString();
      if (!verifier) {
        throw new Error("Connect your wallet before verifying a receipt.");
      }

      const proofSeed = await sha256Bytes(new TextEncoder().encode(paymentSignature));
      const proof = concatBytes(proofSeed, proofSeed);
      const discriminator = await anchorDiscriminator("global:verify_receipt");

      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const verifierPubkey = new PublicKey(verifier);
      const programPubkey = new PublicKey(programId);
      const receiptPubkey = new PublicKey(receiptPda);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

      const transaction = new Transaction({
        feePayer: verifierPubkey,
        recentBlockhash: blockhash,
      }).add(
        new TransactionInstruction({
          programId: programPubkey,
          keys: [
            { pubkey: receiptPubkey, isSigner: false, isWritable: true },
            { pubkey: verifierPubkey, isSigner: true, isWritable: false },
          ],
          data: Buffer.from(concatBytes(discriminator, proof)),
        })
      );

      const sent = await sendAndConfirm(provider, connection, transaction, blockhash, lastValidBlockHeight);
      return {
        ...sent,
        receiptPda,
      };
    },
    [programId, provider]
  );

  const revokeReceiptOnDevnet = useCallback(
    async (receiptPda: string): Promise<SolanaRevokeReceiptResult> => {
      if (!provider) {
        throw new Error("No Solana wallet detected.");
      }

      const issuer = provider.publicKey?.toString();
      if (!issuer) {
        throw new Error("Connect your wallet before revoking a receipt.");
      }

      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const issuerPubkey = new PublicKey(issuer);
      const programPubkey = new PublicKey(programId);
      const receiptPubkey = new PublicKey(receiptPda);
      const discriminator = await anchorDiscriminator("global:revoke_receipt");
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

      const transaction = new Transaction({
        feePayer: issuerPubkey,
        recentBlockhash: blockhash,
      }).add(
        new TransactionInstruction({
          programId: programPubkey,
          keys: [
            { pubkey: receiptPubkey, isSigner: false, isWritable: true },
            { pubkey: issuerPubkey, isSigner: true, isWritable: false },
          ],
          data: Buffer.from(discriminator),
        })
      );

      const sent = await sendAndConfirm(provider, connection, transaction, blockhash, lastValidBlockHeight);
      return {
        ...sent,
        receiptPda,
      };
    },
    [programId, provider]
  );

  const verifyReceiptPdaOnDevnet = useCallback(
    async ({
      receiptPda,
      expectedIssuer,
      expectedRecipient,
      expectedPaymentSignature,
    }: {
      receiptPda: string;
      expectedIssuer?: string;
      expectedRecipient?: string;
      expectedPaymentSignature?: string;
    }): Promise<VerifyReceiptResult> => {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const programPubkey = new PublicKey(programId);
      const receiptPubkey = new PublicKey(receiptPda);

      const info = await connection.getAccountInfo(receiptPubkey, "confirmed");
      if (!info) {
        throw new Error("Receipt PDA account was not found on devnet.");
      }

      if (info.data.length < 115) {
        throw new Error(`Unexpected receipt account size: ${info.data.length}`);
      }

      const expectedDiscriminator = await anchorDiscriminator("account:Receipt");
      const actualDiscriminator = info.data.slice(0, 8);
      const accountDiscriminatorMatches =
        expectedDiscriminator.length === actualDiscriminator.length &&
        expectedDiscriminator.every((byte, i) => byte === actualDiscriminator[i]);

      const issuer = new PublicKey(info.data.slice(8, 40)).toBase58();
      const recipient = new PublicKey(info.data.slice(40, 72)).toBase58();
      const payloadHashBytes = info.data.slice(72, 104);
      const payloadHashHex = bytesToHex(payloadHashBytes);
      const verified = info.data[104] !== 0;
      const revoked = info.data[105] !== 0;
      const timestampView = new DataView(info.data.buffer, info.data.byteOffset + 106, 8);
      const timestamp = Number(timestampView.getBigInt64(0, true));
      const bump = info.data[114];

      const expectedPayloadHashHex = expectedPaymentSignature
        ? bytesToHex(await sha256Bytes(new TextEncoder().encode(expectedPaymentSignature)))
        : undefined;

      return {
        decoded: {
          receiptPda,
          issuer,
          recipient,
          payloadHashHex,
          verified,
          revoked,
          timestamp,
          bump,
        },
        checks: {
          accountDiscriminatorMatches,
          ownerMatchesProgram: info.owner.equals(programPubkey),
          issuerMatchesExpected: expectedIssuer ? issuer === expectedIssuer : undefined,
          recipientMatchesExpected: expectedRecipient ? recipient === expectedRecipient : undefined,
          payloadHashMatchesExpected: expectedPayloadHashHex ? payloadHashHex === expectedPayloadHashHex : undefined,
          revokedIsFalse: !revoked,
        },
      };
    },
    [programId]
  );

  useEffect(() => {
    if (!provider) return;

    const handleConnect = () => syncPublicKey();
    const handleDisconnect = () => setPublicKey(null);
    const handleAccountChanged = () => syncPublicKey();

    provider.on?.("connect", handleConnect);
    provider.on?.("disconnect", handleDisconnect);
    provider.on?.("accountChanged", handleAccountChanged);

    syncPublicKey();

    return () => {
      provider.off?.("connect", handleConnect);
      provider.off?.("disconnect", handleDisconnect);
      provider.off?.("accountChanged", handleAccountChanged);
    };
  }, [provider, syncPublicKey]);

  return {
    connected: !!publicKey,
    publicKey,
    walletName: provider?.isPhantom ? "Phantom" : "Solana Wallet",
    supportsSignMessage: !!provider?.signMessage,
    supportsSendTransaction: !!provider?.sendTransaction || !!provider?.signTransaction,
    programId,
    connect,
    disconnect,
    signMessage,
    sendDevnetTransfer,
    issueReceiptOnDevnet,
    verifyReceiptOnDevnet,
    revokeReceiptOnDevnet,
    verifyReceiptPdaOnDevnet,
  };
}
