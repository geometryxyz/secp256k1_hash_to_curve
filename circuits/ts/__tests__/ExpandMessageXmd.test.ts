jest.setTimeout(120000)
const crypto = require('crypto')
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'

describe('ExpandMessageXmd', () => {
    const expected_msg_prime = [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 98,
        99, 0, 96, 0, 81, 85, 85, 88, 45, 86, 48, 49, 45, 67, 83, 48, 50,
        45, 119, 105, 116, 104, 45, 115, 101, 99, 112, 50, 53, 54, 107, 49,
        95, 88, 77, 68, 58, 83, 72, 65, 45, 50, 53, 54, 95, 83, 83, 87, 85,
        95, 82, 79, 95, 49
    ]
    const msg = [97, 98, 99] // "abc"

    //// Test the MsgPrime circuit
    //it('msg_prime', async () => {
        //const circuit = 'msg_prime_test'
        //const circuitInputs = stringifyBigInts({ msg })

        //const witness = await genWitness(circuit, circuitInputs)
        //for (let i = 0; i < 120; i ++) {
            //const out = Number(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //expect(out).toEqual(expected_msg_prime[i])
        //}
    //})

    // Hash msg_prime with SHA256
    it('b0 = h(msg_prime)', async () => {
        const expected_b0 = [
            99, 4, 75, 36, 124, 254, 65, 234, 207, 65, 212, 122, 206, 186, 87,
            48, 157, 28, 243, 255, 59, 178, 30, 40, 136, 85, 202, 99, 135, 177,
            127, 169
        ]
        const buff = Buffer.from(expected_msg_prime)
        const hash = crypto.createHash("sha256")
            .update(buff)
            .digest()
        for (let i = 0; i < 32; i ++) {
            expect(hash[i]).toEqual(expected_b0[i])
        }
        
        const circuitInputs = stringifyBigInts({ msg_prime: expected_msg_prime })

        const hash_bits = buffer2bitArray(hash)
        const circuit = 'hash_msg_prime_to_b0_test'
        const witness = await genWitness(circuit, circuitInputs)

        const bits: number[] = []
        for (let i = 0; i < 256; i ++) {
            const out = Number(await getSignalByName(circuit, witness, 'main.hash[' + i.toString() + ']'))
            bits.push(out)
        }
        expect(bits.join('')).toEqual(hash_bits.join(''))
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
