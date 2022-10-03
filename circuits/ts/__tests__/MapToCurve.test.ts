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
const A = BigInt('28734576633528757162648956269730739219262246272443394170905244663053633733939')
const B = BigInt('1771')
const Z = BigInt('115792089237316195423570985008687907853269984665640564039457584007908834671652')
const Z_registers = bigint_to_array(64, 4, Z)
const c1 = BigInt('5324262023205125242632636178842408935272934169651804884418803605709653231043')
const c2 = BigInt('31579660701086235115519359547823974869073632181538335647124795638520591274090')

describe('MapToCurve', () => {
    //it('u ** 2', async () => {
        //const expected_registers: bigint[] = bigint_to_array(64, 4, (u0 * u0) % p)

        //const circuit = 'u_squared_test'
        //const circuitInputs = stringifyBigInts({ val: u0_registers })
        //const witness = await genWitness(circuit, circuitInputs)
        //for (let i = 0; i < 4; i ++) {
            //const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //expect(out).toEqual(expected_registers[i])
        //}
    //})

    //it('Z * u^2', async () => {
        //const u_squared = bigint_to_array(64, 4, (u0 * u0) % p)
        //const expected_registers: bigint[] = bigint_to_array(64, 4, (Z * (u0 * u0)) % p)
        //const circuit = 'z_mul_u_squared_test'
        //const circuitInputs = stringifyBigInts({ u_squared })
        //const witness = await genWitness(circuit, circuitInputs)
        //for (let i = 0; i < 4; i ++) {
            //const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //expect(out).toEqual(expected_registers[i])
        //}
    //})

    //it('x1 = tv1 + tv2', async () => {
        //const tv1 = (Z * u0 * u0) % p
        //const tv2 = (tv1 * tv1) % p

        //expect(tv1).toEqual(BigInt('20859123609890259037730945376790481235073009751836911085977936258096472725432'))
        //expect(tv2).toEqual(BigInt('69125977817722673093369867421906949146947726600759336378042760386702683237276'))

        //const tv1_registers = bigint_to_array(64, 4, tv1)
        //const tv2_registers = bigint_to_array(64, 4, tv2)
        //const expected_registers = bigint_to_array(64, 4, (tv1 + tv2) % p)

        //const x1_registers = bigint_to_array(64, 4, BigInt('89985101427612932131100812798697430382020736352596247464020696644799155962708'))
        //for (let i = 0; i < 4; i ++) {
            //expect(x1_registers[i]).toEqual(expected_registers[i])
        //}

        //const circuit = 'tv2_plus_tv1_test'
        //const circuitInputs = stringifyBigInts({
            //a: tv1_registers,
            //b: tv2_registers,
        //})
        //const witness = await genWitness(circuit, circuitInputs)
        //for (let i = 0; i < 4; i ++) {
            //const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //expect(out).toEqual(expected_registers[i])
        //}
    //})

    //it('x1 = inv0(x1)', async () => {
        //const x1 = BigInt('89985101427612932131100812798697430382020736352596247464020696644799155962708')
        //const inv_x1 = BigInt('8772949712675871307975074402064985445164432129069910775576927500367828979411')
        //const x1_registers = bigint_to_array(64, 4, x1)
        //const inv_x1_registers = bigint_to_array(64, 4, inv_x1)
        //const circuit = 'inv0_test'
        //const circuitInputs = stringifyBigInts({
            //a: x1_registers,
        //})
        //const witness = await genWitness(circuit, circuitInputs)
        //for (let i = 0; i < 4; i ++) {
            //const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //expect(out).toEqual(inv_x1_registers[i])
        //}
    //})

    //it('cmov', async () => {
        //const circuit = 'cmov_test'
        //const a = BigInt('89985101427612932131100812798697430382020736352596247464020696644799155962708')
        //const b = BigInt('456')
        //const a_array = bigint_to_array(64, 4, a)
        //const b_array = bigint_to_array(64, 4, b)

        //const circuitInputs = stringifyBigInts({ a: a_array, b: a_array, c: 0 })
        //const witness = await genWitness(circuit, circuitInputs)
        //for (let i = 0; i < 4; i ++) {
            //const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //expect(out).toEqual(a_array[i])
        //}

        //const circuitInputs2 = stringifyBigInts({ a: a_array, b: b_array, c: 1 })
        //const witness2 = await genWitness(circuit, circuitInputs2)
        //for (let i = 0; i < 4; i ++) {
            //const out = BigInt(await getSignalByName(circuit, witness2, 'main.out[' + i.toString() + ']'))
            //expect(out).toEqual(b_array[i])
        //}
    //})

    //it('is_square', async() => {
        //const circuit = 'is_square_test'
        //const n = BigInt('90488382598551863334512914506083217651378280855023645338709486233743148212823')
        //const expected_sqrt_mod_p = BigInt('26747645647114029413939469563206094538114691466623191143901133893381837269477')
        //expect((expected_sqrt_mod_p * expected_sqrt_mod_p) % p).toEqual(n)

        //const expected_sqrt_mod_p_array = bigint_to_array(64, 4, expected_sqrt_mod_p)

        //// Test if (expected_sqrt_mod_p ^ 2 == n) mod p - should output 1
        //const n_array = bigint_to_array(64, 4, n)
        //const circuitInputs = stringifyBigInts({ n: n_array, expected_sqrt: expected_sqrt_mod_p_array })
        //const witness = await genWitness(circuit, circuitInputs)
        //const out = BigInt(await getSignalByName(circuit, witness, 'main.out'))
        //expect(out).toEqual(BigInt(1))

        //// Test if (expected_sqrt_mod_p ^ 2 == (n+1)) mod p - should output 0
        //const n_array2 = bigint_to_array(64, 4, n + BigInt(1))
        //const circuitInputs2 = stringifyBigInts({ n: n_array2, expected_sqrt: expected_sqrt_mod_p_array })
        //const witness2 = await genWitness(circuit, circuitInputs2)
        //const out2 = BigInt(await getSignalByName(circuit, witness2, 'main.out'))
        //expect(out2).toEqual(BigInt(0))
    //})

    //it('sgn0()', async() => {
        //const circuit = 'sgn0_test'
        //const odd = BigInt('90488382598551863334512914506083217651378280855023645338709486233743148212823')
        //const even = BigInt('90488382598551863334512914506083217651378280855023645338709486233743148212822')

        //for (const val of [odd, even]) {
            //const circuitInputs = stringifyBigInts({ 'in': bigint_to_array(64, 4, val) })
            //const witness = await genWitness(circuit, circuitInputs)
            //const out = BigInt(await getSignalByName(circuit, witness, 'main.out'))
            //expect(out).toEqual(val % BigInt(2))
        //}
    //})

    it('MapToCurve()', async() => {
        const circuit = 'map_to_curve_test'
        const circuitInputs = stringifyBigInts({ u: bigint_to_array(64, 4, u0) })
        const witness = await genWitness(circuit, circuitInputs)
        const x = BigInt(await getSignalByName(circuit, witness, 'main.x'))
        const y = BigInt(await getSignalByName(circuit, witness, 'main.y'))

        // Step 1 check
        const step1_tv1 = (Z * (u0 * u0)) % p
        const step1_tv1_array = bigint_to_array(64, 4, step1_tv1)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step1_tv1.out[' + i.toString() + ']'))
            expect(out).toEqual(step1_tv1_array[i])
        }

        // Step 2 check
        const step2_tv2 = (step1_tv1 * step1_tv1) % p
        const step2_tv2_array = bigint_to_array(64, 4, step2_tv2)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step2_tv2.out[' + i.toString() + ']'))
            expect(out).toEqual(step2_tv2_array[i])
        }
  
        // Step 3 check
        const step3_tv1_plus_tv2_array = bigint_to_array(64, 4, BigInt('89985101427612932131100812798697430382020736352596247464020696644799155962708'))
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step3_tv1_plus_tv2.out[' + i.toString() + ']'))
            expect(out).toEqual(step3_tv1_plus_tv2_array[i])
        }

        // Step 4 check
        const step4_inv0_x1_array = bigint_to_array(64, 4, BigInt('8772949712675871307975074402064985445164432129069910775576927500367828979411'))
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step4_inv0_x1.out[' + i.toString() + ']'))
            expect(out).toEqual(step4_inv0_x1_array[i])
        }

        // Step 5 check
        const step5_e1 = BigInt(await getSignalByName(circuit, witness, 'main.step5_e1.out'))
        expect(step5_e1).toEqual(BigInt(0))

        // Step 6 check
        const step6_x1_plus_1 = BigInt('8772949712675871307975074402064985445164432129069910775576927500367828979411') + BigInt(1)
        const step6_x1_plus_1_array = bigint_to_array(64, 4, step6_x1_plus_1)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step6_x1_plus_1.out[' + i.toString() + ']'))
            expect(out).toEqual(step6_x1_plus_1_array[i])
        }

        // Step 7 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step7_cmov.out[' + i.toString() + ']'))
            expect(out).toEqual(step6_x1_plus_1_array[i])
        }

        // Step 8 check
        const step8_x1_mul_c1 = (step6_x1_plus_1 * c1) % p
        const step8_x1_mul_c1_array = bigint_to_array(64, 4, step8_x1_mul_c1)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step8_x1_mul_c1.out[' + i.toString() + ']'))
            expect(out).toEqual(step8_x1_mul_c1_array[i])
        }

        // Step 9 check
        const gx1 = (step8_x1_mul_c1 * step8_x1_mul_c1) % p
        const step9_gx1_array = bigint_to_array(64, 4, gx1)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step9_gx1.out[' + i.toString() + ']'))
            expect(out).toEqual(step9_gx1_array[i])
        }

        // Step 10 check
        const step10_gx1 = (gx1 + A) % p
        const step10_gx1_array = bigint_to_array(64, 4, step10_gx1)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step10_gx1.out[' + i.toString() + ']'))
            expect(out).toEqual(step10_gx1_array[i])
        }

        // Step 11 check
        const step11_gx1_mul_x1 = (step10_gx1 * step8_x1_mul_c1) % p
        const step11_gx1_mul_x1_array = bigint_to_array(64, 4, step11_gx1_mul_x1)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step11_gx1_mul_x1.out[' + i.toString() + ']'))
            expect(out).toEqual(step11_gx1_mul_x1_array[i])
        }

        // Step 12 check
        const step12_gx1 = (step11_gx1_mul_x1 + B) % p
        const step12_gx1_array = bigint_to_array(64, 4, step12_gx1)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step12_gx1.out[' + i.toString() + ']'))
            expect(out).toEqual(step12_gx1_array[i])
        }
 
        // Step 13 check
        const step13_x2 = (step1_tv1 * step8_x1_mul_c1) % p
        const step13_x2_array = bigint_to_array(64, 4, step13_x2)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step13_x2.out[' + i.toString() + ']'))
            expect(out).toEqual(step13_x2_array[i])
        }
 
        // Step 14 check
        const step14_tv2 = (step1_tv1 * step2_tv2) % p
        const step14_tv2_array = bigint_to_array(64, 4, step14_tv2)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step14_tv2.out[' + i.toString() + ']'))
            expect(out).toEqual(step14_tv2_array[i])
        }
 
        // Step 15 check
        const step15_gx2 = (step2_tv2 * step14_tv2) % p
        const step15_gx2_array = bigint_to_array(64, 4, step15_gx2)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step15_gx2.out[' + i.toString() + ']'))
            expect(out).toEqual(step15_gx2_array[i])
        }
 
        // Step 16 check
        //const sqrt_gx1 = sqrt_mod_p(step12_gx1, p)

        // Step 17 check
 
        // Step 18 check
 
        // Step 19 check
 
        // Step 20 check
 
    })
})
