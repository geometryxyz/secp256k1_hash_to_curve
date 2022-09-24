use sha2::{Sha256, Digest};

mod tests; 

pub struct Params {
    pub m: usize,
    pub l: usize
}

pub fn hash_to_field(
    msg: &[u8],
    dst: &[u8],
    m: usize,
    l: usize
) {
    let count = 2;
    let len_in_bytes = count * m * l; // len_in_bytes should be 96
    let uniform_bytes = expand_message_xmd(msg, dst, len_in_bytes);
    //for i in 0..count {
        //let offset = l * (i * m);
        //println!("offset: {}", offset);
    //}
    let u0_bytes = uniform_bytes[0..48].to_vec();
    let u1_bytes = uniform_bytes[48..96].to_vec();

    println!("u0_bytes: {:?}", u0_bytes);
    println!("u1_bytes: {:?}", u1_bytes);
}

pub fn expand_message_xmd(
    msg: &[u8],
    dst: &[u8],
    len_in_bytes: usize
) -> Vec<u8> {
    let b_in_bytes = 32;
    let ell = (len_in_bytes + (b_in_bytes - 1)) / b_in_bytes;
    println!("ell: {}", ell);

    // DST_prime = DST || I2OSP(len(DST), 1)
    //[81, 85, 85, 88, 45, 86, 48, 49, 45, 67, 83, 48, 50, 45, 119, 105, 116, 104, 45, 115, 101,
    //99, 112, 50, 53, 54, 107, 49, 95, 88, 77, 68, 58, 83, 72, 65, 45, 50, 53, 54, 95, 83, 83, 87,
    //85, 95, 82, 79, 95, 49]
    let dst_prime = [dst, &[dst.len() as u8]].concat();
    println!("dst_prime: {:?}, len: {}", dst_prime, dst_prime.len());

    // z_pad is 64 zeroes
    let z_pad = vec![0u8; 64];
    println!("z_pad: {:?}, len: {}", z_pad, z_pad.len()) ;

    // lib_str = [0, 96]
    let lib_str = &[((len_in_bytes >> 8) & 0xFF) as u8, (len_in_bytes & 0xFF) as u8];
    println!("lib_str: {:?}", lib_str);

    let msg_prime = [
        z_pad.as_slice(),
        msg,
        lib_str,
        &[0u8],
        dst_prime.as_slice()
    ].concat(); 

    println!("msg_prime: {:?}, len: {}", msg_prime, msg_prime.len());
    println!("");

    let mut hasher = Sha256::new();
    hasher.update(msg_prime);
    let b0 = hasher.finalize_reset();

    println!("b0: {:?}", b0);

    let b1_preimage = [b0.as_slice(), &[1u8], dst_prime.as_slice()].concat();

    hasher.update(b1_preimage);
    let mut bi = hasher.finalize_reset().to_vec();

    // [232, 52, 124, 173, 72, 171, 78, 49, 157, 123, 39, 85, 32, 234, 129, 207, 18, 138, 171, 93,
    // 54, 121, 161, 247, 96, 30, 59, 222, 172, 154, 81, 208]
    println!("b1: {:?}", &bi);

    let mut pseudo = Vec::<u8>::new();
    pseudo.extend_from_slice(&bi.as_slice());

    for i in 2..(ell + 1) {
        let strxor_prev = &xor(&bi.clone(), &b0.clone());
        //println!("strxor_prev: {:?}", &strxor_prev);

        let bi_preimage = [
            strxor_prev.as_slice(),
            &[i as u8],
            &dst_prime.as_slice(),
        ].concat();
        let mut hasher = Sha256::new();
        hasher.update(bi_preimage);
        let x = hasher.finalize_reset();
        bi = x.to_vec().clone();
        println!("b{}: {:?}", i, &bi);
        pseudo.extend_from_slice(&bi);
    }

    println!("pseudo: {:?}", pseudo.to_vec());

    pseudo.to_vec()
}

fn xor<'a>(x: &'a [u8], y: &'a [u8]) -> Vec<u8> {
    let mut z = vec![0; x.len()];
    for i in 0..x.len() {
        z[i] = x[i] ^ y[i];
    }
    z.to_vec()
}
