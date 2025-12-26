import { configureStore, combineReducers } from "@reduxjs/toolkit";

import cartReducer from "./cartSlice";
import wishlistReducer from "./wishlistSlice";
import orderReducer from "./orderSlice";
import addressReducer from "./addressSlice";
import buyProductReducer from "./buyProductSlice";
import authReducer from "./authSlice";

import { persistStore, persistReducer } from "redux-persist";
import storageSession from "redux-persist/lib/storage/session";

// 🔹 Persist config
const persistConfig = {
  key: "root",
  storage: storageSession, // ✅ sessionStorage
  whitelist: ["auth"], // 👈 ONLY auth persists
};

// 🔹 Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  wishlist: wishlistReducer,
  orders: orderReducer,
  addresses: addressReducer,
  buyProduct: buyProductReducer,
});

// 🔹 Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 🔹 Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});

// 🔹 Persistor
export const persistor = persistStore(store);
