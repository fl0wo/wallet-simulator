import {WalletSimulator} from "../index";
import {daysBefore} from "../utils/mock";

describe('test wallet',()=>{
    it('wallet gen',()=>{

        const startTs = daysBefore(new Date(),30*6);

        const x:WalletSimulator = new WalletSimulator(1000,{
            _creationAt: new Date(startTs).toISOString()
        });

    });
})