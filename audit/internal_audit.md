## Internal audit 

#### Table of contents 

* Token details
* Testing methodology
* Scope of work
* Vulnerabilities
* Summary


#### Contract details

Deployment address: 

#### Testing methodology

During the review process our team ensures that the smart contract was evaluated against security-related issues, code 
quality and adherence to best practices specifications.
 
The methodology consists of the following main steps:

    1) Manual code review
    2) Manual security testing
    3) Automated code review
    4) Automated security testing
        
 During the manual code review, our security teams alongside the developing team is reviewing the smart contract code 
 against known vulnerabilities and adherence to best practice specifications. 
 
 During the manual security testing, the security team is testing the contract code manually, using a combination of 
 manual testing techniques. 
 
 The automated code review is done using third party code review platforms that can identify potential issues during the
 software development process. 
 
 The automated security testing is implemented as part of the negative suite of tests in our internal test suite. 
 
#### Scope of work

The following report contains results for four (4) contract files:

    1) Migrationsl.sol
    2) contracts/AccessToken.sol
    3) contracts/EarlyAccess.sol
    4) contracts/PaymentSubscription.sol
    
#### Vulnerabilities

During the internal audit a number of two (2) vulnerabilities were found. One (1) vulnerabilities was classified as 
a Medium risk and one (1) vulnerabilities was classified as low risk. Vulnerability details can be consulted in the
section below. 

 #### 1. Gas limit in loops.
 
 ##### Description
   Ethereum is a very resource-constrained environment. Prices per computational step are orders of magnitude higher than with centralized providers. Moreover, Ethereum miners impose a limit on the total number of gas consumed in a block. If array.length is large enough, the function exceeds the block gas limit, and transactions calling it will never be confirmed. 
 ##### Mitigation
   The array in  `/contracts/main/PaymentSubscription.sol` has a maximum size of 5 elements thus it cannot be affected by the aforementioned issue. 
 ##### Affected resource 
   The functions `addAdmins` and `removeAdmin` from `/contracts/main/PaymentSubscription.sol`
 
 
 #### 2. Safe math library used. 

 ##### Description
 SafeMath library is found to be used in the contract. This increases gas consumption than traditional methods and validations if done manually.
 Also, Solidity 0.8 includes checked arithmetic operations by default, and this renders SafeMath unnecessary.
 ##### Mitigation
 Theta blockchain gas fees are very low thus this is a false positive. Contracts will be upgraded to the latest version of Solidity long term.
 ##### Affected resource 
 ```
 /contracts/main/PaymentSubscription.sol 
 /contracts/main/EarlyAccess.sol
 ```

#### Summary

The vulnerabilities found during the internal audit do not pose a direct threat to the underlying contract/token operations
and the mitigations in place are considered sufficient for safe deployment.