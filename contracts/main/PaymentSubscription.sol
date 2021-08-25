//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymentSubscription is Ownable {
    using SafeMath for uint256;

    mapping(address => bool) public isAdmin;

    uint256 public nextPlan;

    struct Plan {
        string planName;
        address token;
        uint256 amount;
        uint256 frequency;
    }

    struct Subscription {
        address subscriber;
        uint256 start;
        uint256 nextPayment;
    }

    mapping(uint256 => Plan) public plans;
    mapping(address => mapping(uint256 => Subscription)) public subscriptions;
  
    event PlanCreated(
        string planName,
        address token,
        uint256 amount,
        uint256 frequency
    );
    event PlanRemoved(
        uint256 planId,
        string planName,
        address token,
        uint256 amount,
        uint256 frequency
    );
    event PlanUpdated(
        uint256 planId,
        string planName,
        address token,
        uint256 amount,
        uint256 frequency
    );
    event SubscriptionCreated(
        address subscriber,
        uint256 planId,
        uint256 date
    );
    event SubscriptionCancelled(
        address subscriber,
        uint256 planId,
        uint256 date
    );
    event PaymentSent(
        address from,
        uint256 amount,
        uint256 planId,
        uint256 date
    );

    function createPlan(string calldata name, address token, uint256 amount, uint256 frequency) external onlyAdmin {
        require(keccak256(abi.encodePacked(name)) != keccak256(abi.encodePacked('')), 'name cannot be empty');
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

    function updatePlan(uint256 planId, string calldata name, address token, uint256 amount, uint256 frequency) external onlyAdmin {
        require(keccak256(abi.encodePacked(name)) != keccak256(abi.encodePacked('')), 'name cannot be empty');
        require(token != address(0), 'address cannot be null address');
        require(amount > 0, 'amount needs to be > 0');
        require(frequency > 0, 'frequency needs to be > 0');

        plans[planId] = Plan(
            name,
            token,
            amount, 
            frequency
        );

        emit PlanUpdated(planId, name, token, amount, frequency);
    }

    function removePlan(uint256 planId) external onlyAdmin {
        Plan storage plan = plans[planId];
        require(plan.token != address(0), 'this plan does not exist');

        delete plans[planId];
        emit PlanRemoved(planId, plan.planName, plan.token, plan.amount, plan.frequency);
    }

    function cancel(uint256 planId) external {
        Subscription storage subscription = subscriptions[msg.sender][planId];

        require(
            subscription.subscriber != address(0), 
            'this subscription does not exist'
        );

        delete subscriptions[msg.sender][planId]; 
        emit SubscriptionCancelled(msg.sender, planId, block.timestamp);
    }


   function subscribe(uint256 planId) external {
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

    function pay(address subscriber, uint256 planId) external {
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