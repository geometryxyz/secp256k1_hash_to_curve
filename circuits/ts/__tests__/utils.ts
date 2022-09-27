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

export { bigint_to_array }
