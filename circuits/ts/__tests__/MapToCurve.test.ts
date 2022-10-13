jest.setTimeout(120000)
const crypto = require('crypto')
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'

import { bigint_to_array } from '../utils'
import { iso_map } from '../iso_map'
import { sqrt_mod_p, sgn0 } from '../utils'
import {
    map_to_curve,
    expand_msg_xmd,
    generate_inputs,
} from '../generate_inputs'

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
const field = new ff.F1Field(p)

describe('MapToCurve', () => {
    it('u ** 2', async () => {
        const expected_registers: bigint[] = bigint_to_array(64, 4, (u0 * u0) % p)

        const circuit = 'u_squared_test'
        const circuitInputs = stringifyBigInts({ 'in': u0_registers })
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
        const a = BigInt('89985101427612932131100812798697430382020736352596247464020696644799155962708')
        const b = BigInt('456')
        const a_array = bigint_to_array(64, 4, a)
        const b_array = bigint_to_array(64, 4, b)

        const circuitInputs = stringifyBigInts({ a: a_array, b: a_array, c: 0 })
        const witness = await genWitness(circuit, circuitInputs)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            expect(out).toEqual(a_array[i])
        }

        const circuitInputs2 = stringifyBigInts({ a: a_array, b: b_array, c: 1 })
        const witness2 = await genWitness(circuit, circuitInputs2)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness2, 'main.out[' + i.toString() + ']'))
            expect(out).toEqual(b_array[i])
        }
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

    it('XY2Selector()', async() => {
        const circuit = 'x_y2_selector_test'

        const test_suites: any[] = [
            {
                gx1: BigInt(4),
                gx1_sqrt: BigInt(2),
                gx2: BigInt(5),
                gx2_sqrt: BigInt(2),
                x1: BigInt(123),
                x2: BigInt(456),
            },
            {
                gx1: BigInt(5),
                gx1_sqrt: BigInt(2),
                gx2: BigInt(4),
                gx2_sqrt: BigInt(2),
                x1: BigInt(123),
                x2: BigInt(456),
            },
        ]
        for (const suite of test_suites) {
            const s1 = suite.gx1_sqrt * suite.gx1_sqrt
            const s2 = suite.gx2_sqrt * suite.gx2_sqrt

            let x = 0
            if (s1 === suite.gx1) { x += 1 }
            if (s2 === suite.gx2) { x += 1 }
            expect(x).toEqual(1)

            const expected_x = s1 === suite.gx1 ? suite.x1 : suite.x2
            const expected_y2 = s1 === suite.gx1 ? suite.gx1 : suite.gx2
            const expected_x_array = bigint_to_array(64, 4, expected_x)
            const expected_y2_array = bigint_to_array(64, 4, expected_y2)
            const circuitInputs = stringifyBigInts({
                gx1: bigint_to_array(64, 4, suite.gx1),
                gx1_sqrt: bigint_to_array(64, 4, suite.gx1_sqrt),
                gx2: bigint_to_array(64, 4, suite.gx2),
                gx2_sqrt: bigint_to_array(64, 4, suite.gx2_sqrt),
                x1: bigint_to_array(64, 4, suite.x1),
                x2: bigint_to_array(64, 4, suite.x2),
            })
            const witness = await genWitness(circuit, circuitInputs)

            for (let i = 0; i < 4; i ++) {
                const x = BigInt(await getSignalByName(circuit, witness, 'main.x[' + i.toString() + ']'))
                const y2 = BigInt(await getSignalByName(circuit, witness, 'main.y2[' + i.toString() + ']'))
                expect(x).toEqual(expected_x_array[i])
                expect(y2).toEqual(expected_y2_array[i])
            }
        }
    })

    it('Negate()', async() => {
        const circuit = 'negate_test'
        const a = BigInt(5)
        const expected_neg_a = p - BigInt(5)
        const expected_neg_a_array = bigint_to_array(64, 4, expected_neg_a)

        // Generate witness
        const circuitInputs = stringifyBigInts({
            'in': bigint_to_array(64, 4, a),
        })
        const witness = await genWitness(circuit, circuitInputs)

        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            expect(out).toEqual(expected_neg_a_array[i])
        }
    })

    it('MapToCurve()', async() => {
        const circuit = 'map_to_curve_test'

        // Step 1
        const step1_tv1 = (Z * (u0 * u0)) % p
        const step1_tv1_array = bigint_to_array(64, 4, step1_tv1)
        // Step 2
        const step2_tv2 = (step1_tv1 * step1_tv1) % p
        const step2_tv2_array = bigint_to_array(64, 4, step2_tv2)
        // Step 3
        const step3_tv1_plus_tv2 = (step1_tv1 + step2_tv2) % p
        const step3_tv1_plus_tv2_array = bigint_to_array(64, 4, step3_tv1_plus_tv2)
        // Step 4
        const step4_inv0_x1 = field.inv(step3_tv1_plus_tv2)
        const step4_inv0_x1_array = bigint_to_array(64, 4, step4_inv0_x1)
        // Step 6
        const step6_x1_plus_1 = step4_inv0_x1 + BigInt(1)
        const step6_x1_plus_1_array = bigint_to_array(64, 4, step6_x1_plus_1)
        // Step 8 check
        const step8_x1_mul_c1 = (step6_x1_plus_1 * c1) % p
        const step8_x1_mul_c1_array = bigint_to_array(64, 4, step8_x1_mul_c1)
        // Step 9
        const gx1 = (step8_x1_mul_c1 * step8_x1_mul_c1) % p
        const step9_gx1_array = bigint_to_array(64, 4, gx1)
        // Step 10
        const step10_gx1 = (gx1 + A) % p
        const step10_gx1_array = bigint_to_array(64, 4, step10_gx1)
        // Step 11
        const step11_gx1_mul_x1 = (step10_gx1 * step8_x1_mul_c1) % p
        const step11_gx1_mul_x1_array = bigint_to_array(64, 4, step11_gx1_mul_x1)
        // Step 12
        const step12_gx1 = (step11_gx1_mul_x1 + B) % p
        const step12_gx1_array = bigint_to_array(64, 4, step12_gx1)
        // Step 13
        const step13_x2 = (step1_tv1 * step8_x1_mul_c1) % p
        const step13_x2_array = bigint_to_array(64, 4, step13_x2)
        // Step 14
        const step14_tv2 = (step1_tv1 * step2_tv2) % p
        const step14_tv2_array = bigint_to_array(64, 4, step14_tv2)
        // Step 15
        const step15_gx2 = (step12_gx1 * step14_tv2) % p
        const step15_gx2_array = bigint_to_array(64, 4, step15_gx2)
        // Step 16
        let gx1_sqrt = field.sqrt(step12_gx1)
        let gx2_sqrt = field.sqrt(step15_gx2)
        let step16_expected_x
        let step16_expected_y2
        if (gx1_sqrt == null) {
            gx1_sqrt = BigInt(1)
            step16_expected_x = step13_x2
            step16_expected_y2 = step15_gx2
        }

        if (gx2_sqrt == null) {
            gx2_sqrt = BigInt(1)
            step16_expected_x = step8_x1_mul_c1
            step16_expected_y2 = step12_gx1
        }
        const step16_expected_x_array = bigint_to_array(64, 4, step16_expected_x)
        const step16_expected_y2_array = bigint_to_array(64, 4, step16_expected_y2)
        // Step 19
        const step19_sqrt_y2 = field.sqrt(step16_expected_y2)
        const step19_sqrt_y2_array = bigint_to_array(64, 4, step16_expected_y2)
        expect(step19_sqrt_y2).not.toEqual(null)

        const mapped = iso_map(step16_expected_x, step19_sqrt_y2, p)

        // Generate witness
        const circuitInputs = stringifyBigInts({
            u: bigint_to_array(64, 4, u0),
            gx1_sqrt: bigint_to_array(64, 4, gx1_sqrt),
            gx2_sqrt: bigint_to_array(64, 4, gx2_sqrt),
            y_pos: bigint_to_array(64, 4, step19_sqrt_y2),
            x_mapped: bigint_to_array(64, 4, mapped.x),
            y_mapped: bigint_to_array(64, 4, mapped.y),
        })
        const witness = await genWitness(circuit, circuitInputs)

        // Step 1 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step1_tv1.out[' + i.toString() + ']'))
            expect(out).toEqual(step1_tv1_array[i])
        }

        // Step 2 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step2_tv2.out[' + i.toString() + ']'))
            expect(out).toEqual(step2_tv2_array[i])
        }
  
        // Step 3 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step3_tv1_plus_tv2.out[' + i.toString() + ']'))
            expect(out).toEqual(step3_tv1_plus_tv2_array[i])
        }

        // Step 4 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step4_inv0_x1.out[' + i.toString() + ']'))
            expect(out).toEqual(step4_inv0_x1_array[i])
        }

        // Step 5 check
        const step5_e1 = BigInt(await getSignalByName(circuit, witness, 'main.step5_e1.out'))
        expect(step5_e1).toEqual(BigInt(0))

        // Step 6 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step6_x1_plus_1.out[' + i.toString() + ']'))
            expect(out).toEqual(step6_x1_plus_1_array[i])
        }

        // Step 7 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step7_cmov.out[' + i.toString() + ']'))
            expect(out).toEqual(step6_x1_plus_1_array[i])
        }

        // Step 8
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step8_x1_mul_c1.out[' + i.toString() + ']'))
            expect(out).toEqual(step8_x1_mul_c1_array[i])
        }

        // Step 9 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step9_gx1.out[' + i.toString() + ']'))
            expect(out).toEqual(step9_gx1_array[i])
        }

        // Step 10 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step10_gx1.out[' + i.toString() + ']'))
            expect(out).toEqual(step10_gx1_array[i])
        }

        // Step 11 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step11_gx1_mul_x1.out[' + i.toString() + ']'))
            expect(out).toEqual(step11_gx1_mul_x1_array[i])
        }

        // Step 12 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step12_gx1.out[' + i.toString() + ']'))
            expect(out).toEqual(step12_gx1_array[i])
        }
 
        // Step 13 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step13_x2.out[' + i.toString() + ']'))
            expect(out).toEqual(step13_x2_array[i])
        }
 
        // Step 14 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step14_tv2.out[' + i.toString() + ']'))
            expect(out).toEqual(step14_tv2_array[i])
        }
 
        // Step 15 check
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.step15_gx2.out[' + i.toString() + ']'))
            expect(out).toEqual(step15_gx2_array[i])
        }
 
        // Steps 16-18 check
        for (let i = 0; i < 4; i ++) {
            const x = BigInt(await getSignalByName(circuit, witness, 'main.step16_x_y2_selector.x[' + i.toString() + ']'))
            const y2 = BigInt(await getSignalByName(circuit, witness, 'main.step16_x_y2_selector.y2[' + i.toString() + ']'))
            expect(x).toEqual(step16_expected_x_array[i])
            expect(y2).toEqual(step16_expected_y2_array[i])
        }
 
        // Step 19 check
        for (let i = 0; i < 4; i ++) {
            const step19_expected_y2 = BigInt(await getSignalByName(circuit, witness, 'main.step19_expected_y2.out[' + i.toString() + ']'))
            expect(step19_expected_y2).toEqual(step16_expected_y2_array[i])
        }
 
        // Step 20 check
        const step20_e3 = BigInt(await getSignalByName(circuit, witness, 'main.step20_e3.out'))
        const sgn0_u = sgn0(u0)
        const sgn0_y = sgn0(step19_sqrt_y2)
        expect(step20_e3).toEqual(sgn0_u === sgn0_y ? BigInt(1) : BigInt(0))

        let expected_y
        if (step20_e3 === BigInt(1)) {
            expected_y = step19_sqrt_y2
        } else {
            expected_y = p - step19_sqrt_y2
        }
        const expected_y_array = bigint_to_array(64, 4, expected_y)
 
        // Step 21 check
        for (let i = 0; i < 4; i ++) {
            const step21_x = BigInt(await getSignalByName(circuit, witness, 'main.step16_x_y2_selector.x[' + i.toString() + ']'))
            expect(step21_x).toEqual(step16_expected_x_array[i])
            const step21_y = BigInt(await getSignalByName(circuit, witness, 'main.step21_y.out[' + i.toString() + ']'))
            expect(step21_y).toEqual(expected_y_array[i])
        }

        const expected_result = map_to_curve(u0)
        expect(mapped.x).toEqual(expected_result.x)
        expect(mapped.y).toEqual(expected_result.y)
    })

    it('map_to_curve for abcdef0123456789 u1', async () => {
        const circuit = 'map_to_curve_test'
        const msg = 'abcdef0123456789'
        const uniform_bytes = expand_msg_xmd(msg)

        //const u0_bytes = uniform_bytes.slice(0, 48)
        //const u0 = ff.utils.beBuff2int(Buffer.from(u0_bytes)) % p
 
        const u1_bytes = uniform_bytes.slice(48)
        const u1 = ff.utils.beBuff2int(Buffer.from(u1_bytes)) % p

        const q1 = map_to_curve(u1)

        const inputs = generate_inputs(msg)

        // Generate witness
        const circuitInputs = stringifyBigInts({
            u: bigint_to_array(64, 4, u1),
            gx1_sqrt: inputs.q1_gx1_sqrt,
            gx2_sqrt: inputs.q1_gx2_sqrt,
            y_pos: inputs.q1_y_pos,
            x_mapped: inputs.q1_x_mapped,
            y_mapped: inputs.q1_y_mapped,
        })

        // x and y in E' - iso_map is not applied
        const expected_x_out_array = bigint_to_array(64, 4, q1.x)
        const expected_y_out_array = bigint_to_array(64, 4, q1.y)

        const witness = await genWitness(circuit, circuitInputs)
        for (let i = 0; i < 4; i ++) {
            const x_out = BigInt(await getSignalByName(circuit, witness, 'main.x[' + i.toString() + ']'))
            expect(x_out).toEqual(expected_x_out_array[i])
            const y_out = BigInt(await getSignalByName(circuit, witness, 'main.y[' + i.toString() + ']'))
            expect(y_out).toEqual(expected_y_out_array[i])
        }
    })
})
