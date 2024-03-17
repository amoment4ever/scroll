const { default: BigNumber } = require('bignumber.js');
const { ERC20Contract } = require('../components/erc20');
const { SushiSwap } = require('../components/sushi-swap');
const { SyncSwap } = require('../components/syncswap');
const {
  USDC_TOKEN_ADDRESS, ZERO_ADDRESS, WETH_TOKEN_CONTRACT, SYNCSWAP_ROUTER_CONTRACT, USDT_TOKEN_ADDRESS, NATIVE_TOKEN, SUSHI_SWAP_ROUTER,
} = require('../constants/constants');
const { logger } = require('../utils/logger');
const { retry } = require('../utils/retry');
const { sleep } = require('../utils/sleep');

async function getDecimals(web3, tokenAddress) {
  if (tokenAddress === ZERO_ADDRESS || tokenAddress === NATIVE_TOKEN) {
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
      await sleep(10000);
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

    logger.info('Swapped syncswap', {
      address: ethAccount.address,
      tx: `${scan}/tx/${response.transactionHash}`,
    });
  }, 5, 20000);
}

async function doSwapSushiSwap(ethAccount, web3Scroll, scan, amountSwap, fromToken, toToken) {
  return await retry(async () => {
    const sushiSwap = new SushiSwap(web3Scroll);

    const { gasPrice } = await ethAccount.getGasPrice();

    const decimals = await getDecimals(web3Scroll, fromToken);
    const amountInWei = new BigNumber(amountSwap).multipliedBy(10 ** decimals);

    if (fromToken !== NATIVE_TOKEN) {
      await ethAccount.checkAndApproveToken(fromToken, SUSHI_SWAP_ROUTER, amountInWei);
      await sleep(10000);
    }

    const MAX_PRICE_IMPACT = 0.005;

    const {
      method,
      value,
    } = await sushiSwap.swap(fromToken, toToken, amountInWei.toString(), MAX_PRICE_IMPACT, ethAccount.address, gasPrice);

    const estimateGas = await method.estimateGas({
      from: ethAccount.address,
      value,
    });

    const response = await method.send({
      from: ethAccount.address,
      value,
      gasPrice,
      gas: Math.floor(Number(estimateGas) * 1.2),
    });

    logger.info('Swapped sushiswap', {
      address: ethAccount.address,
      tx: `${scan}/tx/${response.transactionHash}`,
    });
  }, 5, 20000);
}

module.exports = {
  doSwapSyncSwap,
  doSwapSushiSwap,
};
