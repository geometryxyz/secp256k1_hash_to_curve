import * as crypto from 'crypto'
const assert = require('assert')
import {
    dst_prime,
    z_pad,
    lib_str,
    p,
    Z,
    c1,
    c2,
    A,
    B,
} from './constants'
const ff = require('ffjavascript')
import { sgn0, bigint_to_array } from './utils'
import { iso_map } from './iso_map'
import { Point } from '@noble/secp256k1';

const str_to_array = (msg: string): any => {
    return msg.split('').map((x) => Buffer.from(x)[0])
}

const buf_to_array = (buf: Buffer): number[] => {
    const r: number[] = []
    for (let i = 0; i < buf.length; i ++) {
        r.push(Number(buf[i]))
    }

    return r
}

const strxor = (a: number[], b: number[]): number[] => {
    const result: number[] = []
    for (let i = 0; i < a.length; i ++) {
        result.push(a[i] ^ b[i])
    }
    return result
}

const gen_msg_prime = (msg: string): any => {
    const msg_array = str_to_array(msg)
    return z_pad.concat(msg_array).concat(lib_str).concat([0]).concat(dst_prime)
}

const gen_b0 = (msg_prime: number[]) => {
    const buff = Buffer.from(msg_prime)
    const hash = crypto.createHash("sha256").update(buff).digest()
    return buf_to_array(hash)
}

const gen_b1 = (b0: number[]) => {
    const buff = Buffer.from(b0.concat([1]).concat(dst_prime))
    const hash = crypto.createHash("sha256").update(buff).digest()
    return buf_to_array(hash)
}

const gen_b2 = (b0: number[], b1: number[]) => {
    const buff = Buffer.from(strxor(b0, b1).concat([2]).concat(dst_prime))
    const hash = crypto.createHash("sha256").update(buff).digest()
    return buf_to_array(hash)
}

const gen_b3 = (b0: number[], b2: number[]) => {
    const buff = Buffer.from(strxor(b0, b2).concat([3]).concat(dst_prime))
    const hash = crypto.createHash("sha256").update(buff).digest()
    return buf_to_array(hash)
}

const expand_msg_xmd = (msg: string): any => {
    const msg_prime = gen_msg_prime(msg)
    const b0 = gen_b0(msg_prime)
    const b1 = gen_b1(b0)
    const b2 = gen_b2(b0, b1)
    const b3 = gen_b3(b0, b2)
    return b1.concat(b2).concat(b3)
}

const field = new ff.F1Field(p)

const bytes_to_registers = (bytes: number[]) => {
    const blah = ff.utils.beBuff2int(Buffer.from(bytes)) % p
    return bigint_to_array(64, 4, blah)
}

const map_to_curve = (u: bigint) => {
    // Step 1
    const step1_tv1 = (Z * (u * u)) % p
    // Step 2
    const step2_tv2 = (step1_tv1 * step1_tv1) % p
    // Step 3
    const step3_tv1_plus_tv2 = (step1_tv1 + step2_tv2) % p
    // Step 4
    const step4_inv0_x1 = field.inv(step3_tv1_plus_tv2)
    // Step 6
    const step6_x1_plus_1 = step4_inv0_x1 + BigInt(1)
    // Step 8 check
    const step8_x1_mul_c1 = (step6_x1_plus_1 * c1) % p
    // Step 9
    const gx1 = (step8_x1_mul_c1 * step8_x1_mul_c1) % p
    // Step 10
    const step10_gx1 = (gx1 + A) % p
    // Step 11
    const step11_gx1_mul_x1 = (step10_gx1 * step8_x1_mul_c1) % p
    // Step 12
    const step12_gx1 = (step11_gx1_mul_x1 + B) % p
    // Step 13
    const step13_x2 = (step1_tv1 * step8_x1_mul_c1) % p
    // Step 14
    const step14_tv2 = (step1_tv1 * step2_tv2) % p
    // Step 15
    const step15_gx2 = (step12_gx1 * step14_tv2) % p
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
    // Step 19
    const step19_sqrt_y2 = field.sqrt(step16_expected_y2)
    const sgn0_u = sgn0(u)
    const sgn0_y = sgn0(step19_sqrt_y2)

    const step20_e3 = sgn0_u === sgn0_y ? BigInt(1) : BigInt(0)
    let expected_y
    if (step20_e3 === BigInt(1)) {
        expected_y = step19_sqrt_y2
    } else {
        expected_y = p - step19_sqrt_y2
    }
    const expected_y_array = bigint_to_array(64, 4, expected_y)
 
    const x_out = step16_expected_x
    const y_out = expected_y

    return {
        x: x_out,
        y: y_out,
        gx1_sqrt,
        gx2_sqrt,
        y_pos: step19_sqrt_y2,
    }
}

const generate_inputs = (msg: string): any => {
    const uniform_bytes = expand_msg_xmd(msg)

    const u0_bytes = uniform_bytes.slice(0, 48)
    const u1_bytes = uniform_bytes.slice(48)

    const u0 = ff.utils.beBuff2int(Buffer.from(u0_bytes)) % p
    const u1 = ff.utils.beBuff2int(Buffer.from(u1_bytes)) % p

    const q0 = map_to_curve(u0)
    const q0_mapped = iso_map(q0.x, q0.y, p)

    const q1 = map_to_curve(u1)
    const q1_mapped = iso_map(q1.x, q1.y, p)

    return {
        msg: str_to_array(msg),
        q0_gx1_sqrt: bigint_to_array(64, 4, q0.gx1_sqrt),
        q0_gx2_sqrt: bigint_to_array(64, 4, q0.gx2_sqrt),
        q0_y_pos: bigint_to_array(64, 4, q0.y_pos),
        q1_gx1_sqrt: bigint_to_array(64, 4, q1.gx1_sqrt),
        q1_gx2_sqrt: bigint_to_array(64, 4, q1.gx2_sqrt),
        q1_y_pos: bigint_to_array(64, 4, q1.y_pos),
        q0_x_mapped: bigint_to_array(64, 4, q0_mapped.x),
        q0_y_mapped: bigint_to_array(64, 4, q0_mapped.y),
        q1_x_mapped: bigint_to_array(64, 4, q1_mapped.x),
        q1_y_mapped: bigint_to_array(64, 4, q1_mapped.y),
    }

    //const q0_mapped_pt = new Point(q0_mapped.x, q0_mapped.y)
    //const q1_mapped_pt = new Point(q1_mapped.x, q1_mapped.y)

    //const point = q0_mapped_pt.add(q1_mapped_pt)
    //return point
}

export {
    gen_msg_prime,
    gen_b0,
    gen_b1,
    gen_b2,
    gen_b3,
    generate_inputs,
    strxor,
    str_to_array,
    expand_msg_xmd,
    bytes_to_registers,
    sgn0,
    map_to_curve,
}
