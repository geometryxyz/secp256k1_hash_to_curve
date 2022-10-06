pragma circom 2.0.0;

include "./constants.circom";
include "./map_to_curve.circom";
include "../node_modules/circom-ecdsa/circuits/bigint.circom";

template IsoMap() {
    signal input x[4];
    signal input y[4];
    signal input x_mapped[4];
    signal input y_mapped[4];

    // Step 1: calculate x^2
    component x_2 = Square();
    for (var i = 0; i < 4; i ++) {
        x_2.in[i] <== x[i];
    }

    // Step 2: calculate x^3
    component x_3 = Multiply();
    for (var i = 0; i < 4; i ++) {
        x_3.a[i] <== x_2.out[i];
        x_3.b[i] <== x[i];
    }

    // Step 3: calculate x_num
    component x_num = XNum();
    for (var i = 0; i < 4; i ++) {
        x_num.x[i] <== x[i];
        x_num.x_2[i] <== x_2.out[i];
        x_num.x_3[i] <== x_3.out[i];
    }

    // Step 4: calculate x_den
    component x_den = XDen();
    for (var i = 0; i < 4; i ++) {
        x_den.x[i] <== x[i];
        x_den.x_2[i] <== x_2.out[i];
    }

    // Step 5: calculate y_num
    component y_num = YNum();
    for (var i = 0; i < 4; i ++) {
        y_num.x[i] <== x[i];
        y_num.x_2[i] <== x_2.out[i];
        y_num.x_3[i] <== x_3.out[i];
    }

    // Step 6: calculate y_den
    component y_den = YDen();
    for (var i = 0; i < 4; i ++) {
        y_den.x[i] <== x[i];
        y_den.x_2[i] <== x_2.out[i];
        y_den.x_3[i] <== x_3.out[i];
    }

    // Step 7: x_mapped * x_den === x_num
    component x_check = Multiply();
    for (var i = 0; i < 4; i ++) {
        x_check.a[i] <== x_mapped[i];
        x_check.b[i] <== x_den.out[i];
    }

    // Step 8: y_mapped = y' * y_num / y_den
    // y_mapped * y_den === y' * y_num
    component y_check = Multiply();
    for (var i = 0; i < 4; i ++) {
        y_check.a[i] <== y_mapped[i];
        y_check.b[i] <== y_den.out[i];
    }
    component y_check2 = Multiply();
    for (var i = 0; i < 4; i ++) {
        y_check2.a[i] <== y[i];
        y_check2.b[i] <== y_num.out[i];
    }

    // Ensure that the provided x_mapped and y_mapped values are correct
    for (var i = 0; i < 4; i ++) {
        x_check.out[i] === x_num.out[i];
        y_check.out[i] === y_check2.out[i];
    }
}

template XNum() {
    signal input x[4];
    signal input x_2[4]; // Assumes that this value is correct
    signal input x_3[4]; // Assumes that this value is correct
    signal output out[4];
    /*
    k_(1,3) * x'^3 + 
    k_(1,2) * x'^2 + 
    k_(1,1) * x' +
    k_(1,0)
    */

    var k_1_3[4] = get_k_1_3();
    var k_1_2[4] = get_k_1_2();
    var k_1_1[4] = get_k_1_1();
    var k_1_0[4] = get_k_1_0();

    // Step 1: a = k_(1,3) * x'^3 
    component step1_a = Multiply();
    for (var i = 0; i < 4; i ++) {
        step1_a.a[i] <== k_1_3[i];
        step1_a.b[i] <== x_3[i];
    }

    // Step 2: b = k_(1,2) * x'^2 + 
    component step2_b = Multiply();
    for (var i = 0; i < 4; i ++) {
        step2_b.a[i] <== k_1_2[i];
        step2_b.b[i] <== x_2[i];
    }

    // Step 3: c = k_(1,1) * x' +
    component step3_c = Multiply();
    for (var i = 0; i < 4; i ++) {
        step3_c.a[i] <== k_1_1[i];
        step3_c.b[i] <== x[i];
    }

    // Step 4: a + b
    component step4_a_plus_b = Add();
    for (var i = 0; i < 4; i ++) {
        step4_a_plus_b.a[i] <== step1_a.out[i];
        step4_a_plus_b.b[i] <== step2_b.out[i];
    }

    // Step 5: a + b + c
    component step5_a_plus_b_plus_c = Add();
    for (var i = 0; i < 4; i ++) {
        step5_a_plus_b_plus_c.a[i] <== step4_a_plus_b.out[i];
        step5_a_plus_b_plus_c.b[i] <== step3_c.out[i];
    }

    // Step 6: a + b + c + k_1_0
    component step6_a_plus_b_plus_c_plus_k_1_0 = Add();
    for (var i = 0; i < 4; i ++) {
        step6_a_plus_b_plus_c_plus_k_1_0.a[i] <== step5_a_plus_b_plus_c.out[i];
        step6_a_plus_b_plus_c_plus_k_1_0.b[i] <== k_1_0[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== step6_a_plus_b_plus_c_plus_k_1_0.out[i];
    }
}

template XDen() {
    signal input x[4];
    signal input x_2[4]; // Assumes that this value is correct
    signal output out[4];

    var k_2_0[4] = get_k_2_0();
    var k_2_1[4] = get_k_2_1();
    /*
    x'^2 +
    k_(2,1) * x' +
    k_(2,0)
    */

    // Step 1: a = x_2 + k_2_0
    component step1_a = Add();
    for (var i = 0; i < 4; i ++) {
        step1_a.a[i] <== x_2[i];
        step1_a.b[i] <== k_2_0[i];
    }

    // Step 2: b = x * k_2_1
    component step2_b = Multiply();
    for (var i = 0; i < 4; i ++) {
        step2_b.a[i] <== k_2_1[i];
        step2_b.b[i] <== x[i];
    }

    // Step 3: c = a + b
    component step3_c = Add();
    for (var i = 0; i < 4; i ++) {
        step3_c.a[i] <== step1_a.out[i];
        step3_c.b[i] <== step2_b.out[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== step3_c.out[i];
    }
}

template YNum() {
    signal input x[4];
    signal input x_2[4]; // Assumes that this value is correct
    signal input x_3[4]; // Assumes that this value is correct
    signal output out[4];

    var k_3_3[4] = get_k_3_3();
    var k_3_2[4] = get_k_3_2();
    var k_3_1[4] = get_k_3_1();
    var k_3_0[4] = get_k_3_0();
    /*
    k_(3,3) * x'^3 +
    k_(3,2) * x'^2 +
    k_(3,1) * x' +
    k_(3,0)
    */

    // Step 1: a = k_3_3 * x_3
    component step1_a = Multiply();
    for (var i = 0; i < 4; i ++) {
        step1_a.a[i] <== k_3_3[i];
        step1_a.b[i] <== x_3[i];
    }

    // Step 2: b = k_3_2 * x_2
    component step2_b = Multiply();
    for (var i = 0; i < 4; i ++) {
        step2_b.a[i] <== k_3_2[i];
        step2_b.b[i] <== x_2[i];
    }

    // Step 3: c = k_3_1 * x
    component step3_c = Multiply();
    for (var i = 0; i < 4; i ++) {
        step3_c.a[i] <== k_3_1[i];
        step3_c.b[i] <== x[i];
    }

    // Step 4: a + b
    component step4_a_plus_b = Add();
    for (var i = 0; i < 4; i ++) {
        step4_a_plus_b.a[i] <== step1_a.out[i];
        step4_a_plus_b.b[i] <== step2_b.out[i];
    }

    // Step 5: a + b + c
    component step5_a_plus_b_plus_c = Add();
    for (var i = 0; i < 4; i ++) {
        step5_a_plus_b_plus_c.a[i] <== step4_a_plus_b.out[i];
        step5_a_plus_b_plus_c.b[i] <== step3_c.out[i];
    }
    // Step 6: a + b + c + k_3_0
    component step6_a_plus_b_plus_c_plus_k_3_0 = Add();
    for (var i = 0; i < 4; i ++) {
        step6_a_plus_b_plus_c_plus_k_3_0.a[i] <== step5_a_plus_b_plus_c.out[i];
        step6_a_plus_b_plus_c_plus_k_3_0.b[i] <== k_3_0[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== step6_a_plus_b_plus_c_plus_k_3_0.out[i];
    }
}

template YDen() {
    signal input x[4];
    signal input x_2[4]; // Assumes that this value is correct
    signal input x_3[4]; // Assumes that this value is correct
    signal output out[4];

    var k_4_0[4] = get_k_4_0();
    var k_4_1[4] = get_k_4_1();
    var k_4_2[4] = get_k_4_2();

    /*
    x'^3 +
    k_(4,2) * x'^2 +
    k_(4,1) * x' +
    k_(4,0)
    */

    // Step 1: a = x_3 + k_4_0
    component step1_a = Add();
    for (var i = 0; i < 4; i ++) {
        step1_a.a[i] <== x_3[i];
        step1_a.b[i] <== k_4_0[i];
    }

    // Step 2: b = k_4_2 * x_2
    component step2_b = Multiply();
    for (var i = 0; i < 4; i ++) {
        step2_b.a[i] <== k_4_2[i];
        step2_b.b[i] <== x_2[i];
    }

    // Step 3: c = k_4_1 * x
    component step3_c = Multiply();
    for (var i = 0; i < 4; i ++) {
        step3_c.a[i] <== k_4_1[i];
        step3_c.b[i] <== x[i];
    }

    // Step 4: a + b
    component step4_a_plus_b = Add();
    for (var i = 0; i < 4; i ++) {
        step4_a_plus_b.a[i] <== step1_a.out[i];
        step4_a_plus_b.b[i] <== step2_b.out[i];
    }

    // Step 5: a + b + c
    component step5_a_plus_b_plus_c = Add();
    for (var i = 0; i < 4; i ++) {
        step5_a_plus_b_plus_c.a[i] <== step4_a_plus_b.out[i];
        step5_a_plus_b_plus_c.b[i] <== step3_c.out[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[i] <== step5_a_plus_b_plus_c.out[i];
    }
}
