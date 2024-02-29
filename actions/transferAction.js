const { logger } = require('../utils/logger');

async function transferAction(web3, fromAddress, toAddress, chain) {
  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = 21000; // Стандартный лимит газа для транзакции ETH

  const balance = await web3.eth.getBalance(fromAddress);

  const value = web3.utils.toBN(balance).sub(web3.utils.toBN(gasPrice).mul(web3.utils.toBN(gasLimit)));

  const tx = {
    from: fromAddress,
    to: toAddress,
    value,
    gas: gasLimit,
    gasPrice,
  };

  const data = await web3.eth.sendTransaction(tx);

  logger.info('Transfer to okx', {
    txHash: data.transactionHash,
    chain,
  });
}

module.exports = {
  transferAction,
};
