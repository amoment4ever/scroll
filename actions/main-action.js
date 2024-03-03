const { default: BigNumber } = require('bignumber.js');
const { EthAccount } = require('../components/account');
const { ERC20Contract } = require('../components/erc20');
const { LayerBank } = require('../components/layerbank/layerbank');
const { withdrawToken } = require('../components/okx');
const { SyncSwap } = require('../components/syncswap');
const { web3sArbList } = require('../components/web3-arb');
const { web3sLinea } = require('../components/web3-linea');
const {
  USDC_TOKEN_ADDRESS, USDT_TOKEN_ADDRESS, LAYERBANK_USDC, WETH_TOKEN_CONTRACT,
} = require('../constants/constants');
const {
  SLEEP_MIN_MS, SLEEP_MAX_MS, AMOUNT_BORROW_PERCENT, LEAVE_AMOUNT_ETH_MIN, LEAVE_AMOUNT_ETH_MAX, MIN_AMOUNT_ETH, MAX_AMOUNT_ETH, MAX_SWAP_USDC,
} = require('../settings');
const { getRandomFromArray } = require('../utils/array');
const { randomNumber, getRandomInt } = require('../utils/getRandomInt');
const { logger } = require('../utils/logger');
const { retry } = require('../utils/retry');
const { sleep } = require('../utils/sleep');
const { waitForEthBalance } = require('../utils/wait-for');
const {
  depositLayerBankAction, borrowLayerBank, repayLayerBank, withdrawLayerBankAction,
} = require('./actions-landings');
const { doSwapSyncSwap } = require('./actions-swaps');
const { doBridge } = require('./do-bridge');
const { transferAction } = require('./transferAction');

async function sleepWithLog() {
  const sleepMs = getRandomInt(SLEEP_MIN_MS, SLEEP_MAX_MS);

  logger.info('Sleep', {
    sleepMs,
  });

  await sleep(sleepMs);
}

async function mainAction(ethAccount, web3Scroll, scan, proxy, depositOkxAddress) {
  const AMOUNT_ETH = +randomNumber(MIN_AMOUNT_ETH, MAX_AMOUNT_ETH).toFixed(5);

  // const SOURCE_CHAIN = getRandomFromArray(['Linea', 'Arbitrum One']);
  const SOURCE_CHAIN = 'Linea';

  const web3List = SOURCE_CHAIN === 'Linea' ? web3sLinea : web3sArbList;

  const { web3: sourceWeb3 } = web3List.get();

  logger.info('Withdraw ETH from OKX', {
    amount: AMOUNT_ETH,
  });
  await withdrawToken(ethAccount.address, AMOUNT_ETH, 'ETH', SOURCE_CHAIN);

  logger.info('Wait for ETH on balance', {
    expect: AMOUNT_ETH * 0.95,
  });
  await waitForEthBalance(sourceWeb3, AMOUNT_ETH * 0.95, ethAccount.address);

  const ethAccountSourceChain = new EthAccount(ethAccount.privateKey, sourceWeb3, proxy);

  const amountBridge = +(AMOUNT_ETH * 0.96).toFixed(5);

  logger.info('Do bridge to SCROLL', {
    amountBridge,
    sourceChain: SOURCE_CHAIN,
  });
  await doBridge(ethAccountSourceChain, sourceWeb3, scan, proxy, amountBridge, SOURCE_CHAIN, 'SCROLL');

  logger.info('Wait for ETH in SCROLL');
  await waitForEthBalance(web3Scroll, AMOUNT_ETH * 0.9, ethAccount.address);

  const balanceForWorkWei = await ethAccount.getBalance(ethAccount.address);
  const balanceForWork = new BigNumber(balanceForWorkWei).div(1e18).minus(0.01);

  logger.info('Do deposit LAYERBANK');
  await depositLayerBankAction(ethAccount, web3Scroll, scan, balanceForWork);

  await sleepWithLog();

  const ETH_USDC = 3000;

  const AMOUNT_BORROW = (ETH_USDC * AMOUNT_BORROW_PERCENT * balanceForWork).toFixed(6);

  logger.info('Borrow USDC LAYERBANK', {
    amount: AMOUNT_BORROW,
  });
  const borrowWei = new BigNumber(AMOUNT_BORROW).multipliedBy(10 ** 6);
  await borrowLayerBank(ethAccount, web3Scroll, scan, borrowWei.toString());

  const SWAP_AMOUNT = Math.min(AMOUNT_BORROW, +(MAX_SWAP_USDC * randomNumber(0.9, 1)).toFixed(6));

  logger.info('Do swap SYNCSWAP USDC => USDT', {
    amount: SWAP_AMOUNT,
  });

  await sleepWithLog();
  await doSwapSyncSwap(ethAccount, web3Scroll, scan, SWAP_AMOUNT, USDC_TOKEN_ADDRESS, USDT_TOKEN_ADDRESS);

  await sleepWithLog();

  const usdtContract = new ERC20Contract(web3Scroll, USDT_TOKEN_ADDRESS);
  const usdtBalance = await usdtContract.getBalance(ethAccount.address);

  logger.info('Do swap USDT => USDC', {
    amoount: Number(usdtBalance) / 1e6,
  });

  await sleepWithLog();
  await doSwapSyncSwap(ethAccount, web3Scroll, scan, Number(usdtBalance) / 1e6, USDT_TOKEN_ADDRESS, USDC_TOKEN_ADDRESS);

  const usdcContract = new ERC20Contract(web3Scroll, USDC_TOKEN_ADDRESS);
  const usdcCurrentBalance = await usdcContract.getBalance(ethAccount.address);

  const layerBank = new LayerBank(web3Scroll);

  const borrowAmountWei = await layerBank.getBorrowAmount(LAYERBANK_USDC, ethAccount.address);

  const difference = new BigNumber(borrowAmountWei).minus(usdcCurrentBalance);

  if (difference.gte(0)) {
    logger.info('Swap ETH => USDC', {
      usdcCurrentBalance,
      amount: difference.toString(),
      borrowAmountWei,
    });

    const syncSwap = new SyncSwap(web3Scroll);

    const poolAddress = await syncSwap.getPool(WETH_TOKEN_CONTRACT, USDC_TOKEN_ADDRESS);
    const minAmountIn = await syncSwap.getAmountIn(poolAddress, USDC_TOKEN_ADDRESS, difference.toString(), 1, ethAccount.address);

    await doSwapSyncSwap(ethAccount, web3Scroll, scan, new BigNumber(minAmountIn).div(10 ** 18), WETH_TOKEN_CONTRACT, USDC_TOKEN_ADDRESS);
  }

  await sleepWithLog();

  logger.info('Return USDC layerbank');
  await repayLayerBank(ethAccount, web3Scroll, scan, LAYERBANK_USDC, USDC_TOKEN_ADDRESS);

  logger.info('Withdraw ETH from layerbank');
  await withdrawLayerBankAction(ethAccount, web3Scroll, scan);

  const currentBalance = await ethAccount.getBalance(ethAccount.address);
  const leaveAmount = +randomNumber(LEAVE_AMOUNT_ETH_MIN, LEAVE_AMOUNT_ETH_MAX).toFixed(5);
  const bridgeAmount = new BigNumber(currentBalance).div(1e18).minus(leaveAmount).toFixed(5);

  await sleepWithLog();

  logger.info('Do bridge from SCROLL', {
    sourceChain: SOURCE_CHAIN,
  });
  await doBridge(ethAccount, web3Scroll, scan, proxy, bridgeAmount, 'SCROLL', SOURCE_CHAIN);

  logger.info('Wait for ETH in sourceChain', {
    sourceChain: SOURCE_CHAIN,
  });
  await waitForEthBalance(sourceWeb3, bridgeAmount * 0.9, ethAccount.address);

  logger.info('Transfer ETH to OKX', {
    address: ethAccount.address,
    depositOkxAddress,
    chain: SOURCE_CHAIN,
  });

  await retry(async () => {
    await transferAction(ethAccountSourceChain, ethAccount.address, depositOkxAddress, SOURCE_CHAIN);
  }, 5, 10000);
}

module.exports = {
  mainAction,
};
