//#[test]
//fn test_hash_to_field() {
    //let params = crate::Params {
        //m: 1,
        //l: 48
    //};
    //let msg = b"abc";
    //let dst = b"QUUX-V01-CS02-with-secp256k1_XMD:SHA-256_SSWU_RO_";
    //crate::hash_to_field(msg, dst, params.m, params.l);
//}

#[test]
fn test_expand_message_xmd() {
    let params = crate::Params {
        m: 1,
        l: 48
    };

    let msg = b"abc";
    let dst = b"QUUX-V01-CS02-with-secp256k1_XMD:SHA-256_SSWU_RO_";
    let count = 2usize;
    let len_in_bytes = count * params.l * params.m;
    let expanded_msg = crate::expand_message_xmd(msg, dst, len_in_bytes);
}
