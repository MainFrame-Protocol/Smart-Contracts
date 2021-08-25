const { expectRevert, constants, time } = require('@openzeppelin/test-helpers');
const EarlyAccess = artifacts.require('EarlyAccess.sol');
const Token = artifacts.require('AccessToken.sol');

contract('EarlyAccess', addresses => {
  const [admin, subscriber, _] = addresses;
  const minTokenAmountForWhitelist = web3.utils.toWei('1000');
  
  let earlyAccess, token;

  beforeEach(async () => {
    token = await Token.new(); 
    earlyAccess = await EarlyAccess.new(token.address, minTokenAmountForWhitelist);
  });

  it('validate user and check validation', async () => {

  });

  it('user should not validate', async () => {
    
  });
});