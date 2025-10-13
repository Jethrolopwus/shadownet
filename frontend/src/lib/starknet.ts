/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */



export const STARKNET_CONFIG = {
  network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'testnet',
  rpcUrl: process.env.NEXT_PUBLIC_STARKNET_RPC || 'https://starknet-testnet.public.blastapi.io/rpc/v0_7',
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '',
};

export const MOCK_VERIFIER_ABI = [
  {
    "type": "function",
    "name": "verify",
    "inputs": [
      { "name": "proof", "type": "felt252" },
      { "name": "public_inputs", "type": "felt252" }
    ],
    "outputs": [
      { "name": "result", "type": "felt252" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "get_verification_count",
    "inputs": [],
    "outputs": [
      { "name": "count", "type": "felt252" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "is_proof_valid",
    "inputs": [
      { "name": "proof", "type": "felt252" }
    ],
    "outputs": [
      { "name": "is_valid", "type": "felt252" }
    ],
    "stateMutability": "view"
  }
];

export function getProvider(): any {
  return {
    nodeUrl: STARKNET_CONFIG.rpcUrl,

  };
}


export function getContract(provider: any): any {
  if (!STARKNET_CONFIG.contractAddress) {
    throw new Error('Contract address not set. Deploy contract first.');
  }

  return {
    address: STARKNET_CONFIG.contractAddress,
    abi: MOCK_VERIFIER_ABI,

  };
}


export class ShadowNetContract {
  private contract: any;
  private provider: any;

  constructor(provider: any, contractAddress: string) {
    this.provider = provider;
    this.contract = {
      address: contractAddress,
      abi: MOCK_VERIFIER_ABI,
    };
  }


  async verifyProof(proof: string, publicInputs: string): Promise<boolean> {
    try {

      console.log('Mock verification:', { proof, publicInputs });

      if (!proof || !publicInputs || proof === publicInputs) {
        return false;
      }

      return proof > publicInputs;
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }

  async getVerificationCount(): Promise<number> {
    try {
      return Math.floor(Math.random() * 100);
    } catch (error) {
      console.error('Failed to get verification count:', error);
      return 0;
    }
  }

  async isProofValid(proof: string): Promise<boolean> {
    try {
      return proof.length > 0 && proof !== '0';
    } catch (error) {
      console.error('Failed to check proof validity:', error);
      return false;
    }
  }
  async verifyProofWithAccount(account: any, proof: string, publicInputs: string): Promise<boolean> {
    try {

      console.log('Mock transaction:', { account, proof, publicInputs });


      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error('Proof verification transaction failed:', error);
      return false;
    }
  }
}


export function formatFelt(felt: string): string {
  return felt.startsWith('0x') ? felt : `0x${felt}`;
}

export function parseFelt(felt: string): string {
  return felt.startsWith('0x') ? felt.slice(2) : felt;
}
