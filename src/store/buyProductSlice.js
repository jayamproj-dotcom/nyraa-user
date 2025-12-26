import { createSlice } from "@reduxjs/toolkit";

const buyProductSlice = createSlice({
    name: "buyProduct",
    initialState: {
        item: null,
        buyOpen: false,
    },

    reducers: {
        // Set selected product
        setBuyProduct: (state, action) => {
            state.item = action.payload;
            //localStorage.setItem("buyProduct", JSON.stringify(state.item));
        },

        // Clear selected product
        clearBuyProduct: (state) => {
            state.item = null;
            // localStorage.removeItem("buyProduct");
        },

        // 🔥 NEW: Open Buy Now Popup
        openBuyNow: (state) => {
            state.buyOpen = true;
        },

        // 🔥 NEW: Close Buy Now Popup
        closeBuyNow: (state) => {
            state.buyOpen = false;
        },
    },
});

export const {
    setBuyProduct,
    clearBuyProduct,
    openBuyNow,
    closeBuyNow
} = buyProductSlice.actions;

export default buyProductSlice.reducer;

