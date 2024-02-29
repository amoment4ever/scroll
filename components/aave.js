const { AAVE_WETH_CONTRACT, AAVE_CONTRACT, AAVE_POOL_V3 } = require('../constants/constants');
const ABI_AAVE = require('../data/abi-aave.json');
const { ERC20Contract } = require('./erc20');

class Aave {
  constructor(web3) {
    this.web3 = web3;

    this.contractAddress = AAVE_CONTRACT;
    this.contract = new this.web3.eth.Contract(ABI_AAVE, this.contractAddress);
    this.aaeveWethToken = new ERC20Contract(this.web3, AAVE_WETH_CONTRACT);
  }

  async getAmountDeposit(address) {
    const amount = await this.aaeveWethToken.getBalance(address);

    return amount;
  }

  deposit(address) {
    return this.contract.methods.depositETH(AAVE_POOL_V3, address, 0);
  }

  withdraw(amount, address) {
    return this.contract.methods.withdrawETH(AAVE_POOL_V3, amount, address);
  }
}

module.exports = {
  Aave,
};
