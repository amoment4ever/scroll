# SCROLL Volume Inflation Script

## Overview
This script is designed to automate the process of inflating volumes within the SCROLL network. It executes a series of transactions starting from bridging ETH from the OKX exchange to either the Linea or Base network, bridging into the SCROLL network via Routernitro, making deposits and loans on LayerBank, swapping currencies on SyncSwap, and completing the cycle by returning the funds back to OKX. This automation facilitates managing multiple accounts efficiently for volume inflation purposes.

## Warning
The use of this script involves inherent risks due to the volatility of cryptocurrency markets and potential regulatory changes affecting DeFi projects. Users should be aware of these risks and use the script at their own discretion and risk.

## Prerequisites
- Node.js (version 12 or later)
- An active account on the OKX exchange
- Configured access to the SCROLL, Linea, or Base networks and LayerBank

## Installation
Install the necessary dependencies:
    ```
    npm install
    ```
## Run
Install the necessary dependencies:
    ```
    node index.js
    ```

## Configuration
Before running the script, ensure the following configuration files are properly set up:

- `settings.js`: Contains the script's main settings.

- `secret.js`: Stores your OKX API keys and other sensitive information. Here's an example template:
    ```javascript
    const OKX_API_KEY = 'Your_OKX_API_Key';
    const SECRET_OKX = 'Your_OKX_Secret';
    const OKX_PHRASE = 'Your_OKX_Passphrase';

    module.exports = { OKX_API_KEY, SECRET_OKX, OKX_PHRASE };
    ```

- `wallets.json`: Lists the wallets to be used by the script. Example format:
    ```json
    [
      {
        "PRIVATE_KEY": "Your_Private_Key",
        "DEPOSIT_OKX_ADDRESS": "Your_OKX_Deposit_Address",
        "ADDRESS": "Your_Wallet_Address"
      },
      {
        "PRIVATE_KEY": "Your_Private_Key",
        "DEPOSIT_OKX_ADDRESS": "Your_OKX_Deposit_Address",
        "ADDRESS": "Your_Wallet_Address"
      }
    ]
    ```

- `proxies.js` (Optional): For those who wish to use mobile proxies. Example format:
    ```javascript
    'https://login:pass@ip:port';
    ```

## Usage
To run the script, execute the following command in the terminal:
    ```
    node index.js
    ```
Ensure all configurations are correctly set up for the script to run smoothly.

## Security
Do not share your private keys, API keys, or any sensitive information publicly. Ensure that `secret.js` and `wallets.json` are adequately protected and not accessible by unauthorized individuals.
