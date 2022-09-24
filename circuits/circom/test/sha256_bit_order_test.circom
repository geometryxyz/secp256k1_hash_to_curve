pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/sha256/sha256.circom";

template Sha256BitOrder() {
    signal input in[256];
    signal output out[256];

    component hasher = Sha256(256);
    for (var i = 0; i < 256; i ++) {
        hasher.in[i] <== in[i];
    }

    component hasher2 = Sha256(256);
    for (var i = 0; i < 256; i ++) {
        hasher2.in[i] <== hasher.out[i];
    }

    for (var i = 0; i < 256; i ++) {
        out[i] <== hasher2.out[i];
    }
}

component main = Sha256BitOrder();
