// Implements the isogeny map for the secp256k1 hash-to-curve suite
// https://www.ietf.org/archive/id/draft-irtf-cfrg-hash-to-curve-13.html#appendix-E.1
const ff = require('ffjavascript')

// Constants used to compute x_num
const k_1_0 = BigInt('0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7')
const k_1_1 = BigInt('0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581')
const k_1_2 = BigInt('0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262')
const k_1_3 = BigInt('0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c')

// Constants used to compute x_den
const k_2_0 = BigInt('0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b')
const k_2_1 = BigInt('0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14')

// Constants used to compute y_num
const k_3_0 = BigInt('0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c')
const k_3_1 = BigInt('0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3')
const k_3_2 = BigInt('0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931')
const k_3_3 = BigInt('0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84')

// Constants used to compute y_den
const k_4_0 = BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b')
const k_4_1 = BigInt('0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573')
const k_4_2 = BigInt('0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f')

const constants = {
    k_1_0,
    k_1_1,
    k_1_2,
    k_1_3,
    k_2_0,
    k_2_1,
    k_3_0,
    k_3_1,
    k_3_2,
    k_3_3,
    k_4_0,
    k_4_1,
    k_4_2,
}

const compute_x_num = (x: bigint, p: bigint): bigint => {
    const x_2 = (x * x) % p
    const x_3 = (x * x * x) % p

    // Compute x_num = k_(1,3) * x'^3 + k_(1,2) * x'^2 + k_(1,1) * x' + k_(1,0)
    const x_num = (k_1_3 * x_3 + k_1_2 * x_2 + k_1_1 * x + k_1_0) % p
    return x_num
}

const compute_x_den = (x: bigint, p: bigint): bigint => {
    // Compute x_den = x'^2 + k_(2,1) * x' + k_(2,0)
    const x_2 = (x * x) % p
    const x_den = (x_2 + k_2_1 * x + k_2_0) % p
    return x_den
}

const compute_y_num = (x: bigint, p: bigint): bigint => {
    // Compute y_num = k_(3,3) * x'^3 + k_(3,2) * x'^2 + k_(3,1) * x' + k_(3,0)
    const x_2 = (x * x) % p
    const x_3 = (x * x * x) % p
    const y_num = (k_3_3 * x_3 + k_3_2 * x_2 + k_3_1 * x + k_3_0) % p
    return y_num
}

const compute_y_den = (x: bigint, p: bigint): bigint => {
    // Compute y_den = x'^3 + k_(4,2) * x'^2 + k_(4,1) * x' + k_(4,0)
    const x_2 = (x * x) % p
    const x_3 = (x * x * x) % p
    const y_den = (x_3 + k_4_2 * x_2 + k_4_1 * x + k_4_0) % p

    return y_den
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


// Converts (x', y') on E' to (x, y) on E
const iso_map = (x: bigint, y: bigint, p: bigint) => {
    const x_2 = (x * x) % p
    const x_3 = (x * x * x) % p

    const x_num = compute_x_num(x, p)
    const x_den = compute_x_den(x, p)
    const y_num = compute_y_num(x, p)
    const y_den = compute_y_den(x, p)

    const field = new ff.F1Field(p)
    const x_mapped = field.div(x_num, x_den)
    const y_mapped = field.mul(y, field.div(y_num, y_den))

    return { x: x_mapped, y: y_mapped }
}

export {
    iso_map,
    constants,
    compute_x_num,
    compute_x_den,
    compute_y_num,
    compute_y_den,
}
