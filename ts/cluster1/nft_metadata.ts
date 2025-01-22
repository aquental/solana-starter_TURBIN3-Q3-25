import wallet from "../../aquental-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

// Create a devnet connection
const umi = createUmi("https://api.devnet.solana.com");

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(
  irysUploader({
    // mainnet address: "https://node1.irys.xyz"
    // devnet address: "https://devnet.irys.xyz"
    address: "https://devnet.irys.xyz",
  })
);
umi.use(signerIdentity(signer));

(async () => {
  try {
    const image =
      "https://arweave.net/BYm8YC8eDc6yhPuGUMyvaKSYcWyYcCJYpCqQ77AVGK55";
    const metadata = {
      name: "Oriental Fancy Rug",
      symbol: "AQ",
      description: "A beautiful oriental themed rug",
      image: image,
      attributes: [{ trait_type: "creator", value: "CoPilot" }],
      properties: {
        files: [
          {
            uri: image,
            type: "image/jpeg",
          },
        ],
      },
    };

    const myUri = await umi.uploader.uploadJson(metadata);

    console.log("Your metadata URI: ", myUri);
  } catch (error) {
    console.log("Oops.. Something went wrong", error);
  }
})();

//Your metadata URI:  https://arweave.net/CKphLzsH3VKd4fvBf6pRyuXAn2TwodYo6MWx1V41YLa6
//Your metadata URI:  https://arweave.net/2t6xFcZ4PphLbpJn52mnyNAnhcPBHkxyeippKjqUDYQo
