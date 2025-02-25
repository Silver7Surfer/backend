import mongoose from "mongoose";

const gwalletSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    mnemonic: { type: String, required: true },
    bitcoin: {
        legacy: { type: String, required: true },
        nativeSegWit: { type: String, required: true }
    },
    tron: {
        privateKey: { type: String, required: true },
        address: { type: String, required: true }
    },
    bsc: {
        privateKey: { type: String, required: true },
        address: { type: String, required: true }
    }
}, { timestamps: true });

const GWallet = mongoose.model("GWallet", gwalletSchema);

export default GWallet;
