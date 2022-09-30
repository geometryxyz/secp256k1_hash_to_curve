const ff = require('ffjavascript')

const sqrt_mod_p = (n: bigint, p: bigint): bigint => {
    const F = new ff.F1Field(p)
    return F.sqrt(n)
}

export { sqrt_mod_p }
