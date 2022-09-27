jest.setTimeout(120000)
const crypto = require('crypto')
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'
import { bigint_to_array } from './utils'

describe('HashToField', () => {
    const msg = [97, 98, 99] // "abc"
    const expected_u0_registers = [
        BigInt('5220784225879993185'),
        BigInt('4488152950487114122'),
        BigInt('6926039108402729460'),
        BigInt('1336068656303022583'),
    ]

    const expected_u1_registers = [
        BigInt('5596462452035853824'),
        BigInt('5988634572027431684'),
        BigInt('1427920136467682780'),
        BigInt('6383771510115767720'),
    ]

    it('HashToField', async () => {
        const circuit = 'hash_to_field_test'
        const circuitInputs = stringifyBigInts({ msg })
        const witness = await genWitness(circuit, circuitInputs)

        // u0
        const u0_registers: bigint[] = []
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.u[0][' + i.toString() + ']'))
            u0_registers.push(out)
            expect(out).toEqual(expected_u0_registers[i])
        }
        expect(bigint_to_array(64, 4, BigInt('8386638881075453792406600069412283052291822895580742641789327979312054938465'))).toEqual(u0_registers)
        // u1
        const u1_registers: bigint[] = []
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.u[1][' + i.toString() + ']'))
            u1_registers.push(out)
            expect(out).toEqual(expected_u1_registers[i])
        }
        expect(bigint_to_array(64, 4, BigInt('40071583224459737250239606232440854032076176808341187421679277989916398099968'))).toEqual(u1_registers)
    })
 
    const p = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F')
    it('BytesToRegisters (all bytes are 255)', async () => {
        const circuit = 'bytes_to_registers_test'
        const bytes: number[] = []
        for (let i = 0; i < 48; i ++) {
            bytes.push(255)
        }

        const expected_registers = bigint_to_array(
            64,
            4,
            BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') % p
        )
        const circuitInputs = stringifyBigInts({ bytes })
        const witness = await genWitness(circuit, circuitInputs)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            expect(out).toEqual(expected_registers[i])
        }
    })

    it('BytesToRegisters (for u0)', async () => {
        const bytes = [
            232, 52, 124, 173, 72, 171, 78, 49, 157, 123, 39, 85, 32, 234, 129,
            207, 18, 138, 171, 93, 54, 121, 161, 247, 96, 30, 59, 222, 172,
            154, 81, 208, 197, 77, 255, 208, 84, 39, 78, 219, 36, 136, 85, 230,
            17, 144, 196, 98
        ]

        const circuit = 'bytes_to_registers_test'
        const circuitInputs = stringifyBigInts({ bytes: bytes })
        const witness = await genWitness(circuit, circuitInputs)
        const registers: bigint[] = []
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            expect(out.toString()).toEqual(expected_u0_registers[i].toString())
        }
    })
})

