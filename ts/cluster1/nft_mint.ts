import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../../aquental-wallet.json";
import base58 from "bs58";

const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata());

const mint = generateSigner(umi);
// metadata
const uri = "https://arweave.net/CKphLzsH3VKd4fvBf6pRyuXAn2TwodYo6MWx1V41YLa6";

(async () => {
  let tx = createNft(umi, {
    mint,
    name: "Oriental Fancy Rug",
    uri,
    sellerFeeBasisPoints: percentAmount(5.5),
  });
  let result = await tx.sendAndConfirm(umi);
  const signature = base58.encode(result.signature);

  console.log(
    `Succesfully Minted! Check out your TX here:\nhttps://explorer.solana.com/tx/${signature}?cluster=devnet`
  );
  console.log("Mint Address: ", mint.publicKey);
})();

// Succesfully Minted! Check out your TX here:
// https://explorer.solana.com/tx/4FUFvR7bubWhf3rjqf98Kk7Pti8yLKucPGg97G78bGZuRfbJTDJAvstJcxJY7CcNG7RJLMgaNsaHPpYFMaVB8mdr?cluster=devnet
// Mint Address:  8GAJrz1fgHBcJyhMYYWY6ujrdwLeGZqjFh74crBd5pTw
