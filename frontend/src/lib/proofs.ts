import { hash } from "starknet";

export function getProofHashForTxid(txid: string): string {
  if (!txid) throw new Error("Missing txid");

  const hex = txid.startsWith("0x") ? txid.slice(2) : txid;

  const txidHash = hash.computeHashOnElements([
    BigInt("0x" + hex.slice(0, 31)), // first half
    BigInt("0x" + hex.slice(31, 62)), // second half
  ]);

  return txidHash;
    //   const proof = hash.computeHashOnElements([`0x${hex}`]);

    //   return proof;
}
