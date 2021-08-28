const { expectRevert, constants, time } = require('@openzeppelin/test-helpers');
const Payment = artifacts.require('PaymentSubscription.sol');
const Token = artifacts.require('AccessToken.sol');

const THIRTY_DAYS = time.duration.days(30); 
const SIXTY_DAYS = time.duration.days(60); 
const ONE_SECOND = time.duration.seconds(1); 

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

    await payment.createPlan("GOLD", constants.ZERO_ADDRESS, 1, THIRTY_DAYS);
    const plan12 = await payment.plans(1);
    assert(plan12.token === constants.ZERO_ADDRESS);
    assert(plan12.amount.toString() === '1'); 
    assert(plan12.frequency.toString() === THIRTY_DAYS.toString()); 

    await payment.createPlan("PLATINUM", token.address, 200, SIXTY_DAYS);
    const plan2 = await payment.plans(2);
    assert(plan2.token === token.address);
    assert(plan2.amount.toString() === '200'); 
    assert(plan2.frequency.toString() === SIXTY_DAYS.toString()); 

    await payment.createPlan("PLATINUM", constants.ZERO_ADDRESS, 2, SIXTY_DAYS);
    const plan22 = await payment.plans(3);
    assert(plan22.token === constants.ZERO_ADDRESS);
    assert(plan22.amount.toString() === '2'); 
    assert(plan22.frequency.toString() === SIXTY_DAYS.toString()); 
  });

  it('should NOT create a plan', async () => {
    await expectRevert(
      payment.createPlan("", constants.ZERO_ADDRESS, 100, THIRTY_DAYS),
      'name cannot be empty'
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

  it('should remove a plan', async () => {
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);
    let plan1 = await payment.plans(0);
    assert(plan1.token === token.address);
    assert(plan1.amount.toString() === '100'); 
    assert(plan1.frequency.toString() === THIRTY_DAYS.toString()); 

    await payment.removePlan(0);
    plan1 = await payment.plans(0);
    assert(plan1.token === '0x0000000000000000000000000000000000000000');
  });

  it('should NOT remove a plan', async () => {
    await expectRevert(
        payment.removePlan(0),
        'this plan does not exist'
      );
  });

  it('should update a plan', async () => {
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);
    let plan1 = await payment.plans(0);
    assert(plan1.token === token.address);
    assert(plan1.amount.toString() === '100'); 
    assert(plan1.frequency.toString() === THIRTY_DAYS.toString()); 

    await payment.updatePlan(0, "PLATINUM", token.address, 200, SIXTY_DAYS);
    plan1 = await payment.plans(0);
    assert(plan1.token === token.address);
    assert(plan1.amount.toString() === '200'); 
    assert(plan1.frequency.toString() === SIXTY_DAYS.toString()); 
  });

  it('should NOT update a plan', async () => {
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);

    await expectRevert(
        payment.updatePlan(0, "", constants.ZERO_ADDRESS, 100, THIRTY_DAYS),
        'name cannot be empty'
      );
      await expectRevert(
        payment.updatePlan(0, "GOLD", token.address, 0, THIRTY_DAYS),
        'amount needs to be > 0'
      );
      await expectRevert(
        payment.updatePlan(0, "GOLD", token.address, 100, 0),
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
    await payment.pay(0, {from: subscriber});
    balanceSubscriber = await token.balanceOf(subscriber); 
    assert(balanceSubscriber.toString() === '800');

    let balance0Before = await web3.eth.getBalance(subscriber);
    await time.increase(THIRTY_DAYS + 1);
    await payment.pay(0, {from: subscriber, value: "500"});
    balanceSubscriber = await web3.eth.getBalance(subscriber);
    assert(balance0Before - balanceSubscriber > 1305060000006144 && balance0Before - balanceSubscriber < 1505060000006144);
    balanceSubscriber = await token.balanceOf(subscriber); 
    assert(balanceSubscriber.toString() === '700');

    balance0Before = await web3.eth.getBalance(subscriber);
    await payment.createPlan("GOLD", constants.ZERO_ADDRESS, 100, THIRTY_DAYS);
    await payment.subscribe(1, {from: subscriber, value: "100"});
    balanceSubscriber = await web3.eth.getBalance(subscriber);

    assert(balance0Before - balanceSubscriber > 2168260000006144 && balance0Before - balanceSubscriber < 2368260000006144);

    balance0Before = await web3.eth.getBalance(subscriber);
    await time.increase(THIRTY_DAYS + 1);
    await payment.pay(1, {from: subscriber, value: "100"});
    balanceSubscriber = await web3.eth.getBalance(subscriber);

    assert(balance0Before - balanceSubscriber > 703520000008192 && balance0Before - balanceSubscriber < 793520000008192);

    balance0Before = await web3.eth.getBalance(subscriber);
    await time.increase(THIRTY_DAYS + 1);
    await payment.pay(1, {from: subscriber, value: "300"});
    balanceSubscriber = await web3.eth.getBalance(subscriber);

    assert(balance0Before - balanceSubscriber > 907259999985664 && balance0Before - balanceSubscriber < 997259999985664);
  });

  it('should subscribe and NOT pay', async () => {
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);

    await payment.subscribe(0, {from: subscriber});
    await time.increase(THIRTY_DAYS - 1);
    await expectRevert(
      payment.pay(0, {from: subscriber}),
      'not due yet'
    );

    await payment.createPlan("GOLD", constants.ZERO_ADDRESS, 100, THIRTY_DAYS);

    await payment.subscribe(1, {from: subscriber, value: "100"});
    await time.increase(THIRTY_DAYS - 1);
    await expectRevert(
      payment.pay(1, {from: subscriber, value: "300"}),
      'not due yet'
    );
  });

  it('should NOT pay, inexistent plan', async () => {
    await expectRevert(
      payment.pay(0, {from: subscriber}),
      'this plan does not exist'
    );
  });

  it('should NOT pay, inexistent subscription', async () => {
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);
    await expectRevert(
      payment.pay(0, {from: subscriber}),
      'this subscription does not exist'
    );
  });

  it('should cancel subscription', async () => {
    await payment.createPlan("GOLD", token.address, 100, THIRTY_DAYS);
    await payment.subscribe(0, {from: subscriber});
    await payment.cancel(0, {from: subscriber});
    let subscription = await payment.subscriptions(subscriber, 0);
    assert(subscription.subscriber === constants.ZERO_ADDRESS);

    await payment.createPlan("GOLD", constants.ZERO_ADDRESS, 100, THIRTY_DAYS);
    await payment.subscribe(1, {from: subscriber, value: "100"});
    await payment.cancel(1, {from: subscriber});
    subscription = await payment.subscriptions(subscriber, 1);
    assert(subscription.subscriber === constants.ZERO_ADDRESS);
  });

  it('should NOT cancel subscription', async () => {
    await expectRevert(
      payment.cancel(0, {from: subscriber}),
      'this subscription does not exist'
    );
  });
});