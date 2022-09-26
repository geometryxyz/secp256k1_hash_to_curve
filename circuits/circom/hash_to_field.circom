pragma circom 2.0.0;
include "./expand_message_xmd.circom";

template HashToField(msg_length) {
    signal input msg[msg_length];
    signal output u[2][4];

    component expand_message_xmd = ExpandMessageXmd(msg_length);
    for (var i = 0; i < msg_length; i ++) {
        expand_message_xmd.msg[i] <== msg[i];
    }
    /*var temp[96] = [*/
        /*// u0 bytes*/
        /*232, 52, 124, 173, 72, 171, 78, 49, 157, 123, 39, 85, 32, 234, 129,*/
        /*207, 18, 138, 171, 93, 54, 121, 161, 247, 96, 30, 59, 222, 172, 154,*/
        /*81, 208, 197, 77, 255, 208, 84, 39, 78, 219, 36, 136, 85, 230, 17, 144,*/
        /*196, 98, */
        /*// u1 bytes*/
        /*167, 187, 97, 236, 186, 142, 64, 10, 154, 118, 213, 174, 1, 78, 135,*/
        /*255, 88, 151, 182, 93, 163, 181, 149, 168, 19, 208, 253, 203, 206, 13,*/
        /*49, 111, 118, 108, 238, 235, 111, 248, 76, 222, 204, 214, 155, 224,*/
        /*231, 179, 153, 209*/
    /*];*/

    component u0_bytes_to_registers = BytesToRegisters();
    component u1_bytes_to_registers = BytesToRegisters();

    for (var i = 0; i < 48; i ++) {
        u0_bytes_to_registers.bytes[i] <== expand_message_xmd.out[i];
        u1_bytes_to_registers.bytes[i] <== expand_message_xmd.out[i + 48];
    }

    for (var i = 0; i < 4; i ++) {
        u[0][i] <== u0_bytes_to_registers.out[i];
        u[1][i] <== u1_bytes_to_registers.out[i];
    }
}

// Converts a 48-byte array into a 4-register BigInt modulo the secp256k1 prime
template BytesToRegisters() {
    signal input bytes[48];
    signal output out[4];

    // Split each byte in bytes into bits
    component n2b[48];
    for (var i = 0; i < 6; i ++) {
        for (var j = 0 ; j < 8; j ++) {
            var idx = i * 8 + j;
            n2b[idx] = Num2Bits(8);
            n2b[idx].in <== bytes[idx];
        }
    }

    // Convert each chunk of 64 bits into a register
    component b2n[6];
    for (var i = 0; i < 6; i ++) {
        b2n[i] = Bits2Num(64);
        for (var j = 0 ; j < 8; j ++) {
            for (var k = 0 ; k < 8; k ++) {
                b2n[i].in[(7-j) * 8 + k] <== n2b[i * 8 + j].out[k];
            }
        }
    }

    // Input the registers into BigMod
    component m = BigMod(64, 4);
    for (var i = 0; i < 6; i ++) {
        m.a[i] <== b2n[5 - i].out;
    }
    for (var i = 6; i < 8; i ++) {
        m.a[i] <== 0;
    }
    m.b[0] <== 18446744069414583343;
    m.b[1] <== 18446744073709551615;
    m.b[2] <== 18446744073709551615;
    m.b[3] <== 18446744073709551615;

    for (var i = 0; i < 4; i ++) {
        out[i] <== m.mod[i];
    }
}
