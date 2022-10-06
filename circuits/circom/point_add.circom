pragma circom 2.0.0;
include "../node_modules/circom-ecdsa/circuits/secp256k1.circom";

template PointAdd() {
    signal input a[2][4];
    signal input b[2][4];
    signal output out[2][4];

    component add_unequal = Secp256k1AddUnequal(64, 4);
    for (var i = 0; i < 4; i ++) {
        add_unequal.a[0][i] <== a[0][i];
        add_unequal.a[1][i] <== a[1][i];
        add_unequal.b[0][i] <== b[0][i];
        add_unequal.b[1][i] <== b[1][i];
    }

    for (var i = 0; i < 4; i ++) {
        out[0][i] <== add_unequal.out[0][i];
        out[1][i] <== add_unequal.out[1][i];
    }
}
