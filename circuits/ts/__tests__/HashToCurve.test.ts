jest.setTimeout(120000)
const crypto = require('crypto')
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'
import { bigint_to_array } from '../utils'
import { generate_inputs } from '../generate_inputs'

describe('HashToCurve', () => {
    const msg = 'abc'
    const expected_x = BigInt('0x3377e01eab42db296b512293120c6cee72b6ecf9f9205760bd9ff11fb3cb2c4b')
    const expected_y = BigInt('0x7f95890f33efebd1044d382a01b1bee0900fb6116f94688d487c6c7b9c8371f6')
    const expected_x_array = bigint_to_array(64, 4, expected_x)
    const expected_y_array = bigint_to_array(64, 4, expected_y)

    it('HashToCurve circuit', async () => {
        const inputs = generate_inputs(msg)
        const circuit = 'hash_to_curve_test'
        const circuitInputs = stringifyBigInts(inputs)
        const witness = await genWitness(circuit, circuitInputs)

        for (let i = 0; i < 4; i ++) {
            const out_x = BigInt(await getSignalByName(circuit, witness, 'main.out[0][' + i.toString() + ']'))
            expect(out_x).toEqual(expected_x_array[i])
            const out_y = BigInt(await getSignalByName(circuit, witness, 'main.out[1][' + i.toString() + ']'))
            expect(out_y).toEqual(expected_y_array[i])
        }
    })
})
