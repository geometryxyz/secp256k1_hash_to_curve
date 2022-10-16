pragma circom 2.0.0;
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/sha256/sha256.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/mux1.circom";

// Given the number of bits of a message to hash, compute the number of padded
// bits to supply to the Sha256Raw circuit.
function calc_padded_bits_length(msg_bits_length) {
    var s = msg_bits_length + 1;
    var total_bits_length = 512;

    while (total_bits_length < s) {
        total_bits_length += 512;
    }

    if ((total_bits_length - s) % 512 > 448) {
        total_bits_length += 512;
    }
    return total_bits_length;
}

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

// Output the sum of the input signals.
template CalculateTotal(n) {
    assert(n > 0);
    signal input in[n];
    signal output out;

    signal totals[n];
    totals[0] <== in[0];

    for (var i = 1; i < n; i ++) {
        totals[i] <== totals[i - 1] + in[i];
    }

    out <== totals[n - 1];
}

// Checks that the first num_elements of signal array a are the same as that of
// signal array b.
template StartsWith(length) {
    // Assumes that all inputs are 0 or 1
    signal input a[length];
    signal input b[length];
    signal input num_elements;

    component num_elements_lt_length = LessThan(252);
    num_elements_lt_length.in[0] <== num_elements;
    num_elements_lt_length.in[1] <== length;
    num_elements_lt_length.out === 1;

    /*
        Example:
        num_elements = 3
        a = [1, 2, 3, 0, 0]
        b = [1, 2, 3, 4, 0]

        s = [1, 1, 1, 0, 0] <- [i < num_elements for i in length]
        c = [1, 1, 1, 0, 1] <- [a[i] == b[i] for i in length]
        d = [1, 1, 1, 0, 0] <- [s[i] == 1 ? c[i] : 0 for i in length]

        3 === num_elements <- the sum of the first num_elements elements in c
     */

    component s[length];
    component c[length];
    component d[length];
    signal total[length + 1];
    total[0] <== 0;
    for (var i = 0; i < length; i ++) {
        s[i] = LessThan(252);
        s[i].in[0] <== i;
        s[i].in[1] <== num_elements;

        c[i] = IsEqual();
        c[i].in[0] <== a[i];
        c[i].in[1] <== b[i];

        d[i] = Mux1();
        d[i].c[0] <== 0;
        d[i].c[1] <== c[i].out;
        d[i].s <== s[i].out;

        total[i + 1] <== total[i] + d[i].out;
    }
    total[length] === num_elements;
}

template CheckZeroPad(length) {
    // Assumes that all inputs are 0 or 1
    signal input in[length];
    signal input start;
    signal input end;

    // Check that end > start
    component start_lt_end = LessThan(252);
    start_lt_end.in[0] <== start;
    start_lt_end.in[1] <== end;
    start_lt_end.out === 1;

    // start: 2, end: 4
    // in: [0, 2, 0, 0, 5]
    // a:  [0, 0, 1, 1, 1] <- [gte(i, start) for i in length]
    // b:  [1, 1, 1, 1, 0] <- [lt(i, end) for i in length]
    // c:  [0, 0, 1, 1, 0] <- [a[i] + b[i] == 2 for i in length]
    // d:  [1, 0, 1, 1, 0] <- [in[i] == 0 for i in length]
    // e:  [0, 0, 1, 1, 0] <- [c[i] * d[i] for i in length]
    // sum(d) === end - start

    component gte[length];
    component lt[length];
    component eq_c[length];
    component eq_d[length];
    component total = CalculateTotal(length);
    for (var i = 0; i < length; i ++) {
        gte[i] = GreaterEqThan(252);
        gte[i].in[0] <== i;
        gte[i].in[1] <== start;

        lt[i] = LessThan(252);
        lt[i].in[0] <== i;
        lt[i].in[1] <== end;

        eq_c[i] = IsEqual();
        eq_c[i].in[0] <== gte[i].out + lt[i].out;
        eq_c[i].in[1] <== 2;

        eq_d[i] = IsEqual();
        eq_d[i].in[0] <== 0;
        eq_d[i].in[1] <== in[i];

        total.in[i] <== eq_c[i].out * eq_d[i].out;
    }
    total.out === end - start;
}

template VerifyPaddedBits(padded_length) {
    var num_blocks = padded_length / 512;
    assert(num_blocks * 512 == padded_length);

    signal input padded_bits[padded_length];
    signal input msg[padded_length];

    // Step 1: Convert the last 64 bits to a field element
    component step1_b2n = Bits2Num(64);
    for (var i = 0; i < 64; i ++) {
        step1_b2n.in[63 - i] <== padded_bits[padded_length - 64 + i];
    }

    signal num_msg_bits;
    num_msg_bits <== step1_b2n.out;

    // Step 2: Check that this field element is less than padded_length
    component step2_lt = LessThan(252);
    step2_lt.in[0] <== num_msg_bits;
    step2_lt.in[1] <== padded_length;
    step2_lt.out === 1;

    // Step 3: Select the bit at the position denoted by said field element
    component step3_selector = Selector(padded_length - 64);
    step3_selector.index <== num_msg_bits;
    for (var i = 0; i < padded_length - 64; i ++) {
        step3_selector.in[i] <== padded_bits[i];
    }

    // Step 4: Ensure that the bit at this position is 1
    step3_selector.out === 1;

    // Step 5: Check that num_msg_bits bits of padded_bits starts with the
    // num_msg_bits of msg
    // Note that this takes up the bulk of constraints of this circuit
    component step5_sw = StartsWith(padded_length - 64);
    step5_sw.num_elements <== num_msg_bits;
    for (var i = 0; i < padded_length - 64; i ++) {
        step5_sw.a[i] <== msg[i];
        step5_sw.b[i] <== padded_bits[i];
    }

    // Step 6: Check that the bits between (num_msg_bits + 1) and
    // (padded_length - 64) are 0
    component step6_czp = CheckZeroPad(padded_length - 64);
    step6_czp.start <== num_msg_bits + 1;
    step6_czp.end <== padded_length - 64;
    for (var i = 0; i < padded_length - 64; i ++) {
        step6_czp.in[i] <== padded_bits[i];
    }

    // Step 7: Check that each value in padded_bits and msg is either 0 or 1
    component step7_is_bin_a[padded_length];
    component step7_is_bin_b[padded_length];
    for (var i = 0; i < padded_length; i ++) {
        step7_is_bin_a[i] = IsBinary();
        step7_is_bin_a[i].in <== padded_bits[i];

        step7_is_bin_b[i] = IsBinary();
        step7_is_bin_b[i].in <== msg[i];
    }
}

// Ensures that the input is either 0 or 1
template IsBinary() {
    signal input in;
    component a = IsEqual();
    a.in[0] <== in;
    a.in[1] <== 0;
    component b = IsEqual();
    b.in[0] <== in;
    b.in[1] <== 1;

    a.out + b.out === 1;
}

// Outputs the SHA256 hash of padded_bits.
// msg must be the message to hash, in bits, right-padded with zeros.
template Sha256Hash(padded_length) {
    var num_blocks = padded_length / 512;
    assert(num_blocks * 512 == padded_length);

    signal input padded_bits[padded_length];
    signal input msg[padded_length];
    signal output out[256];

    component vpb = VerifyPaddedBits(padded_length);
    for (var i = 0; i < padded_length; i ++) {
        vpb.padded_bits[i] <== padded_bits[i];
        vpb.msg[i] <== msg[i];
    }

    component sha256Raw = Sha256Raw(padded_length);
    for (var i = 0; i < padded_length; i ++) {
        sha256Raw.padded_bits[i] <== padded_bits[i];
    }

    for (var i = 0; i < 256; i ++) {
        out[i] <== sha256Raw.out[i];
    }
}

// Given a message, pad it according to RFC4634, section 4.1.
/*template PadBits(msg_length) {*/
    /*// This circuit isn't used in the secp256k1_hash_to_curve project, but may*/
    /*// be useful for other projects.*/
    /*var msg_bits_length = msg_length * 8;*/
    /*var s = msg_bits_length + 1;*/
    /*var total_bits_length = calc_padded_bits_length(msg_length);*/

    /*signal input msg[msg_length];*/
    /*signal output out[total_bits_length];*/

    /*var k = total_bits_length - s;*/

    /*// Step 1: output msg as bits*/
    /*component step1_n2b[msg_length];*/
    /*for (var i = 0; i < msg_length; i ++) {*/
        /*step1_n2b[i] = Num2Bits(8);*/
        /*step1_n2b[i].in <== msg[i];*/
        /*for (var j = 0; j < 8; j ++) {*/
            /*out[i * 8 + (7 - j)] <== step1_n2b[i].out[j];*/
        /*}*/
    /*}*/

    /*// Step 2: append 1*/
    /*out[msg_length * 8] <== 1;*/

    /*// Step 3: append 0s*/
    /*for (var i = s; i < total_bits_length - 64; i ++) {*/
        /*out[i] <== 0;*/
    /*}*/
    
    /*// Step 4: append msg_length as a 64-bit value*/
    /*signal step4_length_in_binary[64];*/
    /*component step4_n2b = Num2Bits(64);*/
    /*step4_n2b.in <== msg_bits_length;*/
    /*for (var i = 7; i >= 0; i --) {*/
        /*for (var j = 0; j < 8; j ++) {*/
            /*step4_length_in_binary[(7 - i) * 8 + j] <== step4_n2b.out[i * 8 + (7 - j)];*/
        /*}*/
    /*}*/

    /*for (var i = 0; i < 64; i ++) {*/
        /*out[total_bits_length - 64 + i] <== step4_length_in_binary[i];*/
    /*}*/
/*}*/

// Output the SHA256 hash of the padded_bits. i.e. the input message is already
// padded.
template Sha256Raw(num_bits) {
    // num_bits is the number of padded bits. It must be a multiple of 512.
    var nBlocks = num_bits \ 512;
    assert(nBlocks * 512 == num_bits);
    signal input padded_bits[num_bits];
    signal output out[256];

    component sha256compression[nBlocks];
    component h[8];

    for (var i = 0; i < 8; i ++) {
        h[i] = H(i);
    }

    for (var i = 0; i < nBlocks; i ++) {
        sha256compression[i] = Sha256compression();

        if (i == 0) {
            for (var j = 0; j < 32; j ++) {
                for (var k = 0; k < 8; k ++) {
                    sha256compression[i].hin[k * 32 + j] <== h[k].out[j];
                }
            }
        } else {
            for (var j = 0; j < 32; j ++) {
                for (var k = 0; k < 8; k ++) {
                    sha256compression[i].hin[32 * k + j] <== sha256compression[i-1].out[32 * k + 31 - j];
                }
            }
        }

        for (var j = 0; j < 512; j ++) {
            sha256compression[i].inp[j] <== padded_bits[i * 512 + j];
        }
    }

    for (var i = 0; i < 256; i++) {
        out[i] <== sha256compression[nBlocks - 1].out[i];
    }
}
