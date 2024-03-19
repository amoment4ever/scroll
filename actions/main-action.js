const { default: BigNumber } = require('bignumber.js');
const { EthAccount } = require('../components/account');
const { ERC20Contract } = require('../components/erc20');
const { LayerBank } = require('../components/layerbank/layerbank');
const { withdrawToken } = require('../components/okx');
const { SyncSwap } = require('../components/syncswap');
const { web3sArbList } = require('../components/web3-arb');
const { web3sLinea } = require('../components/web3-linea');
const {
  USDC_TOKEN_ADDRESS, USDT_TOKEN_ADDRESS, LAYERBANK_USDC, WETH_TOKEN_CONTRACT, NATIVE_TOKEN,
} = require('../constants/constants');
const {
  SLEEP_MIN_MS, SLEEP_MAX_MS, AMOUNT_BORROW_PERCENT, LEAVE_AMOUNT_ETH_MIN, LEAVE_AMOUNT_ETH_MAX, MIN_AMOUNT_ETH, MAX_AMOUNT_ETH, MAX_SWAP_USDC, MAX_SWAP_ETH,
} = require('../settings');
const { getRandomFromArray } = require('../utils/array');
const { randomNumber, getRandomInt } = require('../utils/getRandomInt');
const { logger } = require('../utils/logger');
const { retry } = require('../utils/retry');
const { sleep } = require('../utils/sleep');
const { waitForEthBalance, waitForOkxBalance } = require('../utils/wait-for');
const {
  depositLayerBankAction, borrowLayerBank, repayLayerBank, withdrawLayerBankAction, depositCogFinance, depositAaveAction,
} = require('./actions-landings');
const { doSwapSyncSwap, doSwapSushiSwap } = require('./actions-swaps');
const { doBridge, doBridgeOrbiter } = require('./do-bridge');
const { transferAction } = require('./transferAction');

async function sleepWithLog() {
  const sleepMs = getRandomInt(SLEEP_MIN_MS, SLEEP_MAX_MS);

  logger.info('Sleep', {
    sleepMs,
  });

  await sleep(sleepMs);
}

const ETH_USDC = 3600;

async function withdrawFromOkx(AMOUNT_ETH, ethAccount, SOURCE_CHAIN, sourceWeb3) {
  logger.info('Withdraw ETH from OKX', {
    amount: AMOUNT_ETH,
  });
  await waitForOkxBalance(AMOUNT_ETH, 'ETH');
  await withdrawToken(ethAccount.address, AMOUNT_ETH, 'ETH', SOURCE_CHAIN);

  logger.info('Wait for ETH on balance', {
    expect: AMOUNT_ETH * 0.95,
  });
  await waitForEthBalance(sourceWeb3, AMOUNT_ETH * 0.95, ethAccount.address);
}

function getSourceChain(ethAccount, proxy) {
  // const SOURCE_CHAIN = getRandomFromArray(['Linea', 'Arbitrum One']);
  const SOURCE_CHAIN = 'Linea';
  const web3List = SOURCE_CHAIN === 'Linea' ? web3sLinea : web3sArbList;
  const { web3: sourceWeb3 } = web3List.get();

  const ethAccountSourceChain = new EthAccount(ethAccount.privateKey, sourceWeb3, proxy);

  return {
    ethAccountSourceChain,
    sourceWeb3,
    SOURCE_CHAIN,
  };
}

async function bridgeToScroll(AMOUNT_ETH, web3Scroll, SOURCE_CHAIN, ethAccountSourceChain, ethAccount, sourceWeb3, scan, proxy) {
  const amountBridge = +(AMOUNT_ETH * 0.98).toFixed(5);

  logger.info('Do bridge to SCROLL', {
    amountBridge,
    sourceChain: SOURCE_CHAIN,
  });

  if (Math.random() > 0.2) {
    await doBridgeOrbiter(ethAccountSourceChain, sourceWeb3, scan, proxy, amountBridge, SOURCE_CHAIN.toUpperCase(), 'SCROLL');
  } else {
    await doBridge(ethAccountSourceChain, sourceWeb3, scan, proxy, amountBridge, SOURCE_CHAIN, 'SCROLL');
  }

  logger.info('Wait for ETH in SCROLL');
  await waitForEthBalance(web3Scroll, AMOUNT_ETH * 0.9, ethAccount.address);
}

async function performActionWithProbability(action, probability, params) {
  if (Math.random() < probability) {
    await action(...params);
    await sleepWithLog();
  }
}

async function performSwap(ethAccount, web3, scanService, amount, fromToken, toToken) {
  logger.info('Swap', {
    fromToken,
    toToken,
    amount,
  });

  const swapFunction = Math.random() > 0.5 ? doSwapSyncSwap : doSwapSushiSwap;
  await swapFunction(ethAccount, web3, scanService, amount, fromToken, toToken);
  await sleepWithLog();
}

async function performeFinancialActions(ethAccount, web3Scroll, scan) {
  const usdcContract = new ERC20Contract(web3Scroll, USDC_TOKEN_ADDRESS);
  const usdtContract = new ERC20Contract(web3Scroll, USDT_TOKEN_ADDRESS);

  const balanceForWorkWei = await ethAccount.getBalance(ethAccount.address);
  const balanceForWork = new BigNumber(balanceForWorkWei).div(1e18).minus(0.01);

  await performActionWithProbability(depositCogFinance, 0.15, [ethAccount, web3Scroll, scan, balanceForWork]);
  await performActionWithProbability(depositAaveAction, 0.4, [ethAccount, web3Scroll, scan, balanceForWork]);

  if (Math.random() > 0.5) {
    const amountToSwap = Math.min(balanceForWork.multipliedBy(randomNumber(0.4, 0.9)), MAX_SWAP_ETH * randomNumber(0.5, 0.9));
    await performSwap(ethAccount, web3Scroll, scan, amountToSwap, NATIVE_TOKEN, USDC_TOKEN_ADDRESS);

    const usdcCurrentBalance = await usdcContract.getBalance(ethAccount.address);
    const usdcBalanceReadable = new BigNumber(usdcCurrentBalance).div(1e6).toString();

    if (Math.random() > 0.5) {
      await performSwap(ethAccount, web3Scroll, scan, usdcBalanceReadable, USDC_TOKEN_ADDRESS, USDT_TOKEN_ADDRESS);
      const usdtBalance = await usdtContract.getBalance(ethAccount.address);
      await performSwap(ethAccount, web3Scroll, scan, Number(usdtBalance) / 1e6, USDT_TOKEN_ADDRESS, NATIVE_TOKEN);
    } else {
      await performSwap(ethAccount, web3Scroll, scan, usdcBalanceReadable, USDC_TOKEN_ADDRESS, NATIVE_TOKEN);
    }
  } else {
    logger.info('Do deposit LAYERBANK');
    await depositLayerBankAction(ethAccount, web3Scroll, scan, balanceForWork);
    await sleepWithLog();

    const AMOUNT_BORROW = (ETH_USDC * AMOUNT_BORROW_PERCENT * balanceForWork).toFixed(6);

    logger.info('Borrow USDC LAYERBANK', {
      amount: AMOUNT_BORROW,
    });
    const borrowWei = new BigNumber(AMOUNT_BORROW).multipliedBy(10 ** 6);
    await borrowLayerBank(ethAccount, web3Scroll, scan, borrowWei.toString());
    await sleepWithLog();

    const SWAP_AMOUNT = Math.min(AMOUNT_BORROW, +(MAX_SWAP_USDC * randomNumber(0.7, 1)).toFixed(6));
    await performSwap(ethAccount, web3Scroll, scan, SWAP_AMOUNT, USDC_TOKEN_ADDRESS, USDT_TOKEN_ADDRESS);

    const usdtBalance = await usdtContract.getBalance(ethAccount.address);
    await performSwap(ethAccount, web3Scroll, scan, Number(usdtBalance) / 1e6, USDT_TOKEN_ADDRESS, USDC_TOKEN_ADDRESS);

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

      await performSwap(ethAccount, web3Scroll, scan, new BigNumber(new BigNumber(minAmountIn).multipliedBy(1.02).toFixed(0)).div(10 ** 18), NATIVE_TOKEN, USDC_TOKEN_ADDRESS);
    }

    logger.info('Return USDC layerbank');
    await repayLayerBank(ethAccount, web3Scroll, scan, LAYERBANK_USDC, USDC_TOKEN_ADDRESS);
    await sleepWithLog();
    logger.info('Withdraw ETH from layerbank');
    await withdrawLayerBankAction(ethAccount, web3Scroll, scan);
    await sleepWithLog();
  }

  const actions = [depositCogFinance, depositAaveAction];

  await performActionWithProbability(getRandomFromArray(actions), 0.3, [ethAccount, web3Scroll, scan, balanceForWork.minus(0.01)]);
  await performActionWithProbability(getRandomFromArray(actions), 0.3, [ethAccount, web3Scroll, scan, balanceForWork.minus(0.01)]);
}

async function mainAction(ethAccount, web3Scroll, scan, proxy, depositOkxAddress) {
  const AMOUNT_ETH = +randomNumber(MIN_AMOUNT_ETH, MAX_AMOUNT_ETH).toFixed(5);

  const { ethAccountSourceChain, sourceWeb3, SOURCE_CHAIN } = getSourceChain(ethAccount, proxy);

  await withdrawFromOkx(AMOUNT_ETH, ethAccount, SOURCE_CHAIN, sourceWeb3);

  await bridgeToScroll(AMOUNT_ETH, web3Scroll, SOURCE_CHAIN, ethAccountSourceChain, ethAccount, sourceWeb3, scan, proxy);

  await performeFinancialActions(ethAccount, web3Scroll, scan);

  const currentBalance = await ethAccount.getBalance(ethAccount.address);
  const leaveAmount = +randomNumber(LEAVE_AMOUNT_ETH_MIN, LEAVE_AMOUNT_ETH_MAX).toFixed(5);
  const bridgeAmount = new BigNumber(currentBalance).div(1e18).minus(leaveAmount).toFixed(5);

  logger.info('Do bridge from SCROLL', {
    sourceChain: SOURCE_CHAIN,
    bridgeAmount,
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
