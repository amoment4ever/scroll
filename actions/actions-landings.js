const { default: BigNumber } = require('bignumber.js');
const { Aave } = require('../components/aave');
const { CogFinance } = require('../components/cog-finance');
const { LayerBank } = require('../components/layerbank/layerbank');
const { INFINITY_APPROVE, LAYERBANK_USDC } = require('../constants/constants');
const { logger } = require('../utils/logger');
const { retry } = require('../utils/retry');

async function depositLayerBankAction(ethAccount, web3Scroll, scan, amountDeposit) {
  const AMOUNT_DEPOSIT_LAYERBANK = amountDeposit;

  const layerBank = new LayerBank(web3Scroll);

  const amountDepositWei = new BigNumber(AMOUNT_DEPOSIT_LAYERBANK).multipliedBy(10 ** 18);

  await retry(async () => {
    const { gasPrice } = await ethAccount.getGasPrice();

    const estimateGas = await layerBank.deposit(amountDepositWei.toString()).estimateGas({
      from: ethAccount.address,
      value: amountDepositWei.toString(),
      gasPrice,
    });

    const response = await layerBank.deposit(amountDepositWei.toString()).send({
      from: ethAccount.address,
      value: amountDepositWei.toString(),
      gasPrice,
      gas: Math.floor(Number(estimateGas) * 2),
    });

    logger.info('Deposit layerbank response', {
      address: ethAccount.address,
      tx: `${scan}/tx/${response.transactionHash}`,
    });
  }, 4, 10000);
}

async function borrowLayerBank(ethAccount, web3Scroll, scan, amountBorrowWei) {
  const layerBank = new LayerBank(web3Scroll);

  await retry(async () => {
    const { gasPrice } = await ethAccount.getGasPrice();

    logger.info('Do colleteral layerbank');

    const estimateGas = await layerBank.enterMarket().estimateGas({
      from: ethAccount.address,
      gasPrice,
    });

    const response = await layerBank.enterMarket().send({
      from: ethAccount.address,
      gasPrice,
      gas: Math.floor(Number(estimateGas) * 1.2),
    });

    logger.info('Colleteral ETH layerbank response', {
      address: ethAccount.address,
      tx: `${scan}/tx/${response.transactionHash}`,
    });
  }, 3, 10000);

  await retry(async () => {
    const { gasPrice } = await ethAccount.getGasPrice();

    const estimateGas = await layerBank.borrow(LAYERBANK_USDC, amountBorrowWei).estimateGas({
      from: ethAccount.address,
      gasPrice,
    });

    const data = await layerBank.borrow(LAYERBANK_USDC, amountBorrowWei).send({
      from: ethAccount.address,
      gasPrice,
      gas: Math.floor(Number(estimateGas) * 1.2),
    });

    logger.info('Borrow usdc', {
      amountBorrowWei,
      tx: `${scan}/tx/${data.transactionHash}`,
    });
  }, 3, 10000);
}

async function withdrawLayerBankAction(ethAccount, web3Scroll, scan) {
  const layerBank = new LayerBank(web3Scroll);

  await retry(async () => {
    const { gasPrice } = await ethAccount.getGasPrice();

    const depositedAmount = await layerBank.getAmountDeposit(ethAccount.address);
    logger.info('Deposited amount', {
      depositedAmount,
    });

    if (depositedAmount) {
      const estimateGas = await layerBank.withdraw(depositedAmount).estimateGas(
        { from: ethAccount.address },
      );

      const withdraw = await layerBank.withdraw(depositedAmount).send({
        from: ethAccount.address,
        gasPrice,
        gas: Math.floor(Number(estimateGas) * 1.2),
      });

      logger.info('Withdraw info', {
        address: ethAccount.address,
        tx: `${scan}/tx/${withdraw.transactionHash}`,
      });
    }
  }, 3, 10000);
}

async function repayLayerBank(ethAccount, web3Scroll, scan, lpToken, tokenAddress) {
  await retry(async () => {
    const layerBank = new LayerBank(web3Scroll);

    const borrowAmount = await layerBank.getBorrowAmount(lpToken, ethAccount.address);

    if (borrowAmount <= 0) {
      return;
    }
    await ethAccount.checkAndApproveToken(tokenAddress, lpToken, borrowAmount);
    const { gasPrice } = await ethAccount.getGasPrice();

    const estimateGas = await layerBank.repay(lpToken, new BigNumber(borrowAmount).plus(150).toString()).estimateGas({
      from: ethAccount.address,
      gasPrice,
    });

    const response = await layerBank.repay(lpToken, new BigNumber(borrowAmount).plus(150).toString()).send({
      from: ethAccount.address,
      gasPrice,
      gas: Math.floor(Number(estimateGas) * 1.2),
    });

    logger.info('Withdraw info', {
      address: ethAccount.address,
      tx: `${scan}/tx/${response.transactionHash}`,
    });
  }, 5, 12000);
}

async function depositAaveAction(ethAccount, web3Scroll, scan) {
  const AMOUNT_DEPOSIT_AAVE = 0.001;
  const aave = new Aave(web3Scroll);

  const { gasPrice } = await ethAccount.getGasPrice();
  const amountDepositWei = new BigNumber(AMOUNT_DEPOSIT_AAVE).multipliedBy(10 ** 18);

  await retry(async () => {
    const response = await aave.deposit(ethAccount.address).send({
      from: ethAccount.address,
      value: amountDepositWei.toString(),
      gasPrice,
    });

    logger.info('Deposit Aave response', {
      address: ethAccount.address,
      tx: `${scan}/tx/${response.transactionHash}`,
    });
  }, 2, 10000);

  await retry(async () => {
    const depositedAmount = await aave.getAmountDeposit(ethAccount.address);
    logger.info('Deposited amount on Aave', {
      depositedAmount,
    });

    if (depositedAmount) {
      const allowance = await aave.aaeveWethToken.getAllowance(ethAccount.address, aave.contractAddress);

      if (new BigNumber(allowance).lte(depositedAmount)) {
        await retry(async () => {
          logger.info('Try to approve', {
            address: ethAccount.address,
            spender: aave.contractAddress,
            token: aave.aaeveWethToken.address,
          });
          const approveResponse = await aave.aaeveWethToken.approve(aave.contractAddress, INFINITY_APPROVE).send({
            from: ethAccount.address,
            gasPrice,
          });

          logger.info('Approved', {
            address: ethAccount.address,
            tx: `${scan}/tx/${approveResponse.transactionHash}`,
          });
        }, 2);
      }

      const withdraw = await aave.withdraw(depositedAmount, ethAccount.address).send({
        from: ethAccount.address,
        gasPrice,
      });

      logger.info('Withdraw info', {
        address: ethAccount.address,
        tx: `${scan}/tx/${withdraw.transactionHash}`,
      });
    }
  }, 2, 10000);
}

async function depositCogFinance(ethAccount, web3Scroll, scan) {
  const AMOUNT_DEPOSIT_COG = 0.001;
  const cogFinance = new CogFinance(web3Scroll);

  const { gasPrice } = await ethAccount.getGasPrice();
  const amountDepositWei = new BigNumber(AMOUNT_DEPOSIT_COG).multipliedBy(10 ** 18);

  await retry(async () => {
    logger.info('Wrapping eth to weth', {
      address: ethAccount.address,
      amountDepositWei,
    });

    const wrapResponse = await cogFinance.wethToken.methods.deposit().send({
      from: ethAccount.address,
      value: amountDepositWei.toString(),
      gasPrice,
    });

    logger.info('Wrap success', {
      address: ethAccount.address,
      tx: `${scan}/tx/${wrapResponse.transactionHash}`,
    });
  }, 2, 10000);

  const allowance = await cogFinance.wethToken.methods.allowance(ethAccount.address, cogFinance.contractAddress).call();

  if (new BigNumber(allowance).lte(amountDepositWei)) {
    await retry(async () => {
      logger.info('Try to approve', {
        address: ethAccount.address,
        spender: cogFinance.contractAddress,
        token: 'WETH',
      });
      const approveResponse = await cogFinance.wethToken.approve(cogFinance.contractAddress, INFINITY_APPROVE).send({
        from: ethAccount.address,
        gasPrice,
      });

      logger.info('Approved', {
        address: ethAccount.address,
        tx: `${scan}/tx/${approveResponse.transactionHash}`,
      });
    }, 2, 10000);
  }

  await retry(async () => {
    const response = await cogFinance.deposit(ethAccount.address, amountDepositWei.toString()).send({
      from: ethAccount.address,
      gasPrice,
    });

    logger.info('Deposit CogFinance response', {
      address: ethAccount.address,
      tx: `${scan}/tx/${response.transactionHash}`,
    });
  }, 2, 10000);

  await retry(async () => {
    const depositedAmount = await cogFinance.getAmountDeposit(ethAccount.address);
    logger.info('Deposited amount on CogFinance', {
      depositedAmount,
    });

    if (depositedAmount) {
      logger.info('Try to withdraw');
      const withdraw = await cogFinance.withdraw(ethAccount.address, depositedAmount).send({
        from: ethAccount.address,
        gasPrice,
      });

      logger.info('Withdraw info', {
        address: ethAccount.address,
        tx: `${scan}/tx/${withdraw.transactionHash}`,
      });
    }
  }, 2, 10000);

  await retry(async () => {
    const balanceWeth = await cogFinance.wethToken.methods.balanceOf(ethAccount.address).call();

    const unwrapResponse = await cogFinance.wethToken.methods.withdraw(balanceWeth).send({
      from: ethAccount.address,
      gasPrice,
    });

    logger.info('unwrap success', {
      address: ethAccount.address,
      tx: `${scan}/tx/${unwrapResponse.transactionHash}`,
    });
  }, 2, 10000);
}

module.exports = {
  depositLayerBankAction,
  depositAaveAction,
  depositCogFinance,
  withdrawLayerBankAction,
  borrowLayerBank,
  repayLayerBank,
};
