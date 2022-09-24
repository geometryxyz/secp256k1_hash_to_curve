pragma circom 2.0.0;
include "../node_modules/circomlib/circuits/sha256/sha256.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

function get_dst_prime() {
    var dst_prime[50] = [
        81, 85, 85, 88, 45, 86, 48, 49, 45, 67, 83, 48, 50, 45, 119, 105, 116,
        104, 45, 115, 101, 99, 112, 50, 53, 54, 107, 49, 95, 88, 77, 68, 58,
        83, 72, 65, 45, 50, 53, 54, 95, 83, 83, 87, 85, 95, 82, 79, 95, 49
    ];
    return dst_prime;
}

function get_lib_str() {
    var lib_str[2] = [0, 96];
    return lib_str;
}

function get_z_pad() {
    var z_pad[64];
    for (var i = 0; i < 64; i ++) {
        z_pad[i] = 0;
    }
    return z_pad;
}

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

    component hasher = Sha256(msg_prime_length * 8);
    component n2b[msg_prime_length];
    for (var i = 0; i < msg_prime_length; i ++) {
        n2b[i] = Num2Bits(8);
        n2b[i].in <== msg_prime[i];
        for (var j = 0; j < 8; j ++) {
            hasher.in[i * 8 + (7 - j)] <== n2b[i].out[j];
        }
    }

    signal output hash[256];
    for (var i = 0; i < 256; i ++) {
        hash[i] <== hasher.out[i];
    }
}

template HashB0ToB1() {
    signal input b0_bits[256];
    signal output b1_bits[256];

    var num_preimage_bits = 256 + 8 + (50 * 8);
    component hasher = Sha256(num_preimage_bits);
    for (var i = 0; i < 32; i ++) {
        for (var j = 0; j < 8; j ++) {
            hasher.in[i * 8 + (j)] <== b0_bits[i * 8 + (j)];
        }
    }
    hasher.in[256 + 0] <== 0;
    hasher.in[256 + 1] <== 0;
    hasher.in[256 + 2] <== 0;
    hasher.in[256 + 3] <== 0;
    hasher.in[256 + 4] <== 0;
    hasher.in[256 + 5] <== 0;
    hasher.in[256 + 6] <== 0;
    hasher.in[256 + 7] <== 1;

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
        b1_bits[i] <== hasher.out[i];
    }
}
