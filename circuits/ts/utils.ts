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

export {
    sqrt_mod_p,
    bigint_to_array,
    sgn0,
}
