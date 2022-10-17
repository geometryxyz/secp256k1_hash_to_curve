const ff = require('ffjavascript')

const sqrt_mod_p = (n: bigint, p: bigint): bigint => {
    const F = new ff.F1Field(p)
    return F.sqrt(n)
}

// From circom-ecdsa
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

const sgn0 = (input: bigint): bigint => {
    return input % BigInt(2)
}

/*
 * Converts a buffer into an array of bits. Each bit is represented by a Number
 * (1 or 0). E.g. <Buffer 61 62> will be converted to
 * [ 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0 ]
 */
const buffer2bitArray = (b: Buffer): number[] => {
    const res: number[] = []
    for (let i = 0; i < b.length; i ++) {
        for (let j = 0; j < 8; j ++) {
            res.push((b[i] >> (7 - j) & 1))
        }
    }
    return res
}

const bufToPaddedBytes = (buf: Buffer): number[] => {
    // Convert the buffer to bits
    const result: number[] = buffer2bitArray(buf)
    const len = result.length

    result.push(1)

    const nBlocks = Math.floor((len + 64) / 512) + 1

    while (result.length < nBlocks * 512 - 64) {
        result.push(0)
    }

    const lenBitArr: number[] = []
    let lengthInBits = BigInt(len).toString(2)
    for (let i = 0; i < lengthInBits.length; i ++) {
        lenBitArr.push(Number(lengthInBits[i]))
    }

    while (lenBitArr.length < 64) {
        lenBitArr.unshift(0)
    }
    
    for (let i = 0; i < 64; i ++) {
        result.push(lenBitArr[i])
    }

    const p: number[] = []

    for (var i = 0; i < result.length / 8; i ++) {
        const b = Number('0b' + result.slice(i * 8, i * 8 + 8).join(''))
        p.push(b)
    }
    return p
}

/*
 * The SHA256 hash function accepts a plaintext (`str`) and its first operation
 * is to pad it. RFC4634, section 4.1 describes how this is done.
 */
const strToPaddedBytes = (str: string): number[] => {
    // Convert the input string to a buffer
    const buf = Buffer.from(str, 'utf8')
    return bufToPaddedBytes(buf)

}

/*
 * The SHA256 hash function accepts a plaintext (`str`) and its first operation
 * is to pad it. RFC4634, section 4.1 describes how this is done.
 */
const strToSha256PaddedBitArr = (str: string): string => {
    // Convert the input string to a buffer
    const buf = Buffer.from(str, 'utf8')
    return bufToSha256PaddedBitArr(buf)
}

const msgToSha256PaddedBitArr = (msg: string): string => {
    const l = msg.length
    const s = l + 1

    let total_length = 512

    while (total_length < l + 1) {
        total_length += 512
    }

    if (((total_length - s) % 512) < 64) {
        total_length += 512
    }

    const buf = Buffer.alloc(total_length / 8)
    const msg_buf = Buffer.from(msg)
    for (let i = 0; i < msg_buf.length; i ++) {
        buf[i] = msg_buf[i]
    }

    return buffer2bitArray(buf).join('')
}

const bufToSha256PaddedBitArr = (buf: Buffer): string => {
    // Convert the buffer to bits
    const bits: number[] = buffer2bitArray(buf)

    let result: number[] = []
    for (let i = 0; i < bits.length; i ++) {
        result.push(bits[i])
    }

    result.push(1)

    const nBlocks = Math.floor((bits.length + 64) / 512) + 1

    while (result.length < nBlocks * 512 - 64) {
        result.push(0)
    }

    let lengthInBits = BigInt(bits.length).toString(2)
    while (lengthInBits.length < 64) {
        lengthInBits = '0' + lengthInBits 
    }

    return result.join('') + lengthInBits
}

export {
    sqrt_mod_p,
    bigint_to_array,
    sgn0,
    buffer2bitArray,
    strToPaddedBytes,
    bufToPaddedBytes,
    strToSha256PaddedBitArr,
    bufToSha256PaddedBitArr,
    msgToSha256PaddedBitArr,
}
