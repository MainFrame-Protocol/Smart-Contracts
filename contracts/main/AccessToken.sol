//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract AccessToken is ERC20 {
  constructor() ERC20('AccessToken', 'TKN') {
    _mint(msg.sender, 1000);
  }
}