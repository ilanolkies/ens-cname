const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry');
const PublicResolver = artifacts.require('@ensdomains/resolver/PublicResolver');

const { expect } = require('chai');
const namehash = require('eth-ens-namehash');

contract('setup', async accounts => {
  let ens, resolver;

  const myetherwallet = namehash.hash('myetherwallet.eth');

  beforeEach(async () => {
    ens = await ENSRegistry.new();
    resolver = await PublicResolver.new(ens.address);

    await ens.setSubnodeOwner('0x00', web3.utils.sha3('eth'), accounts[0]);
    await ens.setSubnodeOwner(namehash.hash('eth'), web3.utils.sha3('myetherwallet'), accounts[0]);
    await ens.setResolver(myetherwallet, resolver.address);
    await resolver.setAddr(myetherwallet, accounts[1]);
  });

  it('should set myetherwallet.eth owner', async () => {
    expect(
      await ens.owner(myetherwallet)
    ).to.eq(accounts[0]);
  });

  it('should set myetherwallet.eth resolver', async () => {
    expect(
      await ens.resolver(myetherwallet)
    ).to.eq(resolver.address);
  });

  it('should set myetherwallet.eth addr', async () => {
    expect(
      await resolver.addr(myetherwallet)
    ).to.eq(accounts[1]);
  });
});
