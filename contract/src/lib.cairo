
#[starknet::contract]
pub mod ShadowNetReceipt {
    use starknet::{
        ContractAddress, get_caller_address,
        storage::{StoragePointerReadAccess, StoragePointerWriteAccess}
    };

    #[storage]
    struct Storage {
        receipt_counter: felt252,
        admin: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ReceiptSubmitted: ReceiptSubmitted,
        ReceiptVerified: ReceiptVerified,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ReceiptSubmitted {
        pub receipt_id: felt252,
        pub payer_hash: felt252,
        pub payee_hash: felt252,
        pub amount_sats: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ReceiptVerified {
        pub receipt_id: felt252,
        pub verifier: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.receipt_counter.write(0);
        self.admin.write(get_caller_address());
    }

    #[external(v0)]
    fn submit_receipt(
        ref self: ContractState,
        payer_hash: felt252,
        payee_hash: felt252,
        amount_sats: felt252,
        timestamp: felt252,
        proof_hash: felt252
    ) {
      
        assert(payer_hash != 0, 'Invalid payer hash');
        assert(payee_hash != 0, 'Invalid payee hash');
        assert(amount_sats != 0, 'Invalid amount');
        assert(proof_hash != 0, 'Invalid proof hash');
        
        let current_id = self.receipt_counter.read();
        let new_id = current_id + 1;
        
        self.receipt_counter.write(new_id);
        
        self.emit(ReceiptSubmitted {
            receipt_id: new_id,
            payer_hash,
            payee_hash,
            amount_sats,
        });
    }

    #[external(v0)]
    fn verify_receipt(ref self: ContractState, receipt_id: felt252) {
        self.emit(ReceiptVerified {
            receipt_id,
            verifier: get_caller_address(),
        });
    }

    #[external(v0)]
    fn get_receipt_count(self: @ContractState) -> felt252 {
        self.receipt_counter.read()
    }

    #[external(v0)]
    fn update_admin(ref self: ContractState, new_admin: ContractAddress) {
        let current_admin = self.admin.read();
        assert(get_caller_address() == current_admin, 'Unauthorized');
        self.admin.write(new_admin);
    }
}