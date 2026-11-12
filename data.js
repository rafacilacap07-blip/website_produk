export const starterProducts = [
  {
    id: "donat-gula",
    name: "Donat Gula Klasik",
    category: "Klasik",
    price: 5000,
    description: "Donat lembut dengan taburan gula halus.",
    image: "https://images.unsplash.com/photo-1551024506-0?auto=format&fit=crop&w=900&q=85",
    active: true
  },
  {
    id: "donat-cokelat",
    name: "Donat Cokelat",
    category: "Favorit",
    price: 7000,
    description: "Glaze cokelat dengan rasa manis yang seimbang.",
    image: "https://images.unsplash.com/photo-1551024506-0?auto=format&fit=crop&w=900&q=85",
    active: true
  },
  {
    id: "donat-mix",
    name: "Paket Mini Mix 12",
    category: "Paket",
    price: 65000,
    description: "Dua belas donat mini dengan topping pilihan.",
    image: "https://images.unsplash.com/photo-1514517220017-8ce97a34a7b6?auto=format&fit=crop&w=900&q=85",
    active: true
  }
];

export const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));