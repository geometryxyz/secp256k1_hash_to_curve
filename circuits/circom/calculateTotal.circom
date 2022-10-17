pragma circom 2.0.0;

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

