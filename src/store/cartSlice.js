import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========================
// Async thunks
// ========================

// Fetch cart from backend
export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  const response = await api.get("/api/cart"); 
  return response.data.items;
});


// Add item to backend cart
export const addItemToCart = createAsyncThunk(
  "cart/addItemToCart",
  async (product) => {
    const response = await api.post("/api/cart", product);
    return response.data.item; // the added/updated item
  }
);

// Update cart item quantity
export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ id, quantity }) => {
    const response = await api.put(`/api/cart/${id}`, { quantity });
    return response.data.item;
  }
);

// Remove item from cart
export const removeCartItem = createAsyncThunk(
  "cart/removeCartItem",
  async (id) => {
    await api.delete(`/api/cart/${id}`);
    return id; // return deleted item's id
  }
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async () => {
    await api.delete("/api/cart/clear");
    return true;
  }
);



const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: [],
    cartCount: 0,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.cartCount = action.payload.reduce(
          (total, item) => total + item.quantity,
          0
        );
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Add item
      .addCase(addItemToCart.fulfilled, (state, action) => {
        const item = action.payload;
        const existing = state.items.find((i) => i.id === item.id);
        if (existing) {
          existing.quantity = item.quantity;
        } else {
          state.items.push(item);
        }
        state.cartCount = state.items.reduce((total, i) => total + i.quantity, 0);
      })

      // Update item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const item = action.payload;
        const existing = state.items.find((i) => i.id === item.id);
        if (existing) existing.quantity = item.quantity;
        state.cartCount = state.items.reduce((total, i) => total + i.quantity, 0);
      })

      // Remove item
      .addCase(removeCartItem.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((i) => i.id !== id);
        state.cartCount = state.items.reduce((total, i) => total + i.quantity, 0);
      })

      //Clear item
      .addCase(clearCart.fulfilled, (state) => {
        state.cartItems = [];  // empty array
      });
  },
});

// export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
