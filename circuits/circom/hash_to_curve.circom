pragma circom 2.0.0;
include "./hash_to_field.circom";
include "./map_to_curve.circom";
include "./iso_map.circom";
include "./point_add.circom";

template HashToCurve(msg_length) {
    signal input msg[msg_length];

    signal input q0_gx1_sqrt[4];
    signal input q0_gx2_sqrt[4];
    signal input q0_y_pos[4];
    signal input q0_x_mapped[4];
    signal input q0_y_mapped[4];

    signal input q1_gx1_sqrt[4];
    signal input q1_gx2_sqrt[4];
    signal input q1_y_pos[4];
    signal input q1_x_mapped[4];
    signal input q1_y_mapped[4];

    signal output out[2][4];

    // Step 1: u = hash_to_field(msg)
    component h2f = HashToField(msg_length);
    for (var i = 0; i < msg_length; i ++) {
        h2f.msg[i] <== msg[i];
    }

    // Step 2: Q0 = map_to_curve(u[0])
    component m2c_q0 = MapToCurve();
    for (var i = 0; i < 4; i ++) {
        m2c_q0.u[i] <== h2f.u[0][i];
        m2c_q0.gx1_sqrt[i] <== q0_gx1_sqrt[i];
        m2c_q0.gx2_sqrt[i] <== q0_gx2_sqrt[i];
        m2c_q0.y_pos[i] <== q0_y_pos[i];
        m2c_q0.x_mapped[i] <== q0_x_mapped[i];
        m2c_q0.y_mapped[i] <== q0_y_mapped[i];
    }

    // Step 3: Q1 = map_to_curve(u[1])
    component m2c_q1 = MapToCurve();
    for (var i = 0; i < 4; i ++) {
        m2c_q1.u[i] <== h2f.u[1][i];
        m2c_q1.gx1_sqrt[i] <== q1_gx1_sqrt[i];
        m2c_q1.gx2_sqrt[i] <== q1_gx2_sqrt[i];
        m2c_q1.y_pos[i] <== q1_y_pos[i];
        m2c_q1.x_mapped[i] <== q1_x_mapped[i];
        m2c_q1.y_mapped[i] <== q1_y_mapped[i];
    }

    // Step 4: return A + B
    component point_add = PointAdd();
    for (var i = 0; i < 4; i ++) {
        point_add.a[0][i] <== q0_x_mapped[i];
        point_add.a[1][i] <== q0_y_mapped[i];
        point_add.b[0][i] <== q1_x_mapped[i];
        point_add.b[1][i] <== q1_y_mapped[i];
    }

    for (var i = 0; i < 4; i ++) {
        out[0][i] <== point_add.out[0][i];
        out[1][i] <== point_add.out[1][i];
    }
}
