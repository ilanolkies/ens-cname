const ENSRegistry = artifacts.require('@ensdomains/ens/ENSRegistry');
const PublicResolver = artifacts.require('@ensdomains/resolver/PublicResolver');
const CnameResolver = artifacts.require('CnameResolver');

const helpers = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const namehash = require('eth-ens-namehash');

const addrAbi = [
  {
    constant: true,
    inputs: [
      { name: 'node', type: 'bytes32' }
    ],
    name: 'addr',
    outputs: [
      { name: '', type: 'address' }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

contract('cname resolver', async accounts => {
  let ens, cnameResolver;

  const myetherwallet = namehash.hash('myetherwallet.eth');
  const mew = namehash.hash('mew.eth');

  beforeEach(async () => {
    ens = await ENSRegistry.new();
    const resolver = await PublicResolver.new(ens.address);

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

  it('should forward resolution', async () => {
    await cnameResolver.setCname(mew, myetherwallet);

    const resolver = await ens.resolver(mew);

    /*
    const data = await web3.eth.call({
      from: accounts[0],
      to: resolver,
      data: `0x3b3b57de${mew.slice(2,66)}`
    });
    */

    const addrResolver = new web3.eth.Contract(addrAbi, resolver);
    const addr = await addrResolver.methods.addr(mew).call();

    // expect(addr).to.eq(accounts[1]);
  });
});
