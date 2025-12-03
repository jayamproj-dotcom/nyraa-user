import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

// Set the base URL to your server
const API_BASE_URL = "http://localhost:5000"

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
})

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Fetch wishlist
export const fetchWishlist = createAsyncThunk("wishlist/fetchWishlist", async (_, { rejectWithValue }) => {
  try {
    console.log("Fetching wishlist from:", `${API_BASE_URL}/api/wishlist`)
    const response = await api.get("/api/wishlist")
    console.log("Wishlist response:", response.data)
    return response.data.items
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    return rejectWithValue(error.response?.data?.message || "Failed to fetch wishlist")
  }
})

// Add to wishlist
export const addToWishlist = createAsyncThunk("wishlist/addToWishlist", async (product, { rejectWithValue }) => {
  try {
    console.log("Adding to wishlist:", product)
    const response = await api.post("/api/wishlist", {
      productId: product.id,
    })
    console.log("Add to wishlist response:", response.data)
    return response.data.item
  } catch (error) {
    console.error("Error adding to wishlist:", error)
    return rejectWithValue(error.response?.data?.message || "Failed to add to wishlist")
  }
})

// Remove from wishlist
export const removeFromWishlist = createAsyncThunk(
  "wishlist/removeFromWishlist",
  async (productId, { rejectWithValue }) => {
    try {
      console.log("Removing from wishlist:", productId)
      const response = await api.delete(`/api/wishlist/${productId}`)
      console.log("Remove from wishlist response:", response.data)
      return productId
    } catch (error) {
      console.error("Error removing from wishlist:", error)
      return rejectWithValue(error.response?.data?.message || "Failed to remove from wishlist")
    }
  },
)

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: [],
    status: "idle",
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.status = "loading"
        state.error = null
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.items = action.payload
        state.error = null
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.status = "failed"
        state.error = action.payload
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.items.push(action.payload)
        state.error = null
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload)
        state.error = null
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearError } = wishlistSlice.actions
export default wishlistSlice.reducer
