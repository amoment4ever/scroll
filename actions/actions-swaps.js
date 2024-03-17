const { default: BigNumber } = require('bignumber.js');
const { ERC20Contract } = require('../components/erc20');
const { SyncSwap } = require('../components/syncswap');
const {
  USDC_TOKEN_ADDRESS, ZERO_ADDRESS, WETH_TOKEN_CONTRACT, SYNCSWAP_ROUTER_CONTRACT, INFINITY_APPROVE, USDT_TOKEN_ADDRESS,
} = require('../constants/constants');
const { logger } = require('../utils/logger');
const { retry } = require('../utils/retry');

async function getDecimals(web3, tokenAddress) {
  if (tokenAddress === ZERO_ADDRESS) {
    return 18;
  }

  const ercContract = new ERC20Contract(web3, tokenAddress);

  const decimals = await ercContract.getDecimals();

  return Number(decimals);
}

async function doSwapSyncSwap(ethAccount, web3Scroll, scan, amountSwap, fromToken, toToken) {
  return await retry(async () => {
    const AMOUNT_SWAP = amountSwap;
    const SLIPPAGE = 2; // percent

    const syncSwap = new SyncSwap(web3Scroll);

    const TOKENS = {
      USDC: USDC_TOKEN_ADDRESS,
      ETH: WETH_TOKEN_CONTRACT,
      USDT: USDT_TOKEN_ADDRESS,
    };

    const decimals = await getDecimals(web3Scroll, fromToken);
    const amountInWei = new BigNumber(AMOUNT_SWAP).multipliedBy(10 ** decimals);

    const methodSwap = await syncSwap.swap(fromToken, toToken, amountInWei.toString(), SLIPPAGE, ethAccount.address);

    const { gasPrice } = await ethAccount.getGasPrice();

    if (fromToken !== TOKENS.ETH) {
      await ethAccount.checkAndApproveToken(fromToken, SYNCSWAP_ROUTER_CONTRACT, amountInWei);
    }

    const estimateGas = await methodSwap.estimateGas({
      from: ethAccount.address,
      value: TOKENS.ETH === fromToken ? amountInWei.toString() : undefined,
      gasPrice,
    });

    const response = await methodSwap.send({
      from: ethAccount.address,
      value: TOKENS.ETH === fromToken ? amountInWei.toString() : undefined,
      gasPrice,
      gas: Math.floor(Number(estimateGas) * 1.2),
    });

    logger.info('Swapped', {
      address: ethAccount.address,
      tx: `${scan}/tx/${response.transactionHash}`,
    });
  }, 5, 20000);
}

module.exports = {
  doSwapSyncSwap,
};
