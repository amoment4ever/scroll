const { default: BigNumber } = require('bignumber.js');
const rp = require('request-promise');
const { mainAction } = require('./actions/main-action');
const { EthAccount } = require('./components/account');
const { web3ScrollList } = require('./components/web3-scroll');
const { SLEEP_MIN_MS, SLEEP_MAX_MS } = require('./settings');
const { getRandomInt } = require('./utils/getRandomInt');
const { logger } = require('./utils/logger');
const { sleep } = require('./utils/sleep');
const { waitForLowerGasPrice } = require('./utils/wait-for');
const WALLETS = require('./wallets');

async function start() {
  for (const { PRIVATE_KEY, DEPOSIT_OKX_ADDRESS } of WALLETS) {
    const { web3Scroll, proxy, scan } = web3ScrollList.get();
    const ethAccount = new EthAccount(PRIVATE_KEY, web3Scroll, proxy, scan);

    const balance = await ethAccount.getBalance();
    const readableBalance = new BigNumber(balance).div(10 ** 18);

    logger.info('Balance', {
      address: ethAccount.address,
      balance: readableBalance,
    });

    await waitForLowerGasPrice();

    await mainAction(ethAccount, web3Scroll, scan, proxy, DEPOSIT_OKX_ADDRESS);

    const sleepMs = getRandomInt(SLEEP_MIN_MS, SLEEP_MAX_MS);

    logger.info('sleep', {
      ms: sleepMs,
    });

    await sleep(sleepMs);

    try {
      if (proxy?.linkToChange) {
        await rp(proxy.linkToChange);
        logger.info('Changed proxy ip');
      }
    } catch (exc) {
      logger.error('Error change proxy', exc);
    }
  }
}

start();
