pragma circom 2.0.0;

include "./constants.circom";
include "./arith.circom";
include "./iso_map.circom";
include "../node_modules/circom-ecdsa/circuits/bigint.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/mux1.circom";
include "../node_modules/circom-ecdsa/node_modules/circomlib/circuits/comparators.circom";

template CMov() {
    // The spec says "CMOV(a, b, c): If c is False, CMOV returns a, otherwise
    // it returns b."

    // As such, if c is 0, output a. Otherwise, output b. 
    signal input a[4];
    signal input b[4];
    signal input c;
    signal output out[4];

    component mux = MultiMux1(4);
    for (var i = 0; i < 4; i ++) {
        mux.c[0][i] <== a[i];
        mux.c[1][i] <== b[i];
    }
    mux.s <== c;

    for (var i = 0; i < 4; i ++) {
        out[i] <== mux.out[i];
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

template IsEqualBigInt() {
    signal input a[4];
    signal input b[4];
    signal output out;

    component is_eq[4];
    signal sum[5];
    sum[0] <== 0;
    for (var i = 0; i < 4; i ++) {
        is_eq[i] = IsEqual();
        is_eq[i].in[0] <== a[i];
        is_eq[i].in[1] <== b[i];
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

    signal r <-- val % 2;
    signal q <-- val \ 2;

    // Ensure that r is 0 xor 1
    r * (r - 1) === 0;

    // Ensure that q * 2 + r equals the input
    q * 2 + r === val;

    component num2bits = Num2Bits(64);
    num2bits.in <== in[0];
    r === num2bits.out[0];

    // If the remainder is 0, output 0; if it is 1, output 1
    out <== r;
}

template XY2Selector() {
    // Either gx1 or gx2 are square.
    signal input gx1[4];
    signal input gx1_sqrt[4];
    signal input gx2[4];
    signal input gx2_sqrt[4];
    signal input x1[4];
    signal input x2[4];
    signal output x[4];
    signal output y2[4];

    // Step 1: square gx1_sqrt
    component sq_gx1_sqrt = Square();
    for (var i = 0; i < 4; i ++) {
        sq_gx1_sqrt.in[i] <== gx1_sqrt[i];
    }

    // Step 2: square gx2_sqrt
    component sq_gx2_sqrt = Square();
    for (var i = 0; i < 4; i ++) {
        sq_gx2_sqrt.in[i] <== gx2_sqrt[i];
    }

    // Step 3: s1 = IsEqual(gx1, sq_gx1_sqrt)
    component s1 = IsEqualBigInt();
    for (var i = 0; i < 4; i ++) {
        s1.a[i] <== gx1[i];
        s1.b[i] <== sq_gx1_sqrt.out[i];
    }

    // Step 4: s2 = IsEqual(gx2, sq_gx2_sqrt)
    component s2 = IsEqualBigInt();
    for (var i = 0; i < 4; i ++) {
        s2.a[i] <== gx2[i];
        s2.b[i] <== sq_gx2_sqrt.out[i];
    }

    // Step 5: Constrain s1 + s2 === 1
    s1.out + s2.out === 1;

    // Step 6: x <== s1 == 1 ? x1 : x2
    component x_cmov = CMov();
    x_cmov.c <== s1.out;
    for (var i = 0; i < 4; i ++) {
        x_cmov.a[i] <== x2[i];
        x_cmov.b[i] <== x1[i];
    }

    // Step 7: y2 <== s1 == 1 ? gx1 : gx2
    component y2_cmov = CMov();
    y2_cmov.c <== s1.out;
    for (var i = 0; i < 4; i ++) {
        y2_cmov.a[i] <== gx2[i];
        y2_cmov.b[i] <== gx1[i];
    }

    for (var i = 0; i < 4; i ++) {
        x[i] <== x_cmov.out[i];
        y2[i] <== y2_cmov.out[i];
    }
}

// Each step corresponds to a line in the reference implementation here https://github.com/cfrg/draft-irtf-cfrg-hash-to-curve/blob/eb001eaea0f49066dad611a4c7cb2749f167b97e/poc/sswu_generic.sage#L76-L97
template MapToCurve() {
    signal input u[4];
    signal input gx1_sqrt[4];
    signal input gx2_sqrt[4];
    signal input y_pos[4];
    signal input x_mapped[4];
    signal input y_mapped[4];
    signal output x[4];
    signal output y[4];

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
    // Steps 16-18:
    //     e2 = is_square(gx1)
    //     x = CMOV(x2, x1, e2)    # If is_square(gx1), x = x1, else x = x2
    //     y2 = CMOV(gx2, gx1, e2)  # If is_square(gx1), y2 = gx1, else y2 = gx2
    component step16_x_y2_selector = XY2Selector();
    for (var i = 0; i < 4; i ++) {
        step16_x_y2_selector.gx1[i] <== step12_gx1.out[i];
        step16_x_y2_selector.gx1_sqrt[i] <== gx1_sqrt[i];
        step16_x_y2_selector.gx2[i] <== step15_gx2.out[i];
        step16_x_y2_selector.gx2_sqrt[i] <== gx2_sqrt[i];
        step16_x_y2_selector.x1[i] <== step8_x1_mul_c1.out[i];
        step16_x_y2_selector.x2[i] <== step13_x2.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 19: y = sqrt(y2)
    component step19_expected_y2 = Square();
    for (var i = 0; i < 4; i ++) {
        step19_expected_y2.in[i] <== y_pos[i];
    }
    // Ensure that the square of the input signal y equals step16_x_y2_selector.y2
    for (var i = 0; i < 4; i ++) {
        step16_x_y2_selector.y2[i] === step19_expected_y2.out[i];
    }

    ///////////////////////////////////////////////////////////////////////////
    // Step 20: e3 = sgn0(u) == sgn0(y)  # Fix sign of y
    component sgn0_u = Sgn0();
    component sgn0_y = Sgn0();
    for (var i = 0; i < 4; i ++) {
        sgn0_u.in[i] <== u[i];
        sgn0_y.in[i] <== y_pos[i];
    }
    component step20_e3 = IsEqual();
    step20_e3.in[0] <== sgn0_u.out;
    step20_e3.in[1] <== sgn0_y.out;

    ///////////////////////////////////////////////////////////////////////////
    // Step 21: y = CMOV(-y, y, e3)
    component neg_y = Negate();
    for (var i = 0; i < 4; i ++) {
        neg_y.in[i] <== y_pos[i];
    }

    component step21_y = CMov();
    step21_y.c <== step20_e3.out;
    for (var i = 0; i < 4; i ++) {
        step21_y.a[i] <== neg_y.out[i];
        step21_y.b[i] <== y_pos[i];
    }

    component isomap = IsoMap();
    for (var i = 0; i < 4; i ++) {
        isomap.x[i] <== step16_x_y2_selector.x[i];
        isomap.y[i] <== step21_y.out[i];
        isomap.x_mapped[i] <== x_mapped[i];
        isomap.y_mapped[i] <== y_mapped[i];
    }

    for (var i = 0; i < 4; i ++) {
        x[i] <== x_mapped[i];
        y[i] <== y_mapped[i];
    }
}
