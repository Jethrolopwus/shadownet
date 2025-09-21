use starknet::{
    ContractAddress, get_caller_address,
    storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
};
use super::interfaces::{IShadowNetVerifier, IZKVerifier};

/// ShadowNet Verifier Contract
/// Handles ZK proof verification for ShadowNet receipts
#[starknet::contract]
pub mod ShadowNetVerifier {
    use super::{IShadowNetVerifier, IZKVerifier};
    use starknet::{
        ContractAddress, get_caller_address,
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
    };

    #[storage]
    struct Storage {
        zk_verifier: ContractAddress,
        admin: ContractAddress,
        verification_count: felt252,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ProofVerified: ProofVerified,
        VerifierUpdated: VerifierUpdated,
        AdminUpdated: AdminUpdated,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ProofVerified {
        pub proof_hash: felt252,
        pub verifier: ContractAddress,
        pub verification_id: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct VerifierUpdated {
        pub old_verifier: ContractAddress,
        pub new_verifier: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct AdminUpdated {
        pub old_admin: ContractAddress,
        pub new_admin: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, zk_verifier: ContractAddress) {
        self.zk_verifier.write(zk_verifier);
        self.admin.write(get_caller_address());
        self.verification_count.write(0);
    }

    #[abi(embed_v0)]
    impl ShadowNetVerifierImpl of IShadowNetVerifier<ContractState> {
        fn verify_proof(ref self: ContractState, proof: felt252, public_inputs: felt252) -> felt252 {
            // Get ZK verifier contract
            let zk_verifier = self.zk_verifier.read();
            
            // Call ZK verifier
            let dispatcher = IZKVerifierDispatcher { contract_address: zk_verifier };
            let is_valid = dispatcher.verify(proof, public_inputs);
            
            // Increment verification count
            let current_count = self.verification_count.read();
            self.verification_count.write(current_count + 1);
            
            // Emit event
            self.emit(ProofVerified {
                proof_hash: proof,
                verifier: get_caller_address(),
                verification_id: current_count + 1,
            });
            
            is_valid
        }

        fn get_verifier_address(self: @ContractState) -> ContractAddress {
            self.zk_verifier.read()
        }
    }

    /// Admin functions
    #[generate_trait]
    pub impl AdminImpl of AdminTrait {
        fn update_admin(ref self: ContractState, new_admin: ContractAddress) {
            let current_admin = self.admin.read();
            assert(get_caller_address() == current_admin, 'Unauthorized');
            
            self.admin.write(new_admin);
            self.emit(AdminUpdated {
                old_admin: current_admin,
                new_admin,
            });
        }

        fn update_zk_verifier(ref self: ContractState, new_verifier: ContractAddress) {
            let current_admin = self.admin.read();
            assert(get_caller_address() == current_admin, 'Unauthorized');
            
            let old_verifier = self.zk_verifier.read();
            self.zk_verifier.write(new_verifier);
            
            self.emit(VerifierUpdated {
                old_verifier,
                new_verifier,
            });
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }

        fn get_verification_count(self: @ContractState) -> felt252 {
            self.verification_count.read()
        }
    }
}