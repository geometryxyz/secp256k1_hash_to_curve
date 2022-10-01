jest.setTimeout(120000)
const crypto = require('crypto')
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'

import { bigint_to_array } from './utils'
import { sqrt_mod_p } from '../utils'

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
            expect(out).toEqual(expected_registers[i])
        }
    })

    it('Z * u^2', async () => {
        const u_squared = bigint_to_array(64, 4, (u0 * u0) % p)
        const expected_registers: bigint[] = bigint_to_array(64, 4, (Z * (u0 * u0)) % p)
        const circuit = 'z_mul_u_squared_test'
        const circuitInputs = stringifyBigInts({ u_squared })
        const witness = await genWitness(circuit, circuitInputs)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            expect(out).toEqual(expected_registers[i])
        }
    })

    it('x1 = tv1 + tv2', async () => {
        const tv1 = (Z * u0 * u0) % p
        const tv2 = (tv1 * tv1) % p

        expect(tv1).toEqual(BigInt('20859123609890259037730945376790481235073009751836911085977936258096472725432'))
        expect(tv2).toEqual(BigInt('69125977817722673093369867421906949146947726600759336378042760386702683237276'))

        const tv1_registers = bigint_to_array(64, 4, tv1)
        const tv2_registers = bigint_to_array(64, 4, tv2)
        const expected_registers = bigint_to_array(64, 4, (tv1 + tv2) % p)

        const x1_registers = bigint_to_array(64, 4, BigInt('89985101427612932131100812798697430382020736352596247464020696644799155962708'))
        for (let i = 0; i < 4; i ++) {
            expect(x1_registers[i]).toEqual(expected_registers[i])
        }

        const circuit = 'tv2_plus_tv1_test'
        const circuitInputs = stringifyBigInts({
            a: tv1_registers,
            b: tv2_registers,
        })
        const witness = await genWitness(circuit, circuitInputs)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            expect(out).toEqual(expected_registers[i])
        }
    })

    it('x1 = inv0(x1)', async () => {
        const x1 = BigInt('89985101427612932131100812798697430382020736352596247464020696644799155962708')
        const inv_x1 = BigInt('8772949712675871307975074402064985445164432129069910775576927500367828979411')
        const x1_registers = bigint_to_array(64, 4, x1)
        const inv_x1_registers = bigint_to_array(64, 4, inv_x1)
        const circuit = 'inv0_test'
        const circuitInputs = stringifyBigInts({
            a: x1_registers,
        })
        const witness = await genWitness(circuit, circuitInputs)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            expect(out).toEqual(inv_x1_registers[i])
        }
    })

    it('cmov', async () => {
        const circuit = 'cmov_test'
        const a = BigInt(123)
        const b = BigInt(456)
        const circuitInputs = stringifyBigInts({ a, b, c: 0 })
        const witness = await genWitness(circuit, circuitInputs)
        const out = BigInt(await getSignalByName(circuit, witness, 'main.out'))
        expect(out).toEqual(a)

        const circuitInputs2 = stringifyBigInts({ a, b, c: 1 })
        const witness2 = await genWitness(circuit, circuitInputs2)
        const out2 = BigInt(await getSignalByName(circuit, witness2, 'main.out'))
        expect(out2).toEqual(b)
    })

    it('is_square', async() => {
        const circuit = 'is_square_test'
        const n = BigInt('90488382598551863334512914506083217651378280855023645338709486233743148212823')
        const expected_sqrt_mod_p = BigInt('26747645647114029413939469563206094538114691466623191143901133893381837269477')
        expect((expected_sqrt_mod_p * expected_sqrt_mod_p) % p).toEqual(n)

        const expected_sqrt_mod_p_array = bigint_to_array(64, 4, expected_sqrt_mod_p)

        // Test if (expected_sqrt_mod_p ^ 2 == n) mod p - should output 1
        const n_array = bigint_to_array(64, 4, n)
        const circuitInputs = stringifyBigInts({ n: n_array, expected_sqrt: expected_sqrt_mod_p_array })
        const witness = await genWitness(circuit, circuitInputs)
        const out = BigInt(await getSignalByName(circuit, witness, 'main.out'))
        expect(out).toEqual(BigInt(1))

        // Test if (expected_sqrt_mod_p ^ 2 == (n+1)) mod p - should output 0
        const n_array2 = bigint_to_array(64, 4, n + BigInt(1))
        const circuitInputs2 = stringifyBigInts({ n: n_array2, expected_sqrt: expected_sqrt_mod_p_array })
        const witness2 = await genWitness(circuit, circuitInputs2)
        const out2 = BigInt(await getSignalByName(circuit, witness2, 'main.out'))
        expect(out2).toEqual(BigInt(0))
    })

    it('sgn0()', async() => {
        const circuit = 'sgn0_test'
        const odd = BigInt('90488382598551863334512914506083217651378280855023645338709486233743148212823')
        const even = BigInt('90488382598551863334512914506083217651378280855023645338709486233743148212822')

        for (const val of [odd, even]) {
            const circuitInputs = stringifyBigInts({ 'in': bigint_to_array(64, 4, val) })
            const witness = await genWitness(circuit, circuitInputs)
            const out = BigInt(await getSignalByName(circuit, witness, 'main.out'))
            expect(out).toEqual(val % BigInt(2))
        }
    })

    it('MapToCurve()', async() => {
        const circuit = 'map_to_curve_test'
        const circuitInputs = stringifyBigInts({ u: bigint_to_array(64, 4, u0) })
        const witness = await genWitness(circuit, circuitInputs)
        const x = BigInt(await getSignalByName(circuit, witness, 'main.x'))
        const y = BigInt(await getSignalByName(circuit, witness, 'main.y'))
        console.log(x, '\n', y)
    })
})
