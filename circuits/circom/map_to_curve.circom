pragma circom 2.0.0;

include "./constants.circom";
include "../node_modules/circom-ecdsa/circuits/bigint.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/comparators.circom";

template CMov() {
    // If c is 0, output a. Otherwise, output b. 
    signal input a[4];
    signal input b[4];
    signal input c;
    signal output out[4];

    component mux[4];
    for (var i = 0; i < 4; i ++) {
        mux[i] = Mux1();
        mux[i].c[0] <== a[i];
        mux[i].c[1] <== b[i];
        mux[i].s <== c;
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== mux[i].out;
    }
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

template ZMulUSquared() {
    signal input u_squared[4];
    signal output out[4];
    var z[4] = get_Z();

    component mul = Multiply();
    for (var i = 0; i < 4; i ++) {
        mul.a[i] <== u_squared[i];
        mul.b[i] <== z[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== mul.out[i];
    }
}

// TODO: this is possibly insecure since the prover can provide expected_sqrt.
// TODO: to fix this, perhaps do a = expected_sqrt_minus_1, b =
// expected_sqrt, and c = expected_sqrt_plus_one too, and square those, and
// show that a^2 < n < c ^ 2
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

// Output 0 if the input is even, and 1 if it is odd
template Sgn0() {
    signal input in[4];
    signal output out;

    // Only need to test the 0th bigint register
    signal val;
    val <== in[0];

    signal r;
    r <-- val % 2;

    var q = val \ 2;

    // Ensure that r is 0 xor 1
    component is0 = IsEqual();
    is0.in[0] <== r;
    is0.in[1] <== 0;

    component is1 = IsEqual();
    is1.in[0] <== r;
    is1.in[1] <== 1;

    is0.out + is1.out === 1;

    // Ensure that q * 2 + r equals the input
    q * 2 + r === val;

    // If the remainder is 0, output 0; if it is 1, output 1
    out <== r;
}

template MapToCurve() {
    signal input u[4];
    signal output x;
    signal output y;

    ///////////////////////////////////////////////////////////////////////////
    // Step 1: tv1 = Z * u^2
    component step1_u_sq = Square();
    for (var i = 0; i < 4; i ++) {
        step1_u_sq.in[i] <== u[i];
    }
    component step1_tv1 = ZMulUSquared();
    for (var i = 0; i < 4; i ++) {
        step1_tv1.u_squared[i] <== step1_u_sq.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 2: tv2 = tv1^2
    component step2_tv2 = Square();
    for (var i = 0; i < 4; i ++) {
        step2_tv2.in[i] <== step1_tv1.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 3: x1 = tv1 + tv2
    component step3_tv1_plus_tv2 = Add();
    for (var i = 0; i < 4; i ++) {
        step3_tv1_plus_tv2.a[i] <== step1_tv1.out[i];
        step3_tv1_plus_tv2.b[i] <== step2_tv2.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 4: x1 = inv0(x1)
    component step4_inv0_x1 = Inv0();
    for (var i = 0; i < 4; i ++) {
        step4_inv0_x1.a[i] <== step3_tv1_plus_tv2.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 5: e1 = x1 == 0
    component step5_is_zeroes[4];
    for (var i = 0; i < 4; i ++) {
        step5_is_zeroes[i] = IsZero();
        step5_is_zeroes[i].in <== step4_inv0_x1.out[i];
    }
    component step5_e1 = IsEqual();
    step5_e1.in[0] <== 
        step5_is_zeroes[0].out +
        step5_is_zeroes[1].out +
        step5_is_zeroes[2].out +
        step5_is_zeroes[3].out;
    step5_e1.in[1] <== 4;

    ///////////////////////////////////////////////////////////////////////////
    // Step 6: x1 = x1 + 1
    component step6_x1_plus_1 = Add();
    for (var i = 0; i < 4; i ++) {
        step6_x1_plus_1.a[i] <== step4_inv0_x1.out[i];
    }
    step6_x1_plus_1.b[0] <== 1;
    step6_x1_plus_1.b[1] <== 0;
    step6_x1_plus_1.b[2] <== 0;
    step6_x1_plus_1.b[3] <== 0;

    ///////////////////////////////////////////////////////////////////////////
    // Step 7: x1 = CMOV(x1, c2, e1)    # If (tv1 + tv2) == 0, set x1 = -1 / Z
    var c2[4] = get_C2();
    component step7_cmov = CMov();
    step7_cmov.c <== step5_e1.out;
    for (var i = 0; i < 4; i ++) {
        step7_cmov.a[i] <== step6_x1_plus_1.out[i];
        step7_cmov.b[i] <== c2[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 8: x1 = x1 * c1      # x1 = (-B / A) * (1 + (1 / (Z^2 * u^4 + Z * u^2)))
    component step8_x1_mul_c1 = Multiply();
    var c1[4] = get_C1();
    for (var i = 0; i < 4; i ++) {
        step8_x1_mul_c1.a[i] <== step7_cmov.out[i];
        step8_x1_mul_c1.b[i] <== c1[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 9: gx1 = x1^2
    component step9_gx1 = Square();
    for (var i = 0; i < 4; i ++) {
        step9_gx1.in[i] <== step8_x1_mul_c1.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 10: gx1 = gx1 + A
    var a[4] = get_A();
    component step10_gx1 = Add();
    for (var i = 0; i < 4; i ++) {
        step10_gx1.a[i] <== step9_gx1.out[i];
        step10_gx1.b[i] <== a[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 11: gx1 = gx1 * x1
    component step11_gx1_mul_x1 = Multiply();
    for (var i = 0; i < 4; i ++) {
        step11_gx1_mul_x1.a[i] <== step10_gx1.out[i];
        step11_gx1_mul_x1.b[i] <== step8_x1_mul_c1.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 12: gx1 = gx1 + B             # gx1 = g(x1) = x1^3 + A * x1 + B
    var b[4] = get_B();
    component step12_gx1 = Add();
    for (var i = 0; i < 4; i ++) {
        step12_gx1.a[i] <== step11_gx1_mul_x1.out[i];
        step12_gx1.b[i] <== b[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 13: x2 = tv1 * x1            # x2 = Z * u^2 * x1
    component step13_x2 = Multiply();
    for (var i = 0; i < 4; i ++) {
        step13_x2.a[i] <== step1_tv1.out[i];
        step13_x2.b[i] <== step8_x1_mul_c1.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 14: tv2 = tv1 * tv2
    component step14_tv2 = Multiply();
    for (var i = 0; i < 4; i ++) {
        step14_tv2.a[i] <== step1_tv1.out[i];
        step14_tv2.b[i] <== step2_tv2.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 15: gx2 = gx1 * tv2           # gx2 = (Z * u^2)^3 * gx1
    component step15_gx2 = Multiply();
    for (var i = 0; i < 4; i ++) {
        step15_gx2.a[i] <== step12_gx1.out[i];
        step15_gx2.b[i] <== step14_tv2.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 16: e2 = is_square(gx1)

    ///////////////////////////////////////////////////////////////////////////
    // Step 17: x = CMOV(x2, x1, e2)    # If is_square(gx1), x = x1, else x = x2

    ///////////////////////////////////////////////////////////////////////////
    // Step 18: y2 = CMOV(gx2, gx1, e2)  # If is_square(gx1), y2 = gx1, else y2 = gx2

    ///////////////////////////////////////////////////////////////////////////
    // Step 18: y = sqrt(y2)

    ///////////////////////////////////////////////////////////////////////////
    // Step 19: e3 = sgn0(u) == sgn0(y)  # Fix sign of y

    ///////////////////////////////////////////////////////////////////////////
    // Step 20: y = CMOV(-y, y, e3)

    x <== 0;
    y <== 0;

}
