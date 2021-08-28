const { expectRevert } = require('@openzeppelin/test-helpers');
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
    await token.transfer(subscriber, minTokenAmountForWhitelist);
    const tokenBalance = await token.balanceOf(subscriber);

    assert(tokenBalance == minTokenAmountForWhitelist);

    await earlyAccess.validateWallet({from: subscriber});

    let isUserValidated = await earlyAccess.userIsValidated(subscriber, {from: admin});

    assert(isUserValidated == true);
  });

  it('not enough tokens', async () => {
    const tokenAmount = web3.utils.toWei('999');
    await token.transfer(subscriber, tokenAmount);

    await expectRevert(
      earlyAccess.validateWallet({from: subscriber}),
      "user does not own enough token"
    );
  });

  it('validate user, tranfer tokens then check validation', async () => {
    await token.transfer(subscriber, minTokenAmountForWhitelist);
    let tokenBalance = await token.balanceOf(subscriber);
    assert(tokenBalance == minTokenAmountForWhitelist);

    await earlyAccess.validateWallet({from: subscriber})
    await token.transfer(admin, minTokenAmountForWhitelist, {from: subscriber});
    tokenBalance = await token.balanceOf(subscriber);

    assert(tokenBalance == 0);

    let isUserValidated = await earlyAccess.userIsValidated(subscriber, {from: admin});

    assert(isUserValidated == false);
  });
});