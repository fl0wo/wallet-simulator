# Wallet Simulator

A simple class to simulate a cryptocurrency wallet in Node.js

## Installation
```
npm install wallet-simulator
```

## Usage

```javascript
import { WalletSimulator } from 'wallet-simulator';

const wallet = new WalletSimulator(1000);

wallet.addTrade({ ticker: 'BTC', price: 10, quantity: 1, type: 'buy' });
wallet.addTrade({ ticker: 'ETH', price: 100, quantity: 2, type: 'buy' });

wallet.updatePrice('BTC', 12);
wallet.updatePrice('ETH', 110);

console.log(wallet.getPositionValue('BTC')); // 12
console.log(wallet.getPositionValue('ETH')); // 220
console.log(wallet.getTotalValue()); // 1232

console.log(wallet.getPositionAverageCost('BTC')); // 10
console.log(wallet.getEstimatedLiquidationPrice('BTC')); // 10
console.log(wallet.getEstimatedUnrealizedProfitLoss('BTC')); // 2
```

## Methods

| Command                          | Description                                                          |
|----------------------------------|----------------------------------------------------------------------|
| addTrade                         | Update balance and holdings based on trade                           |
| updatePrice                      | Set price for a particular asset                                     |
| getPositionValue                 | Return the value owned on this wallet of a particular asset          |
| getTotalValue                    | Return the sum of all funds in this wallet                           |
| getPositionAverageCost           | Return the average cost of a particular asset                        |
| getEstimatedLiquidationPrice     | Return the estimated liquidation price of a particular asset         |
| getEstimatedUnrealizedProfitLoss | Return the estimated unrealized profit or loss of a particular asset |

## Properties
| Field     | Description                                                                    |
|-----------|--------------------------------------------------------------------------------|
| balance   | Current available balance in the base currency (EUR,USD,Bananas,Apples,etc...) |
| holdings  | Map with quantities owned of each asset                                        |
| prices    | Map with the last known price for each asset                                   |
| costBasis | Current sum of costs paid for an asset                                         |
| trades    | All trades                                                                     |

## Test
```
npm run test
```

## Authors

- [@fl0wo](https://www.github.com/fl0wo)



## License
This project is licensed under the Apache License - see the [LICENSE](https://github.com/fl0wo/wallet-simulator/blob/main/LICENSE) file for details.

## Contributions
Want to contribute to this project? Great! We welcome contributions and are always looking for ways to improve this package. Please take a look at the [CONTRIBUTING](https://github.com/fl0wo/wallet-simulator/blob/main/LICENSE) file for more information on how to get started.

## Support
If you have any questions or issues with this package, please open an issue on the Github repository or contact us at sabaniflorian@gmail.com

You can also find me on [Twitter](https://twitter.com/flof_fly)

