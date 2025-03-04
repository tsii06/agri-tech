// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContratProxy {
    address public implementation;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function updateImplementation(address _newImplementation) public {
        implementation = _newImplementation;
    }

    fallback() external payable {
        address impl = implementation;
        require(impl != address(0), "Implementation contract not set");

        assembly {
            let ptr := mload(0x40) // allouer de l'espace memoire pour l'appel.
            calldatacopy(ptr, 0, calldatasize()) // Copier les donnees de l'appel dans la memoire.

            let result := delegatecall(gas(), impl, ptr, calldatasize(), 0, 0) // appel l'implementation via delegatecall
            let size := returndatasize()
            returndatacopy(ptr, 0, size) // copier la reponse de l'appel

            // retourne ou annule l'execution selon le resultat
            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }

    receive() external payable {}
}