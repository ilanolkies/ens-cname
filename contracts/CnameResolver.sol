pragma solidity ^0.5.0;

import "@ensdomains/ens/contracts/ENS.sol";

contract CnameResolver {
  ENS ens;

  mapping(bytes32 => bytes32) public cname;

  constructor(ENS _ens) public {
    ens = _ens;
  }

  function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
    return (
      interfaceID == this.supportsInterface.selector ||
      interfaceID == this.cname.selector
    );
  }

  function setCname(bytes32 node, bytes32 canonical) public {
    require(msg.sender == ens.owner(node));
    cname[node] = canonical;
  }
}
