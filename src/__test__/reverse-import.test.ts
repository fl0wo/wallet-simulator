import {WalletSimulator} from "../index";
import * as fs from 'fs'
import {getSafeNull} from "../utils/general";


describe('reverse import from real trades exchange',()=>{

    test('reverse import ok',()=>{
        const s:string = getSafeNull(fs.readFileSync('./walletExported.json'),'')
        const expW = WalletSimulator.importFromJsonString(s)

         console.log('expW.getTotalValue()',expW.getTotalValue());
        // console.log(expW.getDonutAssetInformation());

        expect(expW.getTotalValue())
            .toBeGreaterThan(0)
        expect(expW.getDonutAssetInformation())
            .toBeDefined()
    })

})