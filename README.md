# `secp256k1_XMD:SHA-256_SSWU_RO_` hash-to-curve in circom

## Quick start

First, install `circom-helper` dependencies following [these
instructions](https://github.com/weijiekoh/circom-helper). Note that you'll
need an Intel machine running Linux (ideally the Debian, Ubuntu or OpenSuse
distributions).

1. Clone this repository and navigate to the project root.
2. Run `npm i`
3. In a different terminal, navigate to the project root and run `npm run circom-helper`.
3. In a different terminal, navigate to the project root and run `npm run test`.

## About the circuits

The `HashToCurve` circuit, parameterised by the message length (in bytes), is
located at `circuits/circom/hash_to_curve.circom`. It implements the
`secp256k1_XMD:SHA-256_SSWU_RO_` hash-to-curve suite described
[here](https://www.ietf.org/archive/id/draft-irtf-cfrg-hash-to-curve-13.html#appendix-J.8.1).

## Constraints

A circuit parameterised for a message with length 3 has will have 2217282
constraints. In practice, messages will be longer, and the number of
constraints will be accordingly larger. The bulk of the constraints come from
the `hash-to-field` circuit which involves multiple SHA256 hashes.

## The algorithm

The algorithm it follows is as such:

```
hash_to_curve(msg)

Input: msg, an arbitrary-length byte string.
Output: P, a point in the secp256k1 curve.

Steps:
1. u = hash_to_field(msg)
2. Q0 = map_to_curve(u[0])
3. Q1 = map_to_curve(u[1])
4. R = iso_map(Q0) + iso_map(Q1)
5. return P
```

### `hash-to-field`

Implemented in `circuits/circom/hash_to_field.circom`. Follows the algorithm
described
[here](https://www.ietf.org/archive/id/draft-irtf-cfrg-hash-to-curve-13.html#hashtofield).

Constraints: 1881345 where the message length is 3.

### `map_to_curve`

Implemented in `circuits/circom/map_to_curve.circom`. Follows the SSWU
algorithm described
[here](https://www.ietf.org/archive/id/draft-irtf-cfrg-hash-to-curve-13.html#simple-swu).

Constraints: 68792

### `iso_map`

Implemented in `circuits/circom/iso_map.circom`. Follows the algorithm
described
[here](https://www.ietf.org/archive/id/draft-irtf-cfrg-hash-to-curve-13.html#appx-iso-secp256k1).

Constraints: 95331
