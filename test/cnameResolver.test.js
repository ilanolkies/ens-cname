const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry');
const PublicResolver = artifacts.require('@ensdomains/resolver/PublicResolver');
const CnameResolver = artifacts.require('CnameResolver');

const helpers = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const namehash = require('eth-ens-namehash');

contract('cname resolver', async accounts => {
  let ens, resolver, cnameResolver;

  const myetherwallet = namehash.hash('myetherwallet.eth');
  const mew = namehash.hash('mew.eth');

  const CNAME_INTERFACE_ID = web3.utils.sha3('cname(bytes32)').slice(0, 10);

  beforeEach(async () => {
    ens = await ENSRegistry.new();
    resolver = await PublicResolver.new(ens.address);

    await ens.setSubnodeOwner('0x00', web3.utils.sha3('eth'), accounts[0]);
    await ens.setSubnodeOwner(namehash.hash('eth'), web3.utils.sha3('myetherwallet'), accounts[0]);
    await ens.setResolver(myetherwallet, resolver.address);
    await resolver.setAddr(myetherwallet, accounts[1]);

    cnameResolver = await CnameResolver.new(ens.address);
    await ens.setSubnodeOwner(namehash.hash('eth'), web3.utils.sha3('mew'), accounts[0]);
    await ens.setResolver(mew, cnameResolver.address);
  });

  it('should set mew.eth resolver to cname', async () => {
    expect(
      await ens.resolver(mew)
    ).to.eq(cnameResolver.address);
  });

  it('should support cname interface', async () => {
    expect(
      await cnameResolver.supportsInterface(CNAME_INTERFACE_ID)
    ).to.be.true;
  });

  it('should support meta interface', async () => {
    expect(
      await cnameResolver.supportsInterface('0x01ffc9a7')
    ).to.be.true;
  });

  it('should allow owner to set canonical name', async () => {
    await cnameResolver.setCname(mew, myetherwallet);

    expect(
      await cnameResolver.cname(mew)
    ).to.eq(myetherwallet);
  });

  it('should not allow not owner to set canonical name', async () => {
    await ens.setSubnodeOwner(namehash.hash('eth'), web3.utils.sha3('evil'), accounts[2]);

    await helpers.expectRevert.unspecified(
      cnameResolver.setCname(mew, namehash.hash('evil.eth'), { from: accounts[2] })
    );
  });

  it('should query canonical name address resolution', async () => {
    await cnameResolver.setCname(mew, myetherwallet);

    const publicResolver = await PublicResolver.at(cnameResolver.address);
    const addr = await publicResolver.addr(mew);

    expect(addr).to.eq(accounts[1]);
  });
});
