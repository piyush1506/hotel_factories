export const PRESET_IMAGES = {
  palace: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  beach: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
  mountain: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
  city: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  suite: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  villa: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
  balcony: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
};

export function formatPrice(amountInInr, currency = "INR") {
  if (currency === "USD") {
    const usd = Math.round(amountInInr * 0.012);
    return `$${usd.toLocaleString()}`;
  }
  return `₹${Math.round(amountInInr).toLocaleString()}`;
}

export function getDefaultDates() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 4);

  return {
    checkIn: tomorrow.toISOString().split("T")[0],
    checkOut: checkOut.toISOString().split("T")[0]
  };
}
