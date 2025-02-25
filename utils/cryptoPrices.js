// services/cryptoPrices.js
import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export async function getBTCPrice() {
    try {
        const response = await axios.get(`${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`);
        return response.data.bitcoin.usd;
    } catch (error) {
        console.error('Error fetching BTC price:', error);
        throw error;
    }
}

export async function convertBTCtoUSD(btcAmount) {
    const btcPrice = await getBTCPrice();
    return btcAmount * btcPrice;
}