
import { Product } from '@/types/product';

interface CartItem extends Product {
  quantity: number;
  appliedDiscount?: number;
  cartId: string;
  variantId?: string;
  selectedVariant?: string;
}

export const addToCart = (product: Product, quantity: number = 1, variantId?: string, selectedVariant?: string): void => {
  const savedCart = localStorage.getItem('cart');
  let cartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

  // Create a unique identifier that includes variant information
  const uniqueIdentifier = selectedVariant 
    ? `${product.stokKodu || 'no-stock'}-${selectedVariant.replace(/\s+/g, '-').toLowerCase()}`
    : product.stokKodu || `fallback-${Date.now()}`;
  
  console.log(`🔍 Looking for existing item with identifier: ${uniqueIdentifier}`);
  console.log(`📋 Product details:`, {
    stokKodu: product.stokKodu,
    urunAdi: product.urunAdi,
    firma: product.firma,
    price: product.listeFiyatiKdvDahil,
    selectedVariant,
    uniqueIdentifier
  });
  
  // Check if this exact product variant already exists in cart
  const existingItemIndex = cartItems.findIndex(item => {
    return item.variantId === uniqueIdentifier;
  });

  if (existingItemIndex >= 0) {
    // Update quantity of existing item
    cartItems[existingItemIndex].quantity += quantity;
    console.log(`✅ Updated existing item: quantity ${cartItems[existingItemIndex].quantity}`);
  } else {
    // Add new item to cart with unique cart ID
    const uniqueCartId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newCartItem: CartItem = {
      ...product,
      quantity,
      appliedDiscount: 0,
      cartId: uniqueCartId,
      variantId: uniqueIdentifier,
      selectedVariant: selectedVariant || undefined
    };
    cartItems.push(newCartItem);
    console.log(`✅ Added new item to cart with quantity ${quantity}`);
    console.log(`🆔 Cart ID: ${uniqueCartId}, Variant ID: ${uniqueIdentifier}, Selected Variant: ${selectedVariant}`);
  }

  localStorage.setItem('cart', JSON.stringify(cartItems));
  console.log('📦 Cart updated - total items:', cartItems.length);
};

export const getCartItemCount = (): number => {
  const savedCart = localStorage.getItem('cart');
  if (!savedCart) return 0;
  
  const cartItems: CartItem[] = JSON.parse(savedCart);
  return cartItems.reduce((total, item) => total + item.quantity, 0);
};

export const clearCart = (): void => {
  localStorage.removeItem('cart');
};
