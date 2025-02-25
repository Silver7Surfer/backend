import fs from 'fs';
import bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1'; 
import { BIP32Factory } from 'bip32';
import { TronWeb } from 'tronweb';
import { ethers } from 'ethers';


export const generateWalletAddresses = () => {
    const bip32 = BIP32Factory(ecc);

    // Generate a 12-word mnemonic
    const mnemonic = bip39.generateMnemonic();
    //const mnemonic = 'wait shell alley rubber absorb hair tiger because diagram derive opera sheriff';
    console.log('Mnemonic:', mnemonic);

    // Generate seed from mnemonic
    const seed = bip39.mnemonicToSeedSync(mnemonic);

    // Derive the root key from the seed
    const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);

    // Derive the first account's first external address (m/44'/0'/0'/0/0)
    const legacyPath = "m/44'/0'/0'/0/0"; //legacy
    const nativeSegWitPath = "m/84'/0'/0'/0/0"; //native segwit

    const legacyChild = root.derivePath(legacyPath);
    const nativeSegWitChild = root.derivePath(nativeSegWitPath);

    // Ensure the public key is a Buffer
    const legacyPublicKeyBuffer = Buffer.from(legacyChild.publicKey);
    const nativeSegWitPublicKeyBuffer = Buffer.from(nativeSegWitChild.publicKey);

    // Get the P2PKH address (legacy address)
    const legacyAddress = bitcoin.payments.p2pkh({ pubkey: legacyPublicKeyBuffer, network: bitcoin.networks.bitcoin }).address;
    console.log('Legacy Bitcoin Address (P2PKH):', legacyAddress);

    // Get the native SegWit P2WPKH address
    const nativeSegWitAddress = bitcoin.payments.p2wpkh({ pubkey: nativeSegWitPublicKeyBuffer, network: bitcoin.networks.bitcoin }).address;
    console.log('Native SegWit Bitcoin Address (P2WPKH):', nativeSegWitAddress);

    
    const tronWeb = new TronWeb({
        fullHost: 'https://api.trongrid.io', // TRON mainnet endpoint
    });

    const tronChild = root.derivePath("m/44'/195'/0'/0/0");

    // Ensure privateKey is a Buffer before converting it to hex
    if (!tronChild.privateKey) {
        throw new Error('Failed to derive TRON private key');
    }

    const tronPrivateKey = Buffer.from(tronChild.privateKey).toString('hex');

    if (tronPrivateKey.length !== 64) {
    throw new Error(`Invalid TRON private key length: ${tronPrivateKey.length}, value: ${tronPrivateKey}`);
    }
    console.log('tronPrivate key : ', tronPrivateKey);

    // Generate the TRON address from the private key
    const tronAddress = tronWeb.address.fromPrivateKey(tronPrivateKey);
    console.log('USDT TRC20 Address (TRON):', tronAddress);


    const bscChild = root.derivePath("m/44'/60'/0'/0/0"); // Ethereum/BSC path

    if (!bscChild.privateKey) {
    throw new Error("Failed to derive BSC private key");
    }

    const bscPrivateKey = Buffer.from(bscChild.privateKey).toString('hex'); // Ensure it's a proper hex string
    const bscWallet = new ethers.Wallet(bscPrivateKey); // Create wallet from private key
    const bep20usdtAddress = bscWallet.address; // Get the address
    console.log('USDT BEP20 Address (BSC):', bscWallet.address);


    ///////////////////////////////////////////////////////////////////
    const newWalletData = {
        date: new Date().toISOString(),
        mnemonic,
        bitcoin: {
            legacy: legacyAddress,
            nativeSegWit: nativeSegWitAddress
        },
        tron: {
            privateKey: tronPrivateKey,
            address: tronAddress
        },
        bsc: {
            privateKey: bscPrivateKey,
            address: bscWallet.address
        }
      };
      
      // Read existing file (if exists), otherwise create a new array
      let wallets = [];
      if (fs.existsSync('wallets.json')) {
        wallets = JSON.parse(fs.readFileSync('wallets.json', 'utf8'));
      }
      
      // Append new data
      wallets.push(newWalletData);
      
      // Save back to file
      fs.writeFileSync('wallets.json', JSON.stringify(wallets, null, 2), 'utf8');
      
      console.log('✅ Wallet details saved to wallets.json');
    ///////////////////////////////////////////////////////////////////
      
    return {
        btcAddress: nativeSegWitAddress,
        usdtTrc20Address: tronAddress,
        usdtBep20Address: bep20usdtAddress
    };
};