jest.setTimeout(120000)
const crypto = require('crypto')
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'

import { bigint_to_array } from './utils'
import {
    iso_map,
    compute_x_num,
    compute_x_den,
    compute_y_num,
    compute_y_den,
} from '../iso_map'
import { sqrt_mod_p } from '../utils'

const p = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F')
const test_cases: any[] = [
    {
        x_out: BigInt('109847960678874069395357325452026395105140293515447328048593769534097129836981'),
        y_out: BigInt('26747645647114029413939469563206094538114691466623191143901133893381837269477'),
        expected_x: BigInt('0x07dd9432d426845fb19857d1b3a91722436604ccbbbadad8523b8fc38a5322d7'),
        expected_y: BigInt('0x604588ef5138cffe3277bbd590b8550bcbe0e523bbaf1bed4014a467122eb33f'),
    },
    {
        x_out: BigInt('95747712435547668378765549993819480138391130494145532428970724587426680705447'),
        y_out: BigInt('24586358576631698449083237381902966339991415142283656103974565296768092405604'),
        expected_x: BigInt('0xe9ef9794d15d4e77dde751e06c182782046b8dac05f8491eb88764fc65321f78'),
        expected_y: BigInt('0xcb07ce53670d5314bf236ee2c871455c562dd76314aa41f012919fe8e7f717b3'),
    }
]

describe('IsoMap', () => {
    it('XNum circuit', async () => {
        const circuit = 'xnum_test'
        for (const test_case of test_cases) {
            const x = BigInt(test_case.x_out)
            const x_2 = (x * x) % p
            const x_3 = (x * x * x) % p
            const expected_x_num = compute_x_num(x, p)
            const expected_x_num_array = bigint_to_array(64, 4, expected_x_num)
            const circuitInputs = stringifyBigInts({ 
                x: bigint_to_array(64, 4, x),
                x_2: bigint_to_array(64, 4, x_2),
                x_3: bigint_to_array(64, 4, x_3),
            })
            const witness = await genWitness(circuit, circuitInputs)
            for (let i = 0; i < 4; i ++) {
                const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
                expect(out).toEqual(expected_x_num_array[i])
            }
        }
    })

    it('XDen circuit', async () => {
        const circuit = 'xden_test'
        for (const test_case of test_cases) {
            const x = BigInt(test_case.x_out)
            const x_2 = (x * x) % p
            const expected_x_den = compute_x_den(x, p)
            const expected_x_den_array = bigint_to_array(64, 4, expected_x_den)
            const circuitInputs = stringifyBigInts({ 
                x: bigint_to_array(64, 4, x),
                x_2: bigint_to_array(64, 4, x_2),
            })
            const witness = await genWitness(circuit, circuitInputs)
            for (let i = 0; i < 4; i ++) {
                const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
                expect(out).toEqual(expected_x_den_array[i])
            }
        }
    })

    it('YNum circuit', async () => {
        const circuit = 'ynum_test'
        for (const test_case of test_cases) {
            const x = BigInt(test_case.x_out)
            const x_2 = (x * x) % p
            const x_3 = (x * x * x) % p
            const expected_y_num = compute_y_num(x, p)
            const expected_y_num_array = bigint_to_array(64, 4, expected_y_num)
            const circuitInputs = stringifyBigInts({ 
                x: bigint_to_array(64, 4, x),
                x_2: bigint_to_array(64, 4, x_2),
                x_3: bigint_to_array(64, 4, x_3),
            })
            const witness = await genWitness(circuit, circuitInputs)
            for (let i = 0; i < 4; i ++) {
                const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
                expect(out).toEqual(expected_y_num_array[i])
            }
        }
    })

    it('YDen circuit', async () => {
        const circuit = 'yden_test'
        for (const test_case of test_cases) {
            const x = BigInt(test_case.x_out)
            const x_2 = (x * x) % p
            const x_3 = (x * x * x) % p
            const expected_y_den = compute_y_den(x, p)
            const expected_y_den_array = bigint_to_array(64, 4, expected_y_den)
            const circuitInputs = stringifyBigInts({ 
                x: bigint_to_array(64, 4, x),
                x_2: bigint_to_array(64, 4, x_2),
                x_3: bigint_to_array(64, 4, x_3),
            })
            const witness = await genWitness(circuit, circuitInputs)
            for (let i = 0; i < 4; i ++) {
                const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
                expect(out).toEqual(expected_y_den_array[i])
            }
        }
    })

    it('iso_map()', async () => {
        for (const test_case of test_cases) {
            const { x, y } = iso_map(test_case.x_out, test_case.y_out, p)
            expect(x).toEqual(test_case.expected_x)
            expect(y).toEqual(test_case.expected_y)
        }
    })
 
    it('IsoMap circuit', async () => {
        const circuit = 'iso_map_test'
        for (const test_case of test_cases) {
            const x = BigInt(test_case.x_out)
            const y = BigInt(test_case.y_out)
            const mapped = iso_map(test_case.x_out, test_case.y_out, p)
            const circuitInputs = stringifyBigInts({ 
                x: bigint_to_array(64, 4, x),
                y: bigint_to_array(64, 4, y),
                x_mapped: bigint_to_array(64, 4, mapped.x),
                y_mapped: bigint_to_array(64, 4, mapped.y),
            })
            const witness = await genWitness(circuit, circuitInputs)
        }
    })
})
