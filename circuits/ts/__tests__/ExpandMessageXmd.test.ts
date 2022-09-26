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

    it('strxor test', async () => {
        const a = [0, 10, 20, 30, 40, 50, 60, 70]
        const b = [255, 254, 253, 252, 251, 250, 249, 248]
        const expected_out: number[] =  [255, 244, 233, 226, 211, 200, 197, 190]
        for (let i = 0; i < a.length; i ++) {
            expect(a[i] ^ b[i]).toEqual(expected_out[i])
        }

        const circuit = 'strxor_test'
        const circuitInputs = stringifyBigInts({ a, b })
        const witness = await genWitness(circuit, circuitInputs)
        const result: number[] = []
        for (let i = 0; i < 8; i ++) {
            const out = Number(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            result.push(out)
        }
        expect(result.join('')).toEqual(expected_out.join(''))
    })

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
    })

    it('b1 = h(b0 || 1 || dst_prime)', async () => {
        const buff = Buffer.from(expected_b0.concat([1]).concat(dst_prime))
        const hash = crypto.createHash("sha256").update(buff).digest()
        for (let i = 0; i < 32; i ++) {
            expect(hash[i]).toEqual(expected_b1[i])
        }
        const b_bits = buffer2bitArray(expected_b0)
        const circuitInputs = stringifyBigInts({ b_bits })
        const circuit = 'hash_b0_to_b1_test'
        const witness = await genWitness(circuit, circuitInputs)

        const b1_bits = buffer2bitArray(hash)
        const bits: number[] = []
        for (let i = 0; i < 256; i ++) {
            const out = Number(await getSignalByName(circuit, witness, 'main.bi_bits[' + i.toString() + ']'))
            bits.push(out)
        }
        expect(bits.join('')).toEqual(b1_bits.join(''))
    })

    it('b2 = h(strxor(b0, b1) || 2 || dst_prime)', async () => {
        const buff = Buffer.from(strxor(expected_b0, expected_b1).concat([2]).concat(dst_prime))
        const hash = crypto.createHash("sha256").update(buff).digest()
        for (let i = 0; i < 32; i ++) {
            expect(hash[i]).toEqual(expected_b2[i])
        }
        const b0_bits = buffer2bitArray(expected_b0)
        const bi_minus_one_bits = buffer2bitArray(expected_b1)
        const circuitInputs = stringifyBigInts({ b0_bits, bi_minus_one_bits })
        const circuit = 'hash_b1_to_b2_test'
        const witness = await genWitness(circuit, circuitInputs)
        const b2_bits = buffer2bitArray(hash)
        const bits: number[] = []
        for (let i = 0; i < 256; i ++) {
            const out = Number(await getSignalByName(circuit, witness, 'main.bi_bits[' + i.toString() + ']'))
            bits.push(out)
        }
        expect(bits.join('')).toEqual(b2_bits.join(''))
    })

    it('b3 = h(strxor(b0, b2) || 3 || dst_prime)', async () => {
        const buff = Buffer.from(strxor(expected_b0, expected_b2).concat([3]).concat(dst_prime))
        const hash = crypto.createHash("sha256").update(buff).digest()
        for (let i = 0; i < 32; i ++) {
            expect(hash[i]).toEqual(expected_b3[i])
        }
        const b0_bits = buffer2bitArray(expected_b0)
        const bi_minus_one_bits = buffer2bitArray(expected_b2)
        const circuitInputs = stringifyBigInts({ b0_bits, bi_minus_one_bits })
        const circuit = 'hash_b2_to_b3_test'
        const witness = await genWitness(circuit, circuitInputs)
        const b2_bits = buffer2bitArray(hash)
        const bits: number[] = []
        for (let i = 0; i < 256; i ++) {
            const out = Number(await getSignalByName(circuit, witness, 'main.bi_bits[' + i.toString() + ']'))
            bits.push(out)
        }
        expect(bits.join('')).toEqual(b2_bits.join(''))
    })

    it('ExpandMessageXmd', async () => {
        const circuit = 'expand_msg_xmd_test'
        const circuitInputs = stringifyBigInts({ msg })

        const witness = await genWitness(circuit, circuitInputs)

        const bytes: number[] = []
        for (let i = 0; i < 96; i ++) {
            const out = Number(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            bytes.push(out)
        }

        const expected = expected_b1.concat(expected_b2).concat(expected_b3)
        expect(expected.length).toEqual(bytes.length)
        for (let i = 0; i < 96; i ++) {
            expect(bytes[i]).toEqual(expected[i])
        }
    })
 
    it('BytesToRegisters', async () => {
        const circuit = 'bytes_to_registers_test'
        const bytes: number[] = []
        for (let i = 0; i < 48; i ++) {
            bytes.push(255)
        }
        const circuitInputs = stringifyBigInts({ bytes })
        const witness = await genWitness(circuit, circuitInputs)
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.registers[' + i.toString() + ']'))
            expect(out).toEqual(BigInt('18446744073709551615'))
        }
    })

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
        // u1
        const u1_registers: bigint[] = []
        for (let i = 0; i < 4; i ++) {
            const out = BigInt(await getSignalByName(circuit, witness, 'main.u[1][' + i.toString() + ']'))
            u1_registers.push(out)
            expect(out).toEqual(expected_u1_registers[i])
        }
    })

    it('BytesToRegisters', async () => {
        const p = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F')
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

const strxor = (a: number[], b: number[]): number[] => {
    const result: number[] = []
    for (let i = 0; i < a.length; i ++) {
        result.push(a[i] ^ b[i])
    }
    return result
}

function buffer2bitArray(b) {
    const res: number[] = [];
    for (let i=0; i<b.length; i++) {
        for (let j=0; j<8; j++) {
            res.push((b[i] >> (7-j) &1));
        }
    }
    return res;
}

function bigint_to_tuple(x: bigint) {
    let mod: bigint = BigInt('18446744073709551616')
    let ret: [bigint, bigint, bigint, bigint] = [
        BigInt(0),
        BigInt(0),
        BigInt(0),
        BigInt(0),
    ];

    var x_temp: bigint = x;
    for (var idx = 0; idx < ret.length; idx++) {
        ret[idx] = x_temp % mod;
        x_temp = x_temp / mod;
    }
    return ret;
}

function bigint_to_array(n: number, k: number, x: bigint) {
    let mod: bigint = BigInt(1);
    for (var idx = 0; idx < n; idx++) {
        mod = mod * BigInt(2);
    }

    let ret: bigint[] = [];
    var x_temp: bigint = x;
    for (var idx = 0; idx < k; idx++) {
        ret.push(x_temp % mod);
        x_temp = x_temp / mod;
    }
    return ret;
}
