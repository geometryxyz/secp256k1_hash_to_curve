pragma circom 2.0.0;
include "./constants.circom";
include "../node_modules/circom-ecdsa/circuits/bigint.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/sha256/sha256.circom";
/*include "../node_modules/circomlib/circuits/sha256/sha256.circom";*/
/*include "../node_modules/circomlib/circuits/bitify.circom";*/
/*include "../node_modules/circomlib/circuits/gates.circom";*/

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
