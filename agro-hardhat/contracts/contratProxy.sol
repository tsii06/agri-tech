// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContratProxy {
    // EIP-1967 storage slot: keccak256("eip1967.proxy.implementation") - 1
    bytes32 private constant IMPLEMENTATION_SLOT = 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc;

    constructor(address _implementation) {
        assembly {
            sstore(IMPLEMENTATION_SLOT, _implementation) // stocke l'adresse de l'implementation dans le slot EIP-1967
        }
    }

    /// Permet de mettre à jour l'adresse de l'implémentation
    function updateImplementation(address _newImpl) external {
        require(_newImpl.code.length > 0, "Invalid address");

        assembly {
            sstore(IMPLEMENTATION_SLOT, _newImpl)
        }
    }

    fallback() external payable {
        assembly {
            let impl := sload(IMPLEMENTATION_SLOT)

            // Check si impl est address(0)
            if iszero(impl) {
                // Revert avec un message minimaliste (car on est en assembly)
                mstore(0x00, "NoImpl")
                revert(0x00, 6)
            }

            // Copie les données d'appel
            calldatacopy(0, 0, calldatasize())

            // Appel délégué à l'implémentation
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)

            // Copie les données de retour
            returndatacopy(0, 0, returndatasize())

            // Revert ou return selon le résultat
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }


    receive() external payable {}
}