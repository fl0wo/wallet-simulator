import {WalletSimulator} from "../index";

test('My Greeter', () => {
    expect(new WalletSimulator('main-wallet')).toBeDefined()
});