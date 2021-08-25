//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AccessToken.sol";

contract EarlyAccess is Ownable {
    using SafeMath for uint256;

    //the addresses of all validated wallets
    mapping(address => bool) public isValidated;
    //admin wallets allowed to verify which user is validated
    mapping(address => bool) public isAdmin;
    //VMAIN token address
    address public token;
    //Minium VMAIN for a user to be whitelisted 1000000000000000000000;
    uint256 public minTokenAmountForWhitelist;

    event UserValidated(address user);

    constructor(
        address _VMAINAddress,
        uint256 _minTokenAmountForWhitelist
    ) payable {
        token = _VMAINAddress;
        minTokenAmountForWhitelist = _minTokenAmountForWhitelist;
    }

    function validateWallet() external {
        AccessToken tokenInstance = AccessToken(token);

        require(
            tokenInstance.balanceOf(msg.sender) >= minTokenAmountForWhitelist,
            "user does not own enough token"
        );

        isValidated[msg.sender] = true;
        emit UserValidated(msg.sender);
    }

    function userIsValidated(address _user) external view returns (bool) {
        AccessToken tokenInstance = AccessToken(token);

        return isValidated[_user] && tokenInstance.balanceOf(_user) >= minTokenAmountForWhitelist;
    }
}

