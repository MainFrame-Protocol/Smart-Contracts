const { expectRevert, constants, time } = require('@openzeppelin/test-helpers');
const Payment = artifacts.require('PaymentSubscription.sol');
const Token = artifacts.require('AccessToken.sol');

const THIRTY_DAYS = time.duration.days(30); 
const SIXTY_DAYS = time.duration.days(60); 

contract('PaymentSubscription', addresses => {
  const [admin, subscriber, _] = addresses;
  let payment, token;

  beforeEach(async () => {
    payment = await Payment.new();
    token = await Token.new(); 
    await token.transfer(subscriber, 1000);
    await token.approve(payment.address, 1000, {from: subscriber});
  });

  it('should create a plan', async () => {
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);
    const plan1 = await payment.plans(0);
    assert(plan1.token === token.address);
    assert(plan1.amount.toString() === '100'); 
    assert(plan1.frequency.toString() === THIRTY_DAYS.toString()); 

    await payment.createPlan("PLATINUM", token.address, 200, SIXTY_DAYS);
    const plan2 = await payment.plans(1);
    assert(plan2.token === token.address);
    assert(plan2.amount.toString() === '200'); 
    assert(plan2.frequency.toString() === SIXTY_DAYS.toString()); 
  });

  it('should NOT create a plan', async () => {
    await expectRevert(
      payment.createPlan("GOLD", constants.ZERO_ADDRESS, 100, THIRTY_DAYS),
      'address cannot be null address'
    );
    await expectRevert(
      payment.createPlan("GOLD", token.address, 0, THIRTY_DAYS),
      'amount needs to be > 0'
    );
    await expectRevert(
      payment.createPlan("GOLD", token.address, 100, 0),
      'frequency needs to be > 0'
    );
  });

  it('should create a subscription', async () => {
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);
    await payment.subscribe(0, {from: subscriber});
    const block = await web3.eth.getBlock('latest')
    const subscription = await payment.subscriptions(subscriber, 0);
    assert(subscription.subscriber === subscriber);
    assert(subscription.start.toString() === block.timestamp.toString());
    assert(subscription.nextPayment.toString() === (block.timestamp + 86400 * 30).toString());
  });
  
  it('should NOT create a subscription', async () => {
    await expectRevert(
      payment.subscribe(0, {from: subscriber}),
      'this plan does not exist'
    );
  });

  it('should subscribe and pay', async () => {
    let balanceSubscriber;
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);

    await payment.subscribe(0, {from: subscriber});
    balanceSubscriber = await token.balanceOf(subscriber); 
    assert(balanceSubscriber.toString() === '900');

    await time.increase(THIRTY_DAYS + 1);
    await payment.pay(subscriber, 0);
    balanceSubscriber = await token.balanceOf(subscriber); 
    assert(balanceSubscriber.toString() === '800');

    await time.increase(THIRTY_DAYS + 1);
    await payment.pay(subscriber, 0);
    balanceSubscriber = await token.balanceOf(subscriber); 
    assert(balanceSubscriber.toString() === '700');
  });

  it('should subscribe and NOT pay', async () => {
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);

    await payment.subscribe(0, {from: subscriber});
    await time.increase(THIRTY_DAYS - 1);
    await expectRevert(
      payment.pay(subscriber, 0),
      'not due yet'
    );
  });

  it('should cancel subscription', async () => {
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);
    await payment.subscribe(0, {from: subscriber});
    await payment.cancel(0, {from: subscriber});
    const subscription = await payment.subscriptions(subscriber, 0);
    assert(subscription.subscriber === constants.ZERO_ADDRESS);
  });

  it('should NOT cancel subscription', async () => {
    await expectRevert(
      payment.cancel(0, {from: subscriber}),
      'this subscription does not exist'
    );
  });

  it('should remove a plan', async () => {

  });

  it('should not remove a plan', async () => {
    
  });
});