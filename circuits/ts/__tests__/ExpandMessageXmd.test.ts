jest.setTimeout(120000)
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'
import {
    dst_prime,
    z_pad,
    lib_str,
} from '../constants'
import {
    str_to_array,
    gen_msg_prime,
    gen_b0,
    gen_b1,
    gen_b2,
    gen_b3,
    strxor,
    expand_msg_xmd,
} from '../generate_inputs'
import {
    buffer2bitArray,
    bufToPaddedBytes,
    bufToSha256PaddedBitArr
} from '../utils'
import {
} from '../generate_inputs'

describe('ExpandMessageXmd', () => {
    const msg = 'abc'
    const expected_msg_prime = gen_msg_prime(str_to_array(msg))
    const expected_msg_prime2 = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 98,
        99, 0, 96, 0, 81, 85, 85, 88, 45, 86, 48, 49, 45, 67, 83, 48, 50,
        45, 119, 105, 116, 104, 45, 115, 101, 99, 112, 50, 53, 54, 107, 49,
        95, 88, 77, 68, 58, 83, 72, 65, 45, 50, 53, 54, 95, 83, 83, 87, 85,
        95, 82, 79, 95, 49
    ]
    const expected_b0 = [
        99, 4, 75, 36, 124, 254, 65, 234, 207, 65, 212, 122, 206, 186, 87,
        48, 157, 28, 243, 255, 59, 178, 30, 40, 136, 85, 202, 99, 135, 177,
        127, 169
    ]
    const expected_hash_b0_bits = buffer2bitArray(Buffer.from(expected_b0))

    const expected_b1 = [
        232, 52, 124, 173, 72, 171, 78, 49, 157, 123, 39, 85, 32, 234, 129,
        207, 18, 138, 171, 93, 54, 121, 161, 247, 96, 30, 59, 222, 172, 154,
        81, 208
    ]

    const expected_b2 = [
        197, 77, 255, 208, 84, 39, 78, 219, 36, 136, 85, 230, 17, 144, 196, 98,
        167, 187, 97, 236, 186, 142, 64, 10, 154, 118, 213, 174, 1, 78, 135,
        255
    ]

    const expected_b3 = [
        88, 151, 182, 93, 163, 181, 149, 168, 19, 208, 253, 203, 206, 13, 49,
        111, 118, 108, 238, 235, 111, 248, 76, 222, 204, 214, 155, 224, 231,
        179, 153, 209
    ]

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

    //it('strxor test', async () => {
        //const a = [0, 10, 20, 30, 40, 50, 60, 70]
        //const b = [255, 254, 253, 252, 251, 250, 249, 248]
        //const expected_out: number[] =  [255, 244, 233, 226, 211, 200, 197, 190]
        //for (let i = 0; i < a.length; i ++) {
            //expect(a[i] ^ b[i]).toEqual(expected_out[i])
        //}

        //const circuit = 'strxor_test'
        //const circuitInputs = stringifyBigInts({ a, b })
        //const witness = await genWitness(circuit, circuitInputs)
        //const result: number[] = []
        //for (let i = 0; i < 8; i ++) {
            //const out = Number(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //result.push(out)
        //}
        //expect(result.join('')).toEqual(expected_out.join(''))
    //})

    //// Test the MsgPrime circuit
    //it('msg_prime', async () => {
        //const circuit = 'msg_prime_test'
        //const circuitInputs = stringifyBigInts({ msg: str_to_array(msg) })

        //const witness = await genWitness(circuit, circuitInputs)
        //for (let i = 0; i < 120; i ++) {
            //const out = Number(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //expect(out).toEqual(expected_msg_prime[i])
            //expect(out).toEqual(expected_msg_prime2[i])
        //}
    //})

    //// Hash msg_prime with SHA256
    //it('b0 = h(msg_prime)', async () => {
        //const hash = gen_b0(expected_msg_prime)

        //for (let i = 0; i < 32; i ++) {
            //expect(hash[i]).toEqual(expected_b0[i])
        //}
        
        //const circuitInputs = stringifyBigInts({ msg_prime: expected_msg_prime })

        //const hash_bits = buffer2bitArray(Buffer.from(hash))
        //expect(hash_bits.join('')).toEqual(expected_hash_b0_bits.join(''))

        //const circuit = 'hash_msg_prime_to_b0_test'
        //const witness = await genWitness(circuit, circuitInputs)

        //const bits: number[] = []
        //for (let i = 0; i < 256; i ++) {
            ////const out = Number(await getSignalByName(circuit, witness, 'main.hash[' + i.toString() + ']'))
            //const out = Number(witness[1 + i])
            //bits.push(out)
        //}
        //expect(bits.join('')).toEqual(hash_bits.join(''))
    //})

    //it('b1 = h(b0 || 1 || dst_prime)', async () => {
        //const hash = gen_b1(expected_b0)
        //for (let i = 0; i < 32; i ++) {
            //expect(hash[i]).toEqual(expected_b1[i])
        //}
        //const b_bits = buffer2bitArray(Buffer.from(expected_b0))
        //const circuitInputs = stringifyBigInts({ b_bits })
        //const circuit = 'hash_b0_to_b1_test'
        //const witness = await genWitness(circuit, circuitInputs)

        //const b1_bits = buffer2bitArray(Buffer.from(hash))
        //const bits: number[] = []
        //for (let i = 0; i < 256; i ++) {
            ////const out = Number(await getSignalByName(circuit, witness, 'main.bi_bits[' + i.toString() + ']'))
            //const out = Number(witness[1 + i])
            //bits.push(out)
        //}
        //expect(bits.join('')).toEqual(b1_bits.join(''))
    //})

    //it('b2 = h(strxor(b0, b1) || 2 || dst_prime)', async () => {
        //const hash = gen_b2(expected_b0, expected_b1)
        //for (let i = 0; i < 32; i ++) {
            //expect(hash[i]).toEqual(expected_b2[i])
        //}
        //const b0_bits = buffer2bitArray(Buffer.from(expected_b0))
        //const bi_minus_one_bits = buffer2bitArray(Buffer.from(expected_b1))
        //const circuitInputs = stringifyBigInts({ b0_bits, bi_minus_one_bits })
        //const circuit = 'hash_b1_to_b2_test'
        //const witness = await genWitness(circuit, circuitInputs)
        //const b2_bits = buffer2bitArray(Buffer.from(hash))
        //const bits: number[] = []
        //for (let i = 0; i < 256; i ++) {
            ////const out = Number(await getSignalByName(circuit, witness, 'main.bi_bits[' + i.toString() + ']'))
            //const out = Number(witness[1 + i])
            //bits.push(out)
        //}
        //expect(bits.join('')).toEqual(b2_bits.join(''))
    //})

    //it('b3 = h(strxor(b0, b2) || 3 || dst_prime)', async () => {
        //const hash = gen_b3(expected_b0, expected_b2)
        //for (let i = 0; i < 32; i ++) {
            //expect(hash[i]).toEqual(expected_b3[i])
        //}
        //const b0_bits = buffer2bitArray(Buffer.from(expected_b0))
        //const bi_minus_one_bits = buffer2bitArray(Buffer.from(expected_b2))
        //const circuitInputs = stringifyBigInts({ b0_bits, bi_minus_one_bits })
        //const circuit = 'hash_b2_to_b3_test'
        //const witness = await genWitness(circuit, circuitInputs)
        //const b2_bits = buffer2bitArray(Buffer.from(hash))
        //const bits: number[] = []
        //for (let i = 0; i < 256; i ++) {
            ////const out = Number(await getSignalByName(circuit, witness, 'main.bi_bits[' + i.toString() + ']'))
            //const out = Number(witness[1 + i])
            //bits.push(out)
        //}
        //expect(bits.join('')).toEqual(b2_bits.join(''))
    //})

    //it('ExpandMessageXmd', async () => {
        //const circuit = 'expand_msg_xmd_test'
        //const circuitInputs = stringifyBigInts({ msg: str_to_array(msg) })

        //const witness = await genWitness(circuit, circuitInputs)

        //const bytes: number[] = []
        //for (let i = 0; i < 96; i ++) {
            ////const out = Number(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //const out = Number(witness[1 + i])
            //bytes.push(out)
        //}

        //const expected = expand_msg_xmd(msg)
        //expect(expected.length).toEqual(bytes.length)
        //for (let i = 0; i < 96; i ++) {
            //expect(bytes[i]).toEqual(expected[i])
        //}
    //})

    //it('ZeroSandwich (valid)', async () => {
        //const circuit = 'zero_sandwich_test'
        //const circuitInputs = stringifyBigInts({
            //in: [0, 0, 0, 0, 5, 6, 0, 0],
            //substring_length: 2,
        //})

        //const witness = await genWitness(circuit, circuitInputs)
    //})

    //it('ZeroSandwich (invalid)', async () => {
        //const circuit = 'zero_sandwich_test'
        //const circuitInputs = stringifyBigInts({
            //in: [0, 0, 0, 0, 5, 6, 3, 0],
            //substring_length: 2,
        //})

        //try {
            //const witness = await genWitness(circuit, circuitInputs)
            //expect(false).toBeTruthy()
        //} catch {
            //expect(true).toBeTruthy()
        //}
        //expect.assertions(1)
    //})

    //it('ZeroSandwich (invalid)', async () => {
        //const circuit = 'zero_sandwich_test'
        //const circuitInputs = stringifyBigInts({
            //in: [0, 0, 0, 1, 5, 6, 0, 0],
            //substring_length: 2,
        //})

        //try {
            //const witness = await genWitness(circuit, circuitInputs)
            //expect(false).toBeTruthy()
        //} catch {
            //expect(true).toBeTruthy()
        //}
        //expect.assertions(1)
    //})
 
    //it('VerifyMsgPrime', async () => {
        //const circuit = 'verify_msg_prime_test'
        //const msg_prime = gen_msg_prime(msg)
        //const b = bufToPaddedBytes(Buffer.from(msg_prime))
        ////console.log(msg_prime.length)
        ////console.log(Buffer.from(expected_msg_prime).toString('hex'))
        ////console.log(Buffer.from(b).toString('hex'))

        //let offset_msg_buf = Buffer.alloc(msg_prime.length)
        //for (let i = 64; i < 64 + msg.length; i ++) {
            //offset_msg_buf[i] = Buffer.from(msg[i - 64])[0]
        //}
        //let offset_msg: Number[] = []
        //for (let i = 0; i < offset_msg_buf.length; i ++) {
            //offset_msg.push(Number(offset_msg_buf[i]))
        //}

        //const circuitInputs = stringifyBigInts({
            //msg_prime,
            //offset_msg,
            //msg_length: msg.length 
        //})
        //const witness = await genWitness(circuit, circuitInputs)
    //})

    it('ExpandMessageXmd2', async () => {
        const circuit = 'expand_msg_xmd2_test'
        const msg_prime = gen_msg_prime(str_to_array(msg))
        const padded_msg_prime = bufToPaddedBytes(Buffer.from(msg_prime))

        let offset_msg_buf = Buffer.alloc(padded_msg_prime.length)
        for (let i = 64; i < 64 + msg.length; i ++) {
            offset_msg_buf[i] = Buffer.from(msg[i - 64])[0]
        }
        let offset_msg: Number[] = []
        for (let i = 0; i < offset_msg_buf.length; i ++) {
            offset_msg.push(Number(offset_msg_buf[i]))
        }

        const circuitInputs = stringifyBigInts({
            msg_prime: padded_msg_prime,
            offset_msg,
            msg_length: msg.length,
            padded_msg_prime: bufToPaddedBytes(Buffer.from(msg_prime)),
        })
        const witness = await genWitness(circuit, circuitInputs)

        //const hash = gen_b0(expected_msg_prime)

        //const hash_bits = buffer2bitArray(Buffer.from(hash))

        //const bits: number[] = []
        //for (let i = 0; i < 256; i ++) {
            ////const out = Number(await getSignalByName(circuit, witness, 'main.hash[' + i.toString() + ']'))
            //const out = Number(witness[1 + i])
            //bits.push(out)
        //}
        //expect(bits.join('')).toEqual(hash_bits.join(''))
 
        const bytes: number[] = []
        for (let i = 0; i < 96; i ++) {
            //const out = Number(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            const out = Number(witness[1 + i])
            bytes.push(out)
        }

        const expected = expand_msg_xmd(str_to_array(msg))
        expect(expected.length).toEqual(bytes.length)
        for (let i = 0; i < 96; i ++) {
            expect(bytes[i]).toEqual(expected[i])
        }
    })
})
