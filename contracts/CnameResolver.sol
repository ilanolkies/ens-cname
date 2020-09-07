pragma solidity ^0.5.0;

import "@ensdomains/ens/contracts/ENS.sol";

contract CnameResolver {
  ENS ens;

  mapping(bytes32 => bytes32) public cname;

  constructor(ENS _ens) public {
    ens = _ens;
  }

  function () payable external {
    require(msg.data.length >= 36);

    bytes32 node;

    assembly {
      node := calldataload(4)
    }

    bytes32 canonical = cname[node];
    address resolver = ens.resolver(canonical);

    assembly {
      let ptr := mload(0x40)

      calldatacopy(ptr, 0, 4)
      mstore(add(ptr, 4), canonical)
      if gt(calldatasize, 36) {
        calldatacopy(add(ptr, 36), 36, calldatasize)
      }

      let result := staticcall(gas, resolver, ptr, calldatasize, 0, 0)
      let size := returndatasize
      returndatacopy(ptr, 0, size)

      switch result
      case 0 { revert(ptr, size) }
      default { return(ptr, size) }
    }
  }

  function setCname(bytes32 node, bytes32 canonical) public {
    require(msg.sender == ens.owner(node));
    cname[node] = canonical;
  }
}
