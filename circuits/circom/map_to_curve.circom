pragma circom 2.0.0;

include "./constants.circom";
include "../node_modules/circom-ecdsa/circuits/bigint.circom";

template Squared() {
    signal input val[4];
    signal output out[4];

    var p[4] = get_secp256k1_p();

    component mul_mod_p = BigMultModP(64, 4);
    for (var i = 0; i < 4; i ++) {
        mul_mod_p.a[i] <== val[i];
        mul_mod_p.b[i] <== val[i];
        mul_mod_p.p[i] <== p[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== mul_mod_p.out[i];
    }
}

template ZMulTv1() {
    signal input tv1[4];
    signal output out[4];
    var z[4] = get_Z();
    var p[4] = get_secp256k1_p();

    component mul_mod_p = BigMultModP(64, 4);
    for (var i = 0; i < 4; i ++) {
        mul_mod_p.a[i] <== tv1[i];
        mul_mod_p.b[i] <== z[i];
        mul_mod_p.p[i] <== p[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== mul_mod_p.out[i];
    }
}
