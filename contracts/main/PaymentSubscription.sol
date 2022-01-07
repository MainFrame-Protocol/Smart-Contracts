//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymentSubscription is Ownable {
    mapping(address => bool) public isAdmin;

    uint256 public nextPlan;

    //address(0) TFUEL PLAN
    struct Plan {
        string planName;
        address token;
        uint256 amount;
        uint256 frequency;
        uint256 planId;
    }

    struct Subscription {
        address subscriber;
        uint256 start;
        uint256 nextPayment;
    }

    struct SubscribedPlan {
        uint256 planId;
        address token;
    }

    mapping(uint256 => Plan) public plans;
    mapping(address => mapping(uint256 => Subscription)) public subscriptions;
    mapping(address => Plan) public userPlans;
  
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
    event Imburse(
        address imbursePurchaser, 
        uint256 amount
    );

    function createPlan(string calldata name, address token, uint256 amount, uint256 frequency) external onlyAdmin {
        require(keccak256(abi.encodePacked(name)) != keccak256(abi.encodePacked('')), 'name cannot be empty');
        require(amount > 0, 'amount needs to be > 0');
        require(frequency > 0, 'frequency needs to be > 0');

        plans[nextPlan] = Plan(
            name,
            token,
            amount, 
            frequency,
            nextPlan
        );

        emit PlanCreated(name, token, amount, frequency);

        nextPlan++;
    }

    function updatePlan(uint256 planId, string calldata name, address token, uint256 amount, uint256 frequency) external onlyAdmin {
        require(keccak256(abi.encodePacked(name)) != keccak256(abi.encodePacked('')), 'name cannot be empty');
        require(amount > 0, 'amount needs to be > 0');
        require(frequency > 0, 'frequency needs to be > 0');

        plans[planId] = Plan(
            name,
            token,
            amount, 
            frequency,
            planId
        );

        emit PlanUpdated(planId, name, token, amount, frequency);
    }

    function removePlan(uint256 planId) external onlyAdmin {
        Plan storage plan = plans[planId];
        require(plan.amount > 0, 'this plan does not exist');

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
        delete userPlans[msg.sender];

        emit SubscriptionCancelled(msg.sender, planId, block.timestamp);
    }

   function subscribe(uint256 planId) payable external {
        Plan storage plan = plans[planId];
        require(plan.amount > 0, 'this plan does not exist');

        payTokenPlans(plan, msg.sender, msg.value, planId);

        subscriptions[msg.sender][planId] = Subscription(
            msg.sender, 
            block.timestamp, 
            block.timestamp + plan.frequency
        );

        userPlans[msg.sender] = plan;

        emit SubscriptionCreated(msg.sender, planId, block.timestamp);
    }

    function pay(uint256 planId) payable external {
        Subscription storage subscription = subscriptions[msg.sender][planId];
        Plan storage plan = plans[planId];

        require(plan.amount > 0, 'this plan does not exist');
        require(subscription.subscriber == msg.sender, 'this subscription does not exist');

        require(
            block.timestamp > subscription.nextPayment,
            'not due yet'
        );

        payTokenPlans(plan, msg.sender, msg.value, planId);

        subscription.nextPayment = block.timestamp + plan.frequency;
    }

    function payTokenPlans(Plan storage plan, address subscriber, uint256 amount, uint256 planId) internal {
        //Token Plan
        if(plan.token != address(0)){
            IERC20 token = IERC20(plan.token);
            token.transferFrom(subscriber, address(this), plan.amount);  
            token.transfer(super.owner(), token.balanceOf(address(this)));

            //REFUND TFUEL
            if(amount > 0){
                payable(subscriber).transfer(amount);
                emit Imburse(payable(subscriber), amount);
            }
        }
        //TFUEL Plan
        else{
            require(amount >= plan.amount, "Can not send less than plan amount");

            //REFUND TFUEL
            if(amount > plan.amount){
                uint256 reimbureTFUEL = amount - plan.amount;

                payable(subscriber).transfer(reimbureTFUEL);
                emit Imburse(payable(subscriber), reimbureTFUEL);
            }
        }

        emit PaymentSent(
            subscriber,
            plan.amount, 
            planId, 
            block.timestamp
        );        
    }

    function withdrawEther() external onlyOwner {
       payable(super.owner()).transfer(address(this).balance);
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