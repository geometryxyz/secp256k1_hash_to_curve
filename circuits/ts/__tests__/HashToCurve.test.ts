jest.setTimeout(360000)
const crypto = require('crypto')
import { join } from 'path';
import { wasm as wasm_tester } from 'circom_tester'
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'
import { bigint_to_array } from '../utils'
import { generate_inputs } from '../generate_inputs'

const test_suites = [
    {
        circuit: 'hash_to_curve_test',
        msg: 'abc',
        expected_x: BigInt('0x3377e01eab42db296b512293120c6cee72b6ecf9f9205760bd9ff11fb3cb2c4b'),
        expected_y: BigInt('0x7f95890f33efebd1044d382a01b1bee0900fb6116f94688d487c6c7b9c8371f6'),
    },
    {
        circuit: 'hash_to_curve_16_test',
        msg: 'abcdef0123456789',
        expected_x: BigInt('0xbac54083f293f1fe08e4a70137260aa90783a5cb84d3f35848b324d0674b0e3a'),
        expected_y: BigInt('0x4436476085d4c3c4508b60fcf4389c40176adce756b398bdee27bca19758d828'),
    },
    {
        circuit: 'hash_to_curve_133_test',
        msg: 'q128_qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq',
        expected_x: BigInt('0xe2167bc785333a37aa562f021f1e881defb853839babf52a7f72b102e41890e9'),
        expected_y: BigInt('0xf2401dd95cc35867ffed4f367cd564763719fbc6a53e969fb8496a1e6685d873'),
    },
    // The circuit for the following test case may not work with circom-helper
    // because of the large amount of JS heap memory it needs to run `snarkjs
    // r1cs info`.
    //{
        //circuit: 'hash_to_curve_517_test',
        //msg: 'a512_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        //expected_x: BigInt('0xe3c8d35aaaf0b9b647e88a0a0a7ee5d5bed5ad38238152e4e6fd8c1f8cb7c998'),
        //expected_y: BigInt('0x8446eeb6181bf12f56a9d24e262221cc2f0c4725c7e3803024b5888ee5823aa6'),
    //},
]

describe('HashToCurve', () => {
    for (const suite of test_suites) {
        it('msg = " ' + suite.msg + '"', async () => {
            const circuit = suite.circuit
            const msg = suite.msg
            const expected_x = suite.expected_x
            const expected_y = suite.expected_y
            const expected_x_array = bigint_to_array(64, 4, expected_x)
            const expected_y_array = bigint_to_array(64, 4, expected_y)
            const inputs = generate_inputs(msg)

            const circuitInputs = stringifyBigInts(inputs)
            // const witness = await genWitness(circuit, circuitInputs)

            // for (let i = 0; i < 4; i ++) {
            //     const out_x = BigInt(await getSignalByName(circuit, witness, 'main.out[0][' + i.toString() + ']'))
            //     expect(out_x).toEqual(expected_x_array[i])
            //     const out_y = BigInt(await getSignalByName(circuit, witness, 'main.out[1][' + i.toString() + ']'))
            //     expect(out_y).toEqual(expected_y_array[i])
            // }
            const p = join(__dirname, "../../circom/test", circuit + '.circom')
            const c = await wasm_tester(p, {"json":true, "sym": true})
            const w = await c.calculateWitness(circuitInputs)
            await c.checkConstraints(w)
        })
    }
})
