import {CCTXWrapper} from "../utils/cctx-wrapper";
import {mockDate} from "../utils/mock";
import {mockCCTXClient} from "./acceptance-test-cctx.test";

const secrets = require('../../_secrets/sec.json')
let client:CCTXWrapper;

describe('get credentials',()=>{

    beforeAll(async () => {
        mockDate(new Date('2023-02-16T12:00:18.670Z'));
        mockCCTXClient();
        client = await CCTXWrapper.getClientWith(secrets.floApi, secrets.floSecret);
    });

    it.only('get cred',()=>{
        const {api,secret,passphrase} = client.getCredentials();
        expect(api).toBeDefined()
        expect(secret).toBeDefined()
    })

})