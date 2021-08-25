//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymentSubscription is Ownable {
    using SafeMath for uint256;

    mapping(address => bool) public isAdmin;

    uint public nextPlan;

    struct Plan {
        string planName;
        address token;
        uint amount;
        uint frequency;
    }

    struct Subscription {
        address subscriber;
        uint start;
        uint nextPayment;
    }

    mapping(uint => Plan) public plans;
    mapping(address => mapping(uint => Subscription)) public subscriptions;
  
    event PlanCreated(
        string planName,
        address token,
        uint amount,
        uint frequency
    );
    event PlanRemoved(
        string planName,
        uint planId,
        address token,
        uint amount,
        uint frequency
    );
    event SubscriptionCreated(
        address subscriber,
        uint planId,
        uint date
    );
    event SubscriptionCancelled(
        address subscriber,
        uint planId,
        uint date
    );
    event PaymentSent(
        address from,
        uint amount,
        uint planId,
        uint date
    );

    function createPlan(string calldata name, address token, uint amount, uint frequency) external onlyAdmin {
        require(token != address(0), 'address cannot be null address');
        require(amount > 0, 'amount needs to be > 0');
        require(frequency > 0, 'frequency needs to be > 0');

        plans[nextPlan] = Plan(
            name,
            token,
            amount, 
            frequency
        );

        emit PlanCreated(name, token, amount, frequency);

        nextPlan++;
    }

    function cancel(uint planId) external {
        Subscription storage subscription = subscriptions[msg.sender][planId];

        require(
            subscription.subscriber != address(0), 
            'this subscription does not exist'
        );

        delete subscriptions[msg.sender][planId]; 
        emit SubscriptionCancelled(msg.sender, planId, block.timestamp);
    }

    function removePlan(uint planId) external onlyAdmin {
        Plan storage plan = plans[planId];
        require(plan.token != address(0), 'this plan does not exist');

        delete plans[planId];
        emit PlanRemoved(plan.planName, planId, plan.token, plan.amount, plan.frequency);
    }

   function subscribe(uint planId) external {
        IERC20 token = IERC20(plans[planId].token);
        Plan storage plan = plans[planId];
        require(plan.token != address(0), 'this plan does not exist');

        token.transferFrom(msg.sender, address(this), plan.amount);  

        emit PaymentSent(
            msg.sender, 
            plan.amount, 
            planId, 
            block.timestamp
        );

        subscriptions[msg.sender][planId] = Subscription(
            msg.sender, 
            block.timestamp, 
            block.timestamp + plan.frequency
        );

        emit SubscriptionCreated(msg.sender, planId, block.timestamp);
    }

    function pay(address subscriber, uint planId) external {
        Subscription storage subscription = subscriptions[subscriber][planId];
        Plan storage plan = plans[planId];
        IERC20 token = IERC20(plan.token);

        require(
            subscription.subscriber != address(0), 
            'this subscription does not exist'
        );

        require(
            block.timestamp > subscription.nextPayment,
            'not due yet'
        );

        token.transferFrom(subscriber, address(this), plan.amount);

        emit PaymentSent(
            subscriber,
            plan.amount, 
            planId, 
            block.timestamp
        );
        subscription.nextPayment = subscription.nextPayment + plan.frequency;
    }
    
    function addAdmins(address[] calldata admins) external onlyOwner {
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == address(0)) {
                continue;
            }
            isAdmin[admins[i]] = true;
        }
    }

    function removeAdmins(address[] calldata admins) external onlyOwner {
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == address(0)) {
                continue;
            }
            isAdmin[admins[i]] = false;
            
        }
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender] || super.owner() == msg.sender, "unauthorized");
        _;
    }
}