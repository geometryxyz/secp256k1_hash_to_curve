jest.setTimeout(120000)
const crypto = require('crypto')
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'

import { bigint_to_array } from './utils'

const p = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F')
const u0 = BigInt('8386638881075453792406600069412283052291822895580742641789327979312054938465')
const u1 = BigInt('40071583224459737250239606232440854032076176808341187421679277989916398099968')
const u0_registers = bigint_to_array(64, 4, u0)
const u1_registers = bigint_to_array(64, 4, u1)
const Z = BigInt('115792089237316195423570985008687907853269984665640564039457584007908834671652')
const Z_registers = bigint_to_array(64, 4, Z)

describe('MapToCurve', () => {
    it('u ** 2', async () => {
        const expected_registers: bigint[] = bigint_to_array(64, 4, (u0 * u0) % p)

        const circuit = 'u_squared_test'
        const circuitInputs = stringifyBigInts({ val: u0_registers })
        const witness = await genWitness(circuit, circuitInputs)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            expected_registers.push(out)
            expect(out).toEqual(expected_registers[i])
        }
    })
    it('Z * tv1', async () => {
        const tv1 = bigint_to_array(64, 4, (u0 * u0) % p)
        const expected_registers: bigint[] = bigint_to_array(64, 4, (Z * (u0 * u0)) % p)
        const circuit = 'z_mul_tv1_squared_test'
        const circuitInputs = stringifyBigInts({ tv1 })
        const witness = await genWitness(circuit, circuitInputs)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            expected_registers.push(out)
            expect(out).toEqual(expected_registers[i])
        }
    })
})
