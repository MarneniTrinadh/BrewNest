// BrewNest API: products, offers, auth (OTP + password), orders, prize draw.
// Storage is a JSON file (data/db.json) so it runs with no database. Swap for a real DB in production.
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, 'data', f), 'utf8'));
const products = read('products.json');
const offers = read('offers.json');
const SECRET = process.env.TOKEN_SECRET || 'dev-secret-change-me';
const ADMINS = (process.env.ADMIN_EMAILS || 'admin@brewnest.test').split(',').map((s) => s.trim().toLowerCase());
const DB_FILE = path.join(dir, 'data', 'db.json');
const db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : { users: [], orders: [] };
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
const otps = new Map(); // phone -> { code, expires }

const PRIZES = [
  { text: 'FREE Tasting Box!', code: 'TASTEBOX100', won: true },
  { text: '15% Off Coffee', code: 'BREW15', won: true },
  { text: 'BrewNest Ceramic Mug', code: 'FREEMUG', won: true },
  { text: 'Free Tea Sampler', code: 'TEAPACK', won: true },
  { text: '20% Off Next Order', code: 'NEST20', won: true },
  { text: 'Free Gourmet Cookie', code: 'SWEETBITE', won: true }
];
// Coupons the storefront can apply: loyalty offers, wheel prizes (15%), and the bean-points redeem
const coupons = Object.fromEntries([
  ...offers.map((o) => [o.code, { type: o.type, val: o.val }]),
  ...PRIZES.map((p) => [p.code, { type: 'percent', val: 15 }]),
  ['BEANSREDEEM', { type: 'fixed', val: 100 }]
]);

// --- helpers ---
const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) => `${salt}:${crypto.scryptSync(pw, salt, 32).toString('hex')}`;
const verify = (pw, stored) => {
  const [salt, h] = stored.split(':');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), crypto.scryptSync(pw, salt, 32));
};
const sign = (id) => {
  const body = Buffer.from(JSON.stringify({ id, exp: Date.now() + 7 * 864e5 })).toString('base64url');
  return `${body}.${crypto.createHmac('sha256', SECRET).update(body).digest('base64url')}`;
};
const unsign = (t = '') => {
  const [body, sig] = t.split('.');
  if (!body || !sig) return null;
  const good = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  const p = JSON.parse(Buffer.from(body, 'base64url').toString());
  return p.exp > Date.now() ? p : null;
};
const publicUser = (u) => ({
  name: u.name, email: u.email, phone: u.phone, role: u.role, address: u.address,
  vipPoints: u.vipPoints, pastOrdersCount: u.pastOrdersCount, isNewUser: u.pastOrdersCount === 0
});
const unitPrice = (p, v = '') => {
  if (/1\s?kg/i.test(v)) return Math.round(p.price * 1.9);
  if (/500\s?g/i.test(v)) return Math.round(p.price * 1.15);
  if (/Box of 4|Pack of 3/.test(v)) return Math.round(p.price * 2.5);
  return p.price;
};
const auth = (req, res, next) => {
  const p = unsign((req.headers.authorization || '').replace('Bearer ', ''));
  const user = p && db.users.find((u) => u.id === p.id);
  if (!user) return res.status(401).json({ error: 'Please log in again' });
  req.user = user;
  next();
};

// --- app ---
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
const api = express.Router();

api.get('/health', (_, res) => res.json({ ok: true }));
api.get('/products', (req, res) => {
  const { category, q } = req.query;
  res.json(products.filter((p) => (!category || p.category === category) &&
    (!q || `${p.name} ${p.description}`.toLowerCase().includes(String(q).toLowerCase()))));
});
api.get('/products/:id', (req, res) => {
  const p = products.find((x) => x.id === req.params.id);
  p ? res.json(p) : res.status(404).json({ error: 'Product not found' });
});
api.get('/offers', (_, res) => res.json(offers));

api.post('/auth/send-otp', (req, res) => {
  const phone = String(req.body.phone || '').replace(/\D/g, '');
  if (phone.length < 10) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });
  const code = String(crypto.randomInt(100000, 999999));
  otps.set(phone, { code, expires: Date.now() + 5 * 60e3 });
  // No SMS provider is connected: the code is returned in development only.
  res.json({ sent: true, ...(process.env.NODE_ENV !== 'production' && { devOtp: code }) });
});

api.post('/auth/register', (req, res) => {
  const { username, email, password, phone, otp } = req.body;
  const mail = String(email || '').trim().toLowerCase();
  if (!username || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) return res.status(400).json({ error: 'Enter a name and a valid email' });
  if (String(password || '').length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  const rec = otps.get(String(phone || '').replace(/\D/g, ''));
  if (!rec || rec.expires < Date.now() || rec.code !== String(otp)) return res.status(400).json({ error: 'Invalid or expired OTP' });
  if (db.users.some((u) => u.email === mail)) return res.status(409).json({ error: 'An account with this email already exists' });
  const user = { id: crypto.randomUUID(), name: username, email: mail, phone, passwordHash: hash(password),
    role: ADMINS.includes(mail) ? 'admin' : 'customer', address: '', vipPoints: 50, pastOrdersCount: 0 };
  db.users.push(user); save(); otps.delete(String(phone).replace(/\D/g, ''));
  res.status(201).json({ token: sign(user.id), user: publicUser(user) });
});

api.post('/auth/login', (req, res) => {
  const mail = String(req.body.email || '').trim().toLowerCase();
  const user = db.users.find((u) => u.email === mail);
  if (!user || !verify(String(req.body.password || ''), user.passwordHash))
    return res.status(401).json({ error: 'Incorrect email or password' });
  res.json({ token: sign(user.id), user: publicUser(user) });
});
api.get('/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

api.post('/orders', auth, (req, res) => {
  const { items, couponCode, paymentMethod, address } = req.body;
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Your cart is empty' });
  const lines = [];
  for (const it of items) { // prices always come from the server catalogue, never the browser
    const p = products.find((x) => x.id === it.productId);
    const qty = Math.min(Math.max(parseInt(it.quantity, 10) || 0, 1), 20);
    if (!p) return res.status(400).json({ error: `Unknown product ${it.productId}` });
    lines.push({ productId: p.id, name: p.name, variant: it.variant, grind: it.grind, price: unitPrice(p, it.variant), quantity: qty, image: p.image });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const c = coupons[couponCode];
  const discount = !c ? 0 : c.type === 'percent' ? Math.round(subtotal * c.val / 100) : c.val;
  const shipping = subtotal > 500 ? 0 : 50;
  const total = Math.max(0, subtotal - discount + shipping);
  const order = { id: '#BN' + crypto.randomInt(100000, 999999), userId: req.user.id,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    items: lines, subtotal, shipping, discount, total, couponCode: c ? couponCode : '',
    address: address || req.user.address, status: 'Confirmed',
    paymentMethod: { card: 'Online Card (Sandbox)', upi: 'UPI / QR' }[paymentMethod] || 'Cash on Delivery' };
  db.orders.push(order);
  req.user.pastOrdersCount += 1;
  req.user.vipPoints += Math.round(total / 10);
  save();
  res.status(201).json({ order, user: publicUser(req.user) });
});
api.get('/orders', auth, (req, res) => res.json(db.orders.filter((o) => o.userId === req.user.id)));

api.post('/draw/spin', (_, res) => {
  const index = crypto.randomInt(PRIZES.length);
  res.json({ index, prize: PRIZES[index], total: PRIZES.length });
});

app.use('/api', api);
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`BrewNest API running on port ${PORT}`);
});
