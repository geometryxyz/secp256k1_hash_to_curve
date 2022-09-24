jest.setTimeout(120000)
const crypto = require('crypto')
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'

describe('ExpandMessageXmd', () => {
    const msg = [97, 98, 99] // "abc"
    const dst_prime = [
        81, 85, 85, 88, 45, 86, 48, 49, 45, 67, 83, 48, 50, 45, 119, 105, 116,
        104, 45, 115, 101, 99, 112, 50, 53, 54, 107, 49, 95, 88, 77, 68, 58,
        83, 72, 65, 45, 50, 53, 54, 95, 83, 83, 87, 85, 95, 82, 79, 95, 49
    ]
    const z_pad = [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0
    ]
    const lib_str = [0, 96]
    const expected_msg_prime = z_pad.concat(msg).concat(lib_str).concat([0]).concat(dst_prime)
    //const expected_msg_prime = [
        //0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 98,
        //99, 0, 96, 0, 81, 85, 85, 88, 45, 86, 48, 49, 45, 67, 83, 48, 50,
        //45, 119, 105, 116, 104, 45, 115, 101, 99, 112, 50, 53, 54, 107, 49,
        //95, 88, 77, 68, 58, 83, 72, 65, 45, 50, 53, 54, 95, 83, 83, 87, 85,
        //95, 82, 79, 95, 49
    //]
    const expected_b0 = [
        99, 4, 75, 36, 124, 254, 65, 234, 207, 65, 212, 122, 206, 186, 87,
        48, 157, 28, 243, 255, 59, 178, 30, 40, 136, 85, 202, 99, 135, 177,
        127, 169
    ]
    const expected_hash_b0_bits = buffer2bitArray(expected_b0)

    const expected_b1 = [
        232, 52, 124, 173, 72, 171, 78, 49, 157, 123, 39, 85, 32, 234, 129,
        207, 18, 138, 171, 93, 54, 121, 161, 247, 96, 30, 59, 222, 172, 154,
        81, 208
    ]

    // Test the MsgPrime circuit
    it('msg_prime', async () => {
        const circuit = 'msg_prime_test'
        const circuitInputs = stringifyBigInts({ msg })

        const witness = await genWitness(circuit, circuitInputs)
        for (let i = 0; i < 120; i ++) {
            const out = Number(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            expect(out).toEqual(expected_msg_prime[i])
        }
    })

    // Hash msg_prime with SHA256
    it('b0 = h(msg_prime)', async () => {
        const buff = Buffer.from(expected_msg_prime)
        const hash = crypto.createHash("sha256").update(buff).digest()

        for (let i = 0; i < 32; i ++) {
            expect(hash[i]).toEqual(expected_b0[i])
        }
        
        const circuitInputs = stringifyBigInts({ msg_prime: expected_msg_prime })

        const hash_bits = buffer2bitArray(hash)
        expect(hash_bits.join('')).toEqual(expected_hash_b0_bits.join(''))

        const circuit = 'hash_msg_prime_to_b0_test'
        const witness = await genWitness(circuit, circuitInputs)

        const bits: number[] = []
        for (let i = 0; i < 256; i ++) {
            const out = Number(await getSignalByName(circuit, witness, 'main.hash[' + i.toString() + ']'))
            bits.push(out)
        }
        expect(bits.join('')).toEqual(hash_bits.join(''))
        //console.log(bits.join(''))
    })

    it('b1 = h(b0 || 1 || dst_prime)', async () => {
        const buff = Buffer.from(expected_b0.concat([1]).concat(dst_prime))
        const hash = crypto.createHash("sha256").update(buff).digest()
        for (let i = 0; i < 32; i ++) {
            expect(hash[i]).toEqual(expected_b1[i])
        }
        const b0_bits = buffer2bitArray(expected_b0)
        const circuitInputs = stringifyBigInts({ b0_bits })
        const circuit = 'hash_b0_to_b1_test'
        const witness = await genWitness(circuit, circuitInputs)

        const b1_bits = buffer2bitArray(hash)
        const bits: number[] = []
        for (let i = 0; i < 256; i ++) {
            const out = Number(await getSignalByName(circuit, witness, 'main.b1_bits[' + i.toString() + ']'))
            bits.push(out)
        }
        expect(bits.join('')).toEqual(b1_bits.join(''))
    })

    it('sha256 bit order test', async () => {
        const expected_output = 
            '0011001010111010010001110110011101110001110100000001111000110111' +
            '1000000001111001100100001110101011011000011100011001111100001000' +
            '1010111101001001010001110010001111011110000111010010001010001111' +
            '0010110000101100000001111100110000001010101001000000101110101100'
        const input_bits: number[] = []
        for (let i = 0; i < 256; i ++) {
            input_bits.push(0)
        }
        input_bits[255] = 1

        const bits_to_bytes = (bits: number[]): number[] => {
            const bytes: number[] = []
            for (let i = 0; i < 32; i ++) {
                let byte_str = '0b'
                for (let j = 0; j < 8; j ++) {
                    byte_str += bits[i * 8 + j]
                }
                bytes.push(Number(byte_str))
            }
            return bytes
        }

        const input_bytes = bits_to_bytes(input_bits)

        const first_hash = crypto.createHash('sha256').update(Buffer.from(input_bytes)).digest()
        const second_hash = crypto.createHash('sha256').update(Buffer.from(first_hash)).digest()
        expect(buffer2bitArray(second_hash).join('')).toEqual(expected_output)

        const circuit = 'sha256_bit_order_test'
        const circuitInputs = stringifyBigInts({ 'in': input_bits })
        const witness = await genWitness(circuit, circuitInputs)
        const bits: number[] = []
        for (let i = 0; i < 256; i ++) {
            const out = Number(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            bits.push(out)
        }
        expect(bits.join('')).toEqual(expected_output)
    })
})

function buffer2bitArray(b) {
    const res: number[] = [];
    for (let i=0; i<b.length; i++) {
        for (let j=0; j<8; j++) {
            res.push((b[i] >> (7-j) &1));
        }
    }
    return res;
}
