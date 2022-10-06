pragma circom 2.0.0;

include "./constants.circom";
include "../node_modules/circom-ecdsa/circuits/bigint.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/comparators.circom";

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

template Negate() {
    signal input in[4];
    signal output out[4];

    var p[4] = get_secp256k1_p();

    component sub = BigSubModP(64, 4);
    for (var i = 0; i < 4; i ++) {
        sub.a[i] <== p[i];
        sub.b[i] <== in[i];
        sub.p[i] <== p[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== sub.out[i];
    }
}

template Multiply() {
    signal input a[4];
    signal input b[4];
    signal output out[4];
    var p[4] = get_secp256k1_p();

    component mul_mod_p = BigMultModP(64, 4);
    for (var i = 0; i < 4; i ++) {
        mul_mod_p.a[i] <== a[i];
        mul_mod_p.b[i] <== b[i];
        mul_mod_p.p[i] <== p[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== mul_mod_p.out[i];
    }
}

template Square() {
    signal input in[4];
    signal output out[4];

    component mul = Multiply();
    for (var i = 0; i < 4; i ++) {
        mul.a[i] <== in[i];
        mul.b[i] <== in[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== mul.out[i];
    }
}
