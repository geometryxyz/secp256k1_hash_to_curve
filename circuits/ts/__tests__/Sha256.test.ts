jest.setTimeout(360000)
const crypto = require('crypto')
const ff = require('ffjavascript')
const stringifyBigInts = ff.utils.stringifyBigInts
import {
    callGenWitness as genWitness,
    callGetSignalByName as getSignalByName,
} from 'circom-helper'
import {
    strToPaddedBytes,
    buffer2bitArray,
    strToSha256PaddedBitArr,
    bufToSha256PaddedBitArr,
    msgToSha256PaddedBitArr,
} from '../utils'
import {
    str_to_array,
    gen_msg_prime,
} from '../generate_inputs'

describe('Sha256', () => {
    it('checkZeroPad_test (valid)', async () => {
        const circuit = 'checkZeroPad_test'
        const circuitInputs = stringifyBigInts({
            in: [0, 2, 0, 0, 5],
            start: 2,
            end: 4,
        })
        const witness = await genWitness(circuit, circuitInputs)
    })

    it('checkZeroPad_test (invalid)', async () => {
        const circuit = 'checkZeroPad_test'
        try {
            const circuitInputs = stringifyBigInts({
                in: [0, 2, 1, 0, 5],
                start: 2,
                end: 4,
            })
            const witness = await genWitness(circuit, circuitInputs)
            expect(false).toBeTruthy()
        } catch (e) {
            expect(true).toBeTruthy()
        }

        try {
            const circuitInputs = stringifyBigInts({
                in: [0, 2, 0, 1, 0],
                start: 2,
                end: 4,
            })
            const witness = await genWitness(circuit, circuitInputs)
            expect(false).toBeTruthy()
        } catch (e) {
            expect(true).toBeTruthy()
        }

        expect.assertions(2)
    })

    it('startsWith_test (valid)', async () => {
        const circuit = 'startsWith_test'
        const circuitInputs = stringifyBigInts({
            a: [1, 2, 3, 0, 0],
            b: [1, 2, 3, 4, 0],
            num_elements: 3,
        })
        const witness = await genWitness(circuit, circuitInputs)
    })

    it('startsWith_test (invalid)', async () => {
        const circuit = 'startsWith_test'
        const circuitInputs = stringifyBigInts({
            a: [1, 2, 3, 0, 0],
            b: [1, 2, 0, 4, 5],
            num_elements: 3,
        })
        try {
            const witness = await genWitness(circuit, circuitInputs)
            expect(false).toBeTruthy()
        } catch (e) {
            expect(true).toBeTruthy()
        }

        expect.assertions(1)
    })

    it('verifyPaddedBits_test', async () => {
        const circuit = 'verifyPaddedBits_test'
        const msg = 'abc'
        const padded_bits = strToSha256PaddedBitArr(msg)
        const circuitInputs = stringifyBigInts({
            padded_bits: padded_bits.split(''),
            msg: msgToSha256PaddedBitArr(msg).split(''),
        })
        const witness = await genWitness(circuit, circuitInputs)
    })

    it('Sha256Raw circuit', async () => {
        const circuit = 'sha256raw_test'
        const msg = 'abc'
        const padded_bits = strToSha256PaddedBitArr(msg)
        const circuitInputs = stringifyBigInts({
            padded_bits: padded_bits.split(''),
        })
        const witness = await genWitness(circuit, circuitInputs)
        let outBits = ''
        for (let i = 0; i < 256; i ++) {
            //const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            const out = BigInt(witness[i + 1])
            outBits += out
        }

        const hash = crypto.createHash("sha256")
            .update(Buffer.from(msg))
            .digest('hex')

        expect(BigInt('0b' + outBits).toString(16)).toEqual(hash)
    })
    
    it('Sha256Hash circuit', async () => {
        const circuit = 'sha256Hash_test'
        const msg = 'abc'
        const paddedIn = strToSha256PaddedBitArr(msg)
        const circuitInputs = stringifyBigInts({
            padded_bits: paddedIn.split(''),
            msg: msgToSha256PaddedBitArr(msg).split(''),
        })
        const witness = await genWitness(circuit, circuitInputs)
        let outBits = ''
        for (let i = 0; i < 256; i ++) {
            //const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            const out = BigInt(witness[i + 1])
            outBits += out
        }

        const hash = crypto.createHash("sha256")
            .update(Buffer.from(msg))
            .digest('hex')

        expect(BigInt('0b' + outBits).toString(16)).toEqual(hash)
    })

    //it('padBits_3_test', async () => {
        //const circuit = 'padBits_3_test'
        //const msg = '123'
        //const expected = strToSha256PaddedBitArr(msg)
        //const circuitInputs = stringifyBigInts({
            //msg: str_to_array(msg),
        //})
        //const witness = await genWitness(circuit, circuitInputs)
        //let outBits = ''
        //for (let i = 0; i < expected.length; i ++) {
            //const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //outBits += out
        //}
        //expect(outBits).toEqual(strToSha256PaddedBitArr(msg))
    //})

    //it('padBits_63_test', async () => {
        //const circuit = 'padBits_63_test'
        //let msg = ''
        //for (let i = 0; i < 63; i ++) {
            //msg += 'x'
        //}

        //const expected = strToSha256PaddedBitArr(msg)
        //const circuitInputs = stringifyBigInts({
            //msg: str_to_array(msg),
        //})

        //const witness = await genWitness(circuit, circuitInputs)

        //let outBits = ''
        //for (let i = 0; i < expected.length; i ++) {
            //const out = BigInt(await getSignalByName(circuit, witness, 'main.out[' + i.toString() + ']'))
            //outBits += out
        //}
        //expect(outBits).toEqual(strToSha256PaddedBitArr(msg))
    //})
})
