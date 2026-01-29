// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./StructLib.sol";

contract RegistreExpedition {
    mapping(string => StructLib.ExpeditionAncrer) private expeditionsAncrers;

    event AncrerLot(string ref, bytes32 rootMerkle, uint256 horodatage);

    // Methodes
    function ancrerLot(string memory _ref, bytes32 _rootMerkle) public {
        require(bytes(_ref).length > 0, "Reference vide.");
        require(_rootMerkle != 0, "Root merkle null.");

        uint256 horodatage = block.timestamp;
        expeditionsAncrers[_ref] = StructLib.ExpeditionAncrer(_ref, _rootMerkle, horodatage);
        
        emit AncrerLot(_ref, _rootMerkle, horodatage);
    }

    // Getters
    function getExpeditionAncrer(string memory _ref) public view returns (StructLib.ExpeditionAncrer memory) {
        require(bytes(_ref).length > 0, "Reference vide");
        return expeditionsAncrers[_ref];
    }
}