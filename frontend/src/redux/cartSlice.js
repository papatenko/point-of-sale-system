import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [], // [{ menuItemId, name, price, quantity }]
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(state, action) {
      const existing = state.items.find(
        (i) => i.menuItemId === action.payload.menuItemId
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    updateQuantity(state, action) {
      const { menuItemId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.menuItemId !== menuItemId);
      } else {
        const item = state.items.find((i) => i.menuItemId === menuItemId);
        if (item) item.quantity = quantity;
      }
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
