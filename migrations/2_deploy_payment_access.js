const Payment = artifacts.require('PaymentSubscription.sol');
const EarlyAccess = artifacts.require('EarlyAccess.sol');
//Mainnet vMain Address
const vMainTokenAddress = '0x9587493eaf86bc9ac572da57e6d06c07455106c8';

const Admins = [
    '0x8Eda3d549239D239c99d0daE672231A0B7e29458',
    '0x4193cF8c80a0A30218024670A1948A4558252940',
    '0x88E586b784B74f833E9bd605023474A39220fFd7',
    '0x5205501b988dd9b0b13b3Fa32Fa8c7dFf133A936',
    '0xcDf902Ba1919d275fD084D84CaaC276e890Fb2C6'];

module.exports = async function (deployer) {
    let payment = await deployPayment(deployer);
    await payment.addAdmins(Admins);
    console.log("PaymentSubscription Wallet Admins Set");

    await deployEarlyAccess(deployer);
}

async function deployPayment(deployer){
    await deployer.deploy(Payment);
    let paymentSubscriptionInstance = await Payment.deployed();
    let paymentAddress = await paymentSubscriptionInstance.address;
    console.log("PaymentSubscription address: " + paymentAddress);
    return paymentSubscriptionInstance;
}

async function deployEarlyAccess(deployer){
    const minTokenAmountForWhitelist = web3.utils.toWei('1000');
    await deployer.deploy(EarlyAccess, vMainTokenAddress, minTokenAmountForWhitelist);
    let earlyAccessInstance = await EarlyAccess.deployed();
    let earlyAccessAddress = await earlyAccessInstance.address;
    console.log("EarlyAccess address: " + earlyAccessAddress);
    return earlyAccessInstance;
}