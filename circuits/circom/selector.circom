pragma circom 2.0.0;
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/bitify.circom";

/*
 * Given a list of items and an index, output the item at the position denoted
 * by the index. The index must be less than the number of items.
 */
template Selector(length) {
    signal input in[length];
    // Assumes that index < length
    signal input index;
    signal output out;

    signal totals[length + 1];
    totals[0] <== 0;

    component eqs[length];
    for (var i = 0; i < length; i ++) {
        eqs[i] = IsEqual();
        eqs[i].in[0] <== i;
        eqs[i].in[1] <== index;
        totals[i + 1] <== eqs[i].out * in[i] + totals[i];
    }
    out <== totals[length];
}
