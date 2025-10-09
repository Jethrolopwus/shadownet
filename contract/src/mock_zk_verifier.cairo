use super::interfaces::IZKVerifier;

#[starknet::contract]
pub mod MockZKVerifier {
    use super::IZKVerifier;
    use starknet::{
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
    };

    #[storage]
    struct Storage {
        verification_count: felt252,
        valid_proofs: Map<felt252, felt252>, 
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ProofVerified: ProofVerified,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ProofVerified {
        pub proof_hash: felt252,
        pub public_inputs: felt252,
        pub is_valid: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.verification_count.write(0);
    }

    #[abi(embed_v0)]
    impl MockZKVerifierImpl of IZKVerifier<ContractState> {
        fn verify(ref self: ContractState, proof: felt252, public_inputs: felt252) -> felt252 {

            let current_count = self.verification_count.read();
            self.verification_count.write(current_count + 1);
            
            let is_valid = self._simulate_verification(proof, public_inputs);
            
       
            self.valid_proofs.write(proof, is_valid);
            
            self.emit(ProofVerified {
                proof_hash: proof,
                public_inputs,
                is_valid,
            });
            
            is_valid
        }
    }

    #[generate_trait]
    pub impl InternalImpl of InternalTrait {
        fn _simulate_verification(self: @ContractState, proof: felt252, public_inputs: felt252) -> felt252 {
         
            if proof == 0 || public_inputs == 0 {
                return 0;
            };
            
            if proof == public_inputs {
                return 0;
            };
            
            if proof > public_inputs {
                return 1;
            };
            
            0
        }

        fn get_verification_count(self: @ContractState) -> felt252 {
            self.verification_count.read()
        }

        fn is_proof_valid(self: @ContractState, proof: felt252) -> felt252 {
            self.valid_proofs.read(proof)
        }
    }
}