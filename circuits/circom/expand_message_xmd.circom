pragma circom 2.0.0;
include "./constants.circom";
include "./calculateTotal.circom";
include "./Sha256.circom";
include "../node_modules/circom-ecdsa/circuits/bigint.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/sha256/sha256.circom";

function calc_msg_prime_output_length(msg_length) {
    return msg_length + 64 + 2 + 50 + 1;
}

template MsgPrime(msg_length) {
    var output_length = calc_msg_prime_output_length(msg_length);

    signal input msg[msg_length];
    signal output out[output_length];

    signal msg_prime[output_length];

    var z_pad[64] = get_z_pad();
    var lib_str[2] = get_lib_str();
    var dst_prime[50] = get_dst_prime();

    // msg_prme = z_pad ...
    for (var i = 0; i < 64; i ++) {
        msg_prime[i] <== z_pad[i];
    }

    // msg_prme = z_pad || msg ...
    for (var i = 0; i < msg_length; i ++) {
        msg_prime[64 + i] <== msg[i];
    }

    // msg_prme = z_pad || msg || lib_str ...
    for (var i = 0; i < 2; i ++) {
        msg_prime[64 + msg_length + i] <== lib_str[i];
    }

    // msg_prme = z_pad || msg || lib_str || 0 ...
    msg_prime[64 + msg_length + 2] <== 0;

    // msg_prme = z_pad || msg || lib_str || 0 || dst_prime
    for (var i = 0; i < 50; i ++) {
        msg_prime[64 + msg_length + 2 + 1 + i] <== dst_prime[i];
    }

    for (var i = 0; i < output_length; i ++) {
        out[i] <== msg_prime[i];
    }
}

template HashMsgPrimeToB0(msg_length) {
    var msg_prime_length = calc_msg_prime_output_length(msg_length);
    signal input msg_prime[msg_prime_length];
    signal output hash[256];

    component hasher = Sha256(msg_prime_length * 8);
    component n2b[msg_prime_length];
    for (var i = 0; i < msg_prime_length; i ++) {
        n2b[i] = Num2Bits(8);
        n2b[i].in <== msg_prime[i];
        for (var j = 0; j < 8; j ++) {
            hasher.in[i * 8 + (7 - j)] <== n2b[i].out[j];
        }
    }

    for (var i = 0; i < 256; i ++) {
        hash[i] <== hasher.out[i];
    }
}

template HashBi(b_idx) {
    signal input b0_bits[256];
    signal input bi_minus_one_bits[256];
    signal output bi_bits[256];

    component strxor = StrXor(256);
    component hashb = HashB(b_idx);

    for (var i = 0; i < 256; i ++) {
        strxor.a[i] <== b0_bits[i];
        strxor.b[i] <== bi_minus_one_bits[i];
    }

    for (var i = 0; i < 256; i ++) {
        hashb.b_bits[i] <== strxor.out[i];
    }

    for (var i = 0; i < 256; i ++) {
        bi_bits[i] <== hashb.bi_bits[i];
    }
}

template HashB(b_idx) {
    assert(b_idx < 8);

    signal input b_bits[256];
    signal output bi_bits[256];

    var num_preimage_bits = 256 + 8 + (50 * 8);
    component hasher = Sha256(num_preimage_bits);
    for (var i = 0; i < 32; i ++) {
        for (var j = 0; j < 8; j ++) {
            hasher.in[i * 8 + (j)] <== b_bits[i * 8 + (j)];
        }
    }

    component digit_n2b = Num2Bits(8);
    digit_n2b.in <== b_idx;
    for (var i = 0; i < 8; i ++) {
        hasher.in[256 + i] <== digit_n2b.out[7 - i];
    }

    var dst_prime[50] = get_dst_prime();
    component n2b[50];
    for (var i = 0; i < 50; i ++) {
        n2b[i] = Num2Bits(8);
        n2b[i].in <== dst_prime[i];
        for (var j = 0; j < 8; j ++) {
            hasher.in[256 + 8 + (i * 8) + (j)] <== n2b[i].out[7 - j];
        }
    }
    for (var i = 0; i < 256; i ++) {
        bi_bits[i] <== hasher.out[i];
    }
}

template StrXor(n) {
    // TODO: For safety, should the inputs be constrained to be 0 <= n <= 255?
    signal input a[n];
    signal input b[n];
    signal output out[n];

    component xor[n][8];
    component n2b_a[n];
    component n2b_b[n];
    component b2n[n];
    for (var i = 0; i < n; i ++) {
        n2b_a[i] = Num2Bits(8);
        n2b_a[i].in <== a[i];
        n2b_b[i] = Num2Bits(8);
        n2b_b[i].in <== b[i];
        b2n[i] = Bits2Num(8);
        for (var j = 0; j < 8; j ++) {
            xor[i][j] = XOR();
            xor[i][j].a <== n2b_a[i].out[j];
            xor[i][j].b <== n2b_b[i].out[j];
            b2n[i].in[j] <== xor[i][j].out;
        }
    }
    for (var i = 0; i < n; i ++) {
        out[i] <== b2n[i].out;
    }
}

template ExpandMessageXmd(msg_length) {
    signal input msg[msg_length];
    signal output out[96];

    component msg_prime = MsgPrime(msg_length);
    for (var i = 0; i < msg_length; i ++) {
        msg_prime.msg[i] <== msg[i];
    }

    component b0 = HashMsgPrimeToB0(msg_length);
    var msg_prime_length = calc_msg_prime_output_length(msg_length);
    for (var i = 0; i < msg_prime_length; i ++) {
        b0.msg_prime[i] <== msg_prime.out[i];
    }

    component b1 = HashB(1);
    for (var i = 0; i < 256; i ++) {
        b1.b_bits[i] <== b0.hash[i];
    }

    component b2 = HashBi(2);
    for (var i = 0; i < 256; i ++) {
        b2.b0_bits[i] <== b0.hash[i];
        b2.bi_minus_one_bits[i] <== b1.bi_bits[i];
    }

    component b3 = HashBi(3);
    for (var i = 0; i < 256; i ++) {
        b3.b0_bits[i] <== b0.hash[i];
        b3.bi_minus_one_bits[i] <== b2.bi_bits[i];
    }

    component b2n_b1[32];
    for (var i = 0; i < 32; i ++) {
        b2n_b1[i] = Bits2Num(8);
        for (var j = 0; j < 8; j ++) {
            b2n_b1[i].in[j] <== b1.bi_bits[i * 8 + (7 - j)];
        }
        out[i] <== b2n_b1[i].out;
    }

    component b2n_b2[32];
    for (var i = 0; i < 32; i ++) {
        b2n_b2[i] = Bits2Num(8);
        for (var j = 0; j < 8; j ++) {
            b2n_b2[i].in[j] <== b2.bi_bits[i * 8 + (7 - j)];
        }
        out[32 + i] <== b2n_b2[i].out;
    }

    component b2n_b3[32];
    for (var i = 0; i < 32; i ++) {
        b2n_b3[i] = Bits2Num(8);
        for (var j = 0; j < 8; j ++) {
            b2n_b3[i].in[j] <== b3.bi_bits[i * 8 + (7 - j)];
        }
        out[64 + i] <== b2n_b3[i].out;
    }
}

// msg_prime_length is in bytes
template VerifyMsgPrime(padded_length) {
    signal input msg_prime[padded_length];
    signal input offset_msg[padded_length];
    signal input msg_length; // in bytes

    var offset = 64;

    // msg_prime = z_pad || msg || lib_str || 0 || dst_prime

    // Step 1: Check that msg_prime starts with z_pad (64 zeroes)
    for (var i = 0; i < offset; i ++) {
    msg_prime[i] === 0;
    }

    // Step 2: Verify that offset_msg is valid
    component zs = ZeroSandwich(offset, padded_length);
    zs.substring_length <== msg_length;
    for (var i = 0; i < padded_length; i ++) {
    zs.in[i] <== offset_msg[i];
    }

    // Step 3: Check that msg_prime starts with offset_msg values from offset
    // onwards
    /*
        msg_length = 4
        [1, 2, 3, 4, 5, 0, 0, 8] <- msg_prime
        [1, 2, 3, 4, 0, 0, 0, 0] <- offset_msg
        a: [1, 1, 1, 1, 0, 1, 1, 0] <- [msg_prime[i] == offset_msg[i] for i in length]
        b: [1, 1, 1, 1, 0, 0, 0, 0] <- [i < msg_length ? 1 : 0 for i in length]
        c: [1, 1, 1, 1, 0, 0, 0, 0] <- [a[i] * b[i] for i in length]
        sum(c) === msg_length
     */

    component iseq_a[padded_length - offset];
    component lt_b[padded_length - offset];
    component ct_c = CalculateTotal(padded_length - offset);

    for (var i = 0; i < padded_length - offset; i ++) {
        iseq_a[i] = IsEqual();
        iseq_a[i].in[0] <== msg_prime[offset + i];
        iseq_a[i].in[1] <== offset_msg[offset + i];

        // TODO: save on constraints by first checking that msg_length is
        // less than length (using LessThan(252) outside the loop), then using
        // LessThan(log2(msg_length)) inside the loop
        lt_b[i] = LessThan(252);
        lt_b[i].in[0] <== offset + i;
        lt_b[i].in[1] <== offset + msg_length;

        ct_c.in[i] <== iseq_a[i].out * lt_b[i].out;
    }

    ct_c.out === msg_length;

    // Step 4: Check that msg_prime contains lib_str || 0 || dst_prime from
    component lib_str_selector[2];
    component zero_selector = Selector(padded_length);
    component dst_prime_selector[50];

    var lib_str[2] = get_lib_str();
    var dst_prime[50] = get_dst_prime();

    for (var i = 0; i < 2; i ++) {
        lib_str_selector[i] = Selector(padded_length);
        lib_str_selector[i].index <== offset + msg_length + i;
        for (var j = 0; j < padded_length; j ++) {
            lib_str_selector[i].in[j] <== msg_prime[j];
        }
        lib_str_selector[i].out === lib_str[i];
    }

    zero_selector.index <== offset + msg_length + 2;
    for (var i = 0; i < padded_length; i ++) {
        zero_selector.in[i] <== msg_prime[i];
    }
    zero_selector.out === 0;

    for (var i = 0; i < 50; i ++) {
        dst_prime_selector[i] = Selector(padded_length);
        dst_prime_selector[i].index <== offset + msg_length + 2 + 1 + i;
        for (var j = 0; j < padded_length; j ++) {
            dst_prime_selector[i].in[j] <== msg_prime[j];
        }
        dst_prime_selector[i].out === dst_prime[i];
    }
}

// padded_msg_prime_length is in bytes
template ExpandMessageXmd2(padded_msg_prime_length) {
    // offset_msg must be offset by 64 zeros and end with 0s. e.g. if msg = [1,
    // 2, 3], then offset_msg = [0, 0, ... 0, 1, 2, 3, 0, 0...]
    signal input offset_msg[padded_msg_prime_length];
    signal input msg_length; // in bytes

    signal input msg_prime[padded_msg_prime_length];
    signal input padded_msg_prime[padded_msg_prime_length];

    signal output out[96];

    var offset = 64; // the length of z_prime
    
    // Step 1: Ensure that each value in offset_msg, msg_prime, and
    // padded_msg_prime are < 256
    // TODO

    // Step 2: Verify that msg_prime is valid
    component v = VerifyMsgPrime(padded_msg_prime_length);
    v.msg_length <== msg_length;
    for (var i = 0; i < padded_msg_prime_length; i ++) {
        v.msg_prime[i] <== msg_prime[i];
        v.offset_msg[i] <== offset_msg[i];
    }

    // Step 3: Convert padded_msg_prime and msg_prime_bits to bits
    signal padded_msg_prime_bits[padded_msg_prime_length * 8];
    signal msg_prime_bits[padded_msg_prime_length * 8];
    component n2b_a[padded_msg_prime_length];
    component n2b_b[padded_msg_prime_length];
    for (var i = 0; i < padded_msg_prime_length; i ++) {
        n2b_a[i] = Num2Bits(8);
        n2b_b[i] = Num2Bits(8);
        n2b_a[i].in <== padded_msg_prime[i];
        n2b_b[i].in <== msg_prime[i];
        for (var j = 0; j < 8; j ++) {
            padded_msg_prime_bits[i * 8 + (7 - j)] <== n2b_a[i].out[j];
            msg_prime_bits[i * 8 + (7 - j)] <== n2b_b[i].out[j];
        }
    }

    // Step 4: Hash padded_msg_prime to derive B0
    component b0 = Sha256Hash(padded_msg_prime_length * 8);
    for (var i = 0; i < padded_msg_prime_length * 8; i ++) {
        b0.padded_bits[i] <== padded_msg_prime_bits[i];
        b0.msg[i] <== msg_prime_bits[i];
    }

    /*signal output out[256];*/
    /*for (var i = 0; i < 256; i ++) {*/
        /*out[i] <== hasher.out[i];*/
    /*}*/
    component b1 = HashB(1);
    for (var i = 0; i < 256; i ++) {
        b1.b_bits[i] <== b0.out[i];
    }

    component b2 = HashBi(2);
    for (var i = 0; i < 256; i ++) {
        b2.b0_bits[i] <== b0.out[i];
        b2.bi_minus_one_bits[i] <== b1.bi_bits[i];
    }

    component b3 = HashBi(3);
    for (var i = 0; i < 256; i ++) {
        b3.b0_bits[i] <== b0.out[i];
        b3.bi_minus_one_bits[i] <== b2.bi_bits[i];
    }

    component b2n_b1[32];
    for (var i = 0; i < 32; i ++) {
        b2n_b1[i] = Bits2Num(8);
        for (var j = 0; j < 8; j ++) {
            b2n_b1[i].in[j] <== b1.bi_bits[i * 8 + (7 - j)];
        }
        out[i] <== b2n_b1[i].out;
    }

    component b2n_b2[32];
    for (var i = 0; i < 32; i ++) {
        b2n_b2[i] = Bits2Num(8);
        for (var j = 0; j < 8; j ++) {
            b2n_b2[i].in[j] <== b2.bi_bits[i * 8 + (7 - j)];
        }
        out[32 + i] <== b2n_b2[i].out;
    }

    component b2n_b3[32];
    for (var i = 0; i < 32; i ++) {
        b2n_b3[i] = Bits2Num(8);
        for (var j = 0; j < 8; j ++) {
            b2n_b3[i].in[j] <== b3.bi_bits[i * 8 + (7 - j)];
        }
        out[64 + i] <== b2n_b3[i].out;
    }
}

// The first offset elements of in should be 0, followed by substring_length
// elements, and the rest should be 0
template ZeroSandwich(offset, length) {
    assert(offset < length);
    signal input in[length];
    signal input substring_length;

    // Check that the first offset elements are 0
    component isz[offset];
    for (var i = 0; i < offset; i ++) {
        isz[i] = IsZero();
        isz[i].in <== in[i];
        isz[i].out === 1;
    }

    /*
       length = 8
       offset = 4
       substring_length = 2
in: [0, 0, 0, 0, 5, 6, 0, 0]
a:  [0, 0, 0, 0, 0, 0, 1, 1] <- [i >= (offset + substring_length) for i in length]
b:  [0, 0, 0, 0, 0, 0, 0, 0] <- [a[i] * in[i] for in in length]
check that each element from offset onwards is 0
     */

    component gte_a[length - offset];
    component isz_b[length - offset];
    for (var i = offset; i < length; i ++) {
        // TODO: save on constraints by first checking that substring_length is
        // less than length (using LessThan(252) outside the loop), then using
        // GreaterEqThan(log2(length)) inside the loop
        gte_a[i - offset] = GreaterEqThan(252);
        gte_a[i - offset].in[0] <== i;
        gte_a[i - offset].in[1] <== offset + substring_length;

        isz_b[i - offset] = IsZero();
        isz_b[i - offset].in <== gte_a[i - offset].out * in[i];
        isz_b[i - offset].out === 1;
    }
}
