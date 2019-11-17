const Migrations = artifacts.require('Migrations');
const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry');
const PublicResolver = artifacts.require('@ensdomains/resolver/PublicResolver');
const namehash = require('eth-ens-namehash');
const utils = require('web3-utils');

module.exports = function(deployer, network, accounts) {
  if (network == 'develop') {
    let ens, resolver;

    deployer.deploy(Migrations)
    .then(() => {
      return deployer.deploy(ENSRegistry);
    })
    .then(_ens => {
      ens = _ens;
      return deployer.deploy(PublicResolver, ens.address);
    }).then(_resolver => {
      resolver = _resolver;
      return ens.setSubnodeOwner('0x00', utils.sha3('eth'), accounts[0]);
    })
    .then(() => {
      return ens.setSubnodeOwner(namehash.hash('eth'), utils.sha3('myetherwallet'), accounts[0]);
    })
    .then(() => {
      return ens.setResolver(namehash.hash('myetherwallet.eth'), resolver.address);
    })
    .then(() => {
      return resolver.setAddr(namehash.hash('myetherwallet.eth'), accounts[1]);
    });
  }
};
