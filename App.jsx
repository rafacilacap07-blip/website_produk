import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, Plus, Minus, Trash2, ArrowRight, ShieldCheck, PackageCheck, CalendarDays, LogIn, LogOut } from "lucide-react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase";
import { createOrder, getProducts, removeProduct, saveProduct, subscribeOrders, updateOrderStatus } from "./services";
import { formatRupiah, starterProducts } from "./data";

const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || "";
const money = formatRupiah;

function useCart() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("tuku-cart") || "[]"));
  useEffect(() => localStorage.setItem("tuku-cart", JSON.stringify(cart)), [cart]);
  const add = (product) => setCart(old => {
    const found = old.find(x => x.id === product.id);
    return found ? old.map(x => x.id === product.id ? { ...x, qty: x.qty + 1 } : x) : [...old, { ...product, qty: 1 }];
  });
  const change = (id, delta) => setCart(old => old.map(x => x.id === id ? { ...x, qty: x.qty + delta } : x).filter(x => x.qty > 0));
  const clear = () => setCart([]);
  return { cart, add, change, clear, count: cart.reduce((n, x) => n + x.qty, 0), total: cart.reduce((n, x) => n + x.qty * x.price, 0) };
}

function Header({ count }) {
  const [open, setOpen] = useState(false);
  return <header className="header"><div className="container nav-wrap">
    <Link to="/" className="brand"><span className="brand-mark">T</span><span>TUKU <b>DONAT</b><small>DONAT UNTUK SETIAP MOMEN</small></span></Link>
    <button className="icon-btn mobile-menu" onClick={() => setOpen(!open)} aria-label="Buka menu">{open ? <X/> : <Menu/>}</button>
    <nav className={open ? "nav open" : "nav"}>
      <NavLink to="/" onClick={() => setOpen(false)}>Beranda</NavLink>
      <NavLink to="/produk" onClick={() => setOpen(false)}>Menu Donat</NavLink>
      <a href="/#catering" onClick={() => setOpen(false)}>Paket Catering</a>
      <NavLink to="/pesan" className="nav-order" onClick={() => setOpen(false)}><ShoppingBag size={16}/> Keranjang <span className="count">{count}</span></NavLink>
    </nav>
  </div></header>;
}

function Footer() {
  return <footer className="footer"><div className="container footer-inner"><div><div className="brand footer-brand"><span className="brand-mark">T</span><span>TUKU <b>DONAT</b></span></div><p>Donat hangat, momen yang lebih manis.</p></div><div><b>Hubungi kami</b><p>Pesan catering dan pre-order melalui WhatsApp.</p>{waNumber && <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer">Chat WhatsApp ↗</a>}</div></div><div className="container copyright">© {new Date().getFullYear()} Tuku Donat. Dibuat dengan sepenuh hati.</div></footer>;
}

function ProductCard({ product, add }) {
  return <article className="product-card"><div className="product-image"><img src={product.image || "https://images.unsplash.com/photo-1551024506-0?auto=format&fit=crop&w=900&q=85"} alt={product.name}/><span>{product.category || "Donat"}</span></div><div className="product-info"><h3>{product.name}</h3><p>{product.description}</p><div className="product-bottom"><strong>{money(product.price)}</strong><button className="add-btn" onClick={() => add(product)}><Plus size={16}/> Tambah</button></div></div></article>;
}

function Home({ products, add }) {
  const featured = products.filter(p => p.active !== false).slice(0, 3);
  return <><section className="hero"><div className="container hero-grid"><div className="hero-copy"><span className="eyebrow">FRESHLY MADE · MADE WITH LOVE</span><h1>Donat kecil,<br/><em>bahagia besar.</em></h1><p>Teman manis untuk rapat, ulang tahun, acara keluarga, hingga hari istimewa. Pilih donat favoritmu, kami siapkan dengan sepenuh hati.</p><div className="hero-actions"><Link className="btn btn-dark" to="/produk">Jelajahi menu <ArrowRight size={17}/></Link><a className="text-link" href="#catering">Lihat paket catering</a></div><div className="hero-note"><span>✳</span> Dibuat segar untuk setiap pesanan</div></div><div className="hero-photo"><img src="https://images.unsplash.com/photo-1551024506-0?auto=format&fit=crop&w=1200&q=90" alt="Aneka donat segar"/><div className="photo-tag"><b>Made fresh</b><small>Just for you</small></div></div></div></section>
  <section className="section container"><div className="section-heading"><div><span className="eyebrow">PILIHAN FAVORIT</span><h2>Yang paling disukai</h2></div><Link className="text-link" to="/produk">Lihat semua menu <ArrowRight size={16}/></Link></div><div className="product-grid">{featured.map(p => <ProductCard key={p.id} product={p} add={add}/>)}</div></section>
  <section className="catering-section" id="catering"><div className="container catering-grid"><div className="catering-photo"><img src="https://images.unsplash.com/photo-1514517220017-8ce97a34a7b6?auto=format&fit=crop&w=1200&q=85" alt="Donat untuk acara"/></div><div className="catering-copy"><span className="eyebrow">FOR YOUR SPECIAL DAY</span><h2>Acara spesial?<br/><em>Biar kami yang maniskan.</em></h2><p>Paket donat untuk meeting kantor, arisan, ulang tahun, hampers, dan berbagai acara. Bisa request jumlah, varian, dan jadwal pengiriman.</p><ul><li><PackageCheck/> Paket mulai 12 pcs</li><li><CalendarDays/> Pre-order sesuai tanggal acara</li><li><ShieldCheck/> Konfirmasi pesanan oleh admin</li></ul><Link to="/produk" className="btn btn-outline">Pilih paket catering <ArrowRight size={17}/></Link></div></div></section>
  <section className="promise container"><div><span>01</span><b>Dibuat segar</b><p>Disiapkan mendekati jadwal pengiriman.</p></div><div><span>02</span><b>Bisa custom</b><p>Pilih paket dan kombinasi rasa favorit.</p></div><div><span>03</span><b>Pesan praktis</b><p>Checkout online, konfirmasi via WhatsApp.</p></div></section></>;
}

function Products({ products, add }) {
  const [filter, setFilter] = useState("Semua");
  const visible = products.filter(p => p.active !== false && (filter === "Semua" || p.category === filter));
  const categories = ["Semua", ...new Set(products.map(p => p.category || "Donat"))];
  return <main className="container page"><div className="page-title"><span className="eyebrow">OUR MENU</span><h1>Menu donat</h1><p>Temukan rasa yang cocok untuk setiap momen.</p></div><div className="filters">{categories.map(c => <button key={c} onClick={() => setFilter(c)} className={filter === c ? "filter active" : "filter"}>{c}</button>)}</div><div className="product-grid">{visible.map(p => <ProductCard key={p.id} product={p} add={add}/>)}</div>{visible.length === 0 && <p className="empty">Belum ada produk dalam kategori ini.</p>}</main>;
}

function Checkout({ cart, change, clear, total }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", address: "", date: "", time: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const set = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async e => {
    e.preventDefault();
    if (!cart.length) return setMessage("Keranjang masih kosong.");
    if (!waNumber) return setMessage("Nomor WhatsApp toko belum diatur. Isi VITE_WHATSAPP_NUMBER di file .env.");
    setBusy(true); setMessage("");
    try {
      const order = await createOrder({
        customer: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(),
        deliveryDate: form.date, deliveryTime: form.time, note: form.note.trim(),
        items: cart.map(x => ({ id: x.id, name: x.name, price: x.price, qty: x.qty })),
        total
      });
      const lines = [
        `Halo Tuku Donat, saya ingin konfirmasi pesanan *${order.id}*.`,
        "", `Nama: ${form.name}`, `No. HP: ${form.phone}`, `Alamat: ${form.address}`,
        `Tanggal kirim: ${form.date}`, `Jam kirim: ${form.time}`, "",
        "*Pesanan:*", ...cart.map(x => `- ${x.name} x${x.qty} — ${money(x.price * x.qty)}`),
        "", `*Total: ${money(total)}*`, `Catatan: ${form.note || "-"}`,
        "", "Mohon konfirmasi ketersediaan dan detail pembayaran. Terima kasih."
      ];
      const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
      clear(); window.location.assign(url);
      navigate("/");
    } catch (err) {
      console.error(err); setMessage("Pesanan belum berhasil disimpan. Periksa koneksi atau konfigurasi Firebase.");
    } finally { setBusy(false); }
  };
  return <main className="container page"><div className="page-title"><span className="eyebrow">YOUR ORDER</span><h1>Keranjang & checkout</h1><p>Atur pesanan dan jadwal pengirimanmu.</p></div><div className="checkout-layout"><section className="cart-panel"><h2>Pesananmu <span>{cart.length} item</span></h2>{cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={34}/><p>Keranjangmu masih kosong.</p><Link to="/produk" className="btn btn-dark">Pilih donat</Link></div> : cart.map(item => <div className="cart-item" key={item.id}><img src={item.image} alt={item.name}/><div className="cart-detail"><b>{item.name}</b><span>{money(item.price)}</span><div className="qty"><button onClick={() => change(item.id, -1)}><Minus size={14}/></button><span>{item.qty}</span><button onClick={() => change(item.id, 1)}><Plus size={14}/></button></div></div><strong>{money(item.price * item.qty)}</strong></div>)}{cart.length > 0 && <div className="cart-total"><span>Total sementara</span><b>{money(total)}</b></div>}</section>
  <form className="form-panel" onSubmit={submit}><h2>Detail pengiriman</h2><label>Nama lengkap<input required name="name" value={form.name} onChange={set} placeholder="Nama penerima"/></label><label>Nomor WhatsApp<input required name="phone" value={form.phone} onChange={set} placeholder="08xxxxxxxxxx" type="tel"/></label><label>Alamat lengkap<textarea required name="address" value={form.address} onChange={set} placeholder="Nama jalan, nomor, kecamatan, kota"/></label><div className="form-row"><label>Tanggal pengiriman<input required type="date" min={new Date().toISOString().slice(0,10)} name="date" value={form.date} onChange={set}/></label><label>Jam pengiriman<input required type="time" name="time" value={form.time} onChange={set}/></label></div><label>Catatan pesanan (opsional)<textarea name="note" value={form.note} onChange={set} placeholder="Contoh: topping dipisah, untuk acara kantor..."/></label>{message && <p className="form-message">{message}</p>}<button className="btn btn-dark full" disabled={busy || !cart.length}>{busy ? "Memproses..." : "Simpan & konfirmasi WhatsApp"} <ArrowRight size={17}/></button><small className="fine-print">Pesanan akan dicatat, lalu WhatsApp terbuka untuk konfirmasi dengan admin. Pesanan belum dianggap terkonfirmasi sampai admin membalas.</small></form></div></main>;
}

function Admin({ user, setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("orders");
  const [draft, setDraft] = useState({ name: "", category: "Paket", price: "", description: "", image: "", active: true });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!user) return;
    getProducts().then(setProducts).catch(console.error);
    return subscribeOrders(setOrders, console.error);
  }, [user]);

  const login = async e => {
    e.preventDefault(); setError("");
    if (!auth) return setError("Firebase belum dikonfigurasi. Isi file .env terlebih dahulu.");
    try { const result = await signInWithEmailAndPassword(auth, email, password); setUser(result.user); }
    catch { setError("Login gagal. Periksa email, password, dan akun admin di Firebase."); }
  };
  const save = async e => {
    e.preventDefault();
    try {
      await saveProduct({ ...draft, id: editing || undefined, price: Number(draft.price), active: true });
      setProducts(await getProducts()); setDraft({ name: "", category: "Paket", price: "", description: "", image: "", active: true }); setEditing(null);
    } catch (e) { alert("Gagal menyimpan produk. Periksa konfigurasi Firebase."); }
  };
  const edit = p => { setEditing(p.id); setDraft({ ...p, price: String(p.price) }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const del = async id => { if (!confirm("Hapus produk ini?")) return; await removeProduct(id); setProducts(await getProducts()); };
  if (!user) return <main className="container page admin-page"><div className="login-card"><span className="eyebrow">AREA TERBATAS</span><h1>Admin Tuku Donat</h1><p>Masuk untuk mengelola produk dan pesanan.</p><form onSubmit={login}><label>Email admin<input type="email" required value={email} onChange={e => setEmail(e.target.value)}/></label><label>Password<input type="password" required value={password} onChange={e => setPassword(e.target.value)}/></label>{error && <p className="form-message">{error}</p>}<button className="btn btn-dark full"><LogIn size={16}/> Masuk dashboard</button></form><small>Admin harus dibuat melalui Firebase Authentication.</small></div></main>;
  return <main className="container page admin-page"><div className="admin-heading"><div><span className="eyebrow">STORE MANAGEMENT</span><h1>Dashboard admin</h1></div><button className="btn btn-outline" onClick={() => auth && signOut(auth)}><LogOut size={16}/> Keluar</button></div><div className="admin-tabs"><button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>Pesanan ({orders.length})</button><button className={tab === "products" ? "active" : ""} onClick={() => setTab("products")}>Produk ({products.length})</button></div>
  {tab === "orders" ? <div className="admin-list">{orders.length === 0 && <p className="empty">Belum ada pesanan.</p>}{orders.map(o => <article className="order-card" key={o.id}><div><b>{o.customer || "Pelanggan"} · {o.id}</b><p>{o.phone} · {o.deliveryDate || "-"} {o.deliveryTime || ""}</p><p>{(o.items || []).map(i => `${i.name} x${i.qty}`).join(", ")}</p><strong>{money(o.total)}</strong></div><select value={o.status || "Menunggu konfirmasi"} onChange={e => updateOrderStatus(o.id, e.target.value)}><option>Menunggu konfirmasi</option><option>Diproses</option><option>Dalam pengiriman</option><option>Selesai</option><option>Dibatalkan</option></select></article>)}</div> : <div className="admin-products"><form className="form-panel" onSubmit={save}><h2>{editing ? "Edit produk" : "Tambah produk"}</h2><label>Nama produk<input required value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><label>Kategori<input required value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} placeholder="Klasik / Favorit / Paket"/></label><label>Harga (angka)<input required type="number" min="0" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })}/></label><label>Deskripsi<textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}/></label><label>URL gambar<input value={draft.image} onChange={e => setDraft({ ...draft, image: e.target.value })} placeholder="https://..."/></label><button className="btn btn-dark full">{editing ? "Simpan perubahan" : "Tambah produk"}</button>{editing && <button type="button" className="btn btn-outline full" onClick={() => { setEditing(null); setDraft({ name: "", category: "Paket", price: "", description: "", image: "", active: true }); }}>Batal edit</button>}</form><div className="admin-list">{products.map(p => <div className="manage-product" key={p.id}><img src={p.image} alt={p.name}/><div><b>{p.name}</b><p>{money(p.price)}</p></div><button className="icon-btn" onClick={() => edit(p)} aria-label="Edit"><span>✎</span></button><button className="icon-btn danger" onClick={() => del(p.id)} aria-label="Hapus"><Trash2 size={17}/></button></div>)}</div></div>}
  </main>;
}

export default function App() {
  const cartApi = useCart();
  const [products, setProducts] = useState(starterProducts);
  const [user, setUser] = useState(null);
  useEffect(() => { getProducts().then(setProducts).catch(err => console.error("Gagal memuat produk", err)); }, []);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);
  return <><Header count={cartApi.count}/><Routes>
    <Route path="/" element={<Home products={products} add={cartApi.add}/>}/>
    <Route path="/produk" element={<Products products={products} add={cartApi.add}/>}/>
    <Route path="/pesan" element={<Checkout {...cartApi}/>}/>
    <Route path="/admin" element={<Admin user={user} setUser={setUser}/>}/>
    <Route path="*" element={<main className="container page"><h1>Halaman tidak ditemukan</h1><Link to="/" className="text-link">Kembali ke beranda</Link></main>}/>
  </Routes><Footer/></>;
}