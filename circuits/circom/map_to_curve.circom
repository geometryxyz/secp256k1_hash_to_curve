pragma circom 2.0.0;

include "./constants.circom";
include "../node_modules/circom-ecdsa/circuits/bigint.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/comparators.circom";

template CMov() {
    // If c is 0, output a. Otherwise, output b. 
    signal input a;
    signal input b;
    signal input c;
    signal output out;

    component mux = Mux1();
    mux.c[0] <== a;
    mux.c[1] <== b;
    mux.s <== c;

    out <== mux.out;
}

template Inv0() {
    signal input a[4];
    signal output out[4];

    var p[4] = get_secp256k1_p();
    component modinv = BigModInv(64, 4);
    for (var i = 0; i < 4; i ++) {
        modinv.in[i] <== a[i];
        modinv.p[i] <== p[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== modinv.out[i];
    }
}

template Add() {
    signal input a[4];
    signal input b[4];
    signal output out[4];

    var p[4] = get_secp256k1_p();

    component adder = BigAdd(64, 4);
    for (var i = 0; i < 4; i ++) {
        adder.a[i] <== a[i];
        adder.b[i] <== b[i];
    }

    component mod = BigMod(64, 4);
    for (var i = 0; i < 4 + 1; i ++) {
        mod.a[i] <== adder.out[i];
    }

    for (var i = 4 + 1; i < 4 * 2; i ++) {
        mod.a[i] <== 0;
    }

    for (var i = 0; i < 4; i ++) {
        mod.b[i] <== p[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== mod.mod[i];
    }
}

template Square() {
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

// Output 1 if sqrt(n) mod p == expected_sqrt, and 0 otherwise
// The value of expected_sqrt can be calculated using
// ffjavascript.F1Field.sqrt().
template IsSquare() {
    signal input n[4];
    signal input expected_sqrt[4];
    signal output out;

    var p[4] = get_secp256k1_p();

    component sq = Square();
    for (var i = 0; i < 4; i ++) {
        sq.val[i] <== expected_sqrt[i];
    }

    signal sum[5];
    sum[0] <== 0;
    component is_eq[4];
    for (var i = 0; i < 4; i ++) {
        is_eq[i] = IsEqual();
        is_eq[i].in[0] <== sq.out[i];
        is_eq[i].in[1] <== n[i];
        sum[i + 1] <== sum[i] + is_eq[i].out;
    }

    component result = IsEqual();
    result.in[0] <== sum[4];
    result.in[1] <== 4;
    out <== result.out;
}
