import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from './api';
import { PRESET_AVATARS } from './data/avatars';
import BrewNestLogo from './components/BrewNestLogo';
import { 
  Coffee, Leaf, ShoppingBag, Heart, Search, User, X, ChevronRight, 
  Star, Plus, Minus, Trash2, CheckCircle2, AlertCircle, Eye, EyeOff, 
  ArrowRight, ShieldCheck, Truck, RefreshCw, Send, SlidersHorizontal, 
  MapPin, Phone, Mail, Award, Clock, DollarSign, BarChart3, Package, 
  ExternalLink, Sparkles, Filter, ChevronDown, Check, LogOut, Settings,
  Camera, Upload, Image as ImageIcon, Gift, Tag, Percent, Zap, Trophy,
  RotateCcw, Sparkle
} from 'lucide-react';

export default function App() {
  // Navigation & Page State
  // Views: 'home' | 'coffee' | 'tea' | 'snacks' | 'draw' (New) | 'offers' (Old) | 'orders' | 'admin'
  const [currentView, setCurrentView] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState(700);

  // Avatar helper
  const getInitialAvatar = () => {
    try {
      const stored = localStorage.getItem('brewnest_user_avatar');
      if (stored) return stored;
    } catch (e) {}
    return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
  };

  // --- USER STATE & SEGMENTATION ('New User / Guest' vs 'Old / Returning VIP User') ---
  // When isNewUser is true: Showcase Free Demo tasting promotion, draw, vouchers
  // When isNewUser is false: Exclusively showcase returning customer VIP offers, loyalty points, refill savings
  const [user, setUser] = useState({
    isLoggedIn: false,
    isNewUser: true, // Default to true for fresh visitors
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 98765 43210',
    avatar: getInitialAvatar(),
    role: 'customer',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, 560103',
    vipPoints: 340,
    pastOrdersCount: 0
  });

  // Modal & Drawer States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'otp' | 'forgot'
  const [authFormData, setAuthFormData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    otp: '',
    rememberMe: true,
    agreedTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Profile Avatar Editing State (Fully working with File, Camera, Presets, and URL)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(user.avatar);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const fileInputRef = useRef(null);

  // Cart & Wishlist State
  const [cart, setCart] = useState([
    {
      productId: 'c1',
      name: 'Arabica Coffee Beans',
      variant: '1 kg',
      grind: 'Whole Bean',
      price: 450,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=400&q=80'
    },
    {
      productId: 't5',
      name: 'Kashmiri Organic Green Tea',
      variant: '500 g',
      grind: 'Loose Leaf',
      price: 300,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=400&q=80'
    }
  ]);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [wishlist, setWishlist] = useState(['c1', 't7', 's5']);

  // Product Details Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVariant, setModalVariant] = useState('');
  const [modalGrind, setModalGrind] = useState('');
  const [modalQuantity, setModalQuantity] = useState(1);

  // Checkout & Orders State
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState({
    id: '#BN123456',
    date: '25 Aug 2026',
    items: [],
    subtotal: 750,
    shipping: 0,
    total: 750,
    address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru, 560103',
    status: 'Confirmed'
  });

  // Free Tasting Draw (New Customers Only)
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [drawResult, setDrawResult] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3600);
  };

  // Switch persona simulation (New User / Guest vs Returning Loyal Old User)
  // Load catalogue and offers from the backend, and restore a saved login
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  useEffect(() => {
    api.get('/products').then(setProducts).catch(() => showToast('Could not load products. Is the backend running?', 'error'));
    api.get('/offers').then(setOffers).catch(() => {});
    if (localStorage.getItem('brewnest_token')) {
      api.get('/auth/me')
        .then((d) => setUser((u) => ({ ...u, ...d.user, isLoggedIn: true })))
        .catch(() => localStorage.removeItem('brewnest_token'));
    }
  }, []);

  const toggleUserPersona = () => {
    if (user.isNewUser) {
      // Switch to Old / Returning Customer
      setUser((prev) => ({
        ...prev,
        isLoggedIn: true,
        isNewUser: false,
        name: 'Priya Sharma (Loyal Patron)',
        pastOrdersCount: 6,
        vipPoints: 680
      }));
      // If currently on Tasting draw, switch to Offers view
      if (currentView === 'draw') setCurrentView('offers');
      showToast('Switched persona to: Returning VIP Customer (Loyalty & Offers Activated)');
    } else {
      // Switch to New User / Guest
      setUser((prev) => ({
        ...prev,
        isLoggedIn: false,
        isNewUser: true,
        name: 'Guest / New Customer',
        pastOrdersCount: 0,
        vipPoints: 0
      }));
      if (currentView === 'offers') setCurrentView('draw');
      showToast('Switched persona to: New User / Guest (Free Tasting Demo Activated)');
    }
  };

  // Avatar Editor Handlers
  const openAvatarEditor = () => {
    setAvatarPreviewUrl(user.avatar);
    setCustomAvatarUrl('');
    setAvatarModalOpen(true);
  };

  const handleLocalImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreviewUrl(e.target.result);
      showToast('Image loaded! Click "Save Profile Picture" to confirm.', 'info');
    };
    reader.onerror = () => {
      showToast('Failed to read image file', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = () => {
    if (!avatarPreviewUrl) {
      showToast('Please select or upload an image first', 'error');
      return;
    }

    setUser((prev) => ({
      ...prev,
      avatar: avatarPreviewUrl
    }));

    try {
      localStorage.setItem('brewnest_user_avatar', avatarPreviewUrl);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    setAvatarModalOpen(false);
    showToast('Profile picture updated successfully!');
  };

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Derived Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percent') {
      return Math.round((cartSubtotal * appliedCoupon.val) / 100);
    }
    return appliedCoupon.val;
  }, [cartSubtotal, appliedCoupon]);

  const shippingFee = cartSubtotal > 500 || cartSubtotal === 0 ? 0 : 50;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount + shippingFee);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (currentView === 'coffee' && prod.category !== 'coffee') return false;
      if (currentView === 'tea' && prod.category !== 'tea') return false;
      if (currentView === 'snacks' && prod.category !== 'snacks') return false;

      if (selectedCategoryFilter !== 'all') {
        const matchesCategory =
          prod.category.toLowerCase() === selectedCategoryFilter.toLowerCase() ||
          prod.subCategory.toLowerCase().includes(selectedCategoryFilter.toLowerCase());
        if (!matchesCategory) return false;
      }

      if (prod.price > priceRange) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = prod.name.toLowerCase().includes(query);
        const matchDesc = prod.description.toLowerCase().includes(query);
        const matchSub = prod.subCategory.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchSub) return false;
      }

      return true;
    });
  }, [products, currentView, selectedCategoryFilter, priceRange, searchQuery]);

  // Cart actions
  const handleAddToCart = (product, variantOverride, grindOverride, quantityOverride = 1) => {
    const chosenVariant = variantOverride || (product.variants ? product.variants[0] : 'Standard');
    const chosenGrind = grindOverride || (product.grindOptions ? product.grindOptions[0] : 'Fresh');

    let calculatedPrice = product.price;
    if (chosenVariant.includes('1kg') || chosenVariant.includes('1 kg')) {
      calculatedPrice = Math.round(product.price * 1.9);
    } else if (chosenVariant.includes('500g') || chosenVariant.includes('500 g')) {
      calculatedPrice = Math.round(product.price * 1.15);
    } else if (chosenVariant.includes('Box of 4') || chosenVariant.includes('Pack of 3')) {
      calculatedPrice = Math.round(product.price * 2.5);
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.variant === chosenVariant && item.grind === chosenGrind
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantityOverride;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            variant: chosenVariant,
            grind: chosenGrind,
            price: calculatedPrice,
            quantity: quantityOverride,
            image: product.image
          }
        ];
      }
    });

    showToast(`Added "${product.name}" to your basket!`);
  };

  const updateCartQuantity = (index, delta) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const removeCartItem = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
    showToast('Item removed from basket', 'info');
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast('Removed from your favorites', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Saved to your favorites!');
        return [...prev, productId];
      }
    });
  };

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setModalVariant(product.variants ? product.variants[0] : 'Regular');
    setModalGrind(product.grindOptions ? product.grindOptions[0] : 'Freshly Ground');
    setModalQuantity(1);
  };

  // Auth Handlers
  // --- API-backed handlers (data lives in the backend) ---
  const applySession = (data) => {
    localStorage.setItem('brewnest_token', data.token);
    setUser((u) => ({ ...u, ...data.user, isLoggedIn: true }));
  };

  const handleSendOtp = async () => {
    if (!authFormData.phone || authFormData.phone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }
    try {
      const r = await api.post('/auth/send-otp', { phone: authFormData.phone });
      setOtpSent(true);
      setOtpTimer(45);
      if (r.devOtp) setAuthFormData((prev) => ({ ...prev, otp: r.devOtp }));
      showToast(r.devOtp ? `Dev OTP [${r.devOtp}] sent to ${authFormData.phone}` : `OTP sent to ${authFormData.phone}`);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    if (!authFormData.agreedTerms) {
      showToast('Please accept the Terms & Privacy Policy', 'error');
      return;
    }
    try {
      const data = await api.post('/auth/register', {
        username: authFormData.username, email: authFormData.email,
        password: authFormData.password, phone: authFormData.phone, otp: authFormData.otp
      });
      applySession(data);
      setAuthModalOpen(false);
      showToast('Account created! As a new customer, your Free Tasting Demo is unlocked!');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authFormData.email || !authFormData.password) {
      showToast('Please fill in both email and password', 'error');
      return;
    }
    try {
      const data = await api.post('/auth/login', { email: authFormData.email, password: authFormData.password });
      applySession(data);
      setAuthModalOpen(false);
      showToast(`Welcome back, ${data.user.name}! ${data.user.isNewUser ? 'Free Tasting Demo Unlocked!' : 'VIP Offers Unlocked!'}`);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('brewnest_token');
    setUser({
      isLoggedIn: false, isNewUser: true, name: '', email: '', phone: '',
      avatar: getInitialAvatar(), role: 'customer', address: '', vipPoints: 0, pastOrdersCount: 0
    });
    setProfileDrawerOpen(false);
    showToast('You have logged out safely. Visit again soon!', 'info');
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error');
      return;
    }
    if (!user.isLoggedIn) {
      setAuthMode('login');
      setAuthModalOpen(true);
      showToast('Please log in to place your order', 'error');
      return;
    }
    try {
      const { order, user: updated } = await api.post('/orders', {
        items: cart.map((i) => ({ productId: i.productId, variant: i.variant, grind: i.grind, quantity: i.quantity })),
        couponCode: appliedCoupon ? appliedCoupon.code : '',
        paymentMethod,
        address: user.address
      });
      setLastPlacedOrder({ ...order, items: cart });
      setCart([]);
      setAppliedCoupon(null);
      setCartDrawerOpen(false);
      setUser((prev) => ({ ...prev, ...updated }));
      setCurrentView('orders');
      showToast(`Order ${order.id} placed successfully! You now earn VIP Bean Points.`);
    } catch (err) { showToast(err.message, 'error'); }
  };

  // Spinning Wheel (New Users): the backend picks the prize, the UI animates it
  const spinDrawWheel = async () => {
    if (wheelSpinning) return;
    setWheelSpinning(true);
    setDrawResult(null);
    try {
      const { index, prize, total } = await api.post('/draw/spin', {});
      const segmentAngle = 360 / total;
      setWheelRotation(5 * 360 + (360 - index * segmentAngle - segmentAngle / 2));
      setTimeout(() => {
        setWheelSpinning(false);
        setDrawResult(prize);
        showToast(`Congratulations! You won: ${prize.text}`);
      }, 4500);
    } catch (err) {
      setWheelSpinning(false);
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2B170B] font-sans antialiased selection:bg-[#DDA15E]/30 selection:text-[#2B170B]">
      
      {/* --- TOP CAFÉ ANNOUNCEMENT BAR & PERSONA SWITCHER --- */}
      <div className="bg-[#24140B] text-[#EBD9C8] text-xs py-2 px-4 border-b border-[#3A2012]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          
          {/* Persona Switcher Toggle (Core segmentation requirement) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#DDA15E] uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> Mode:
            </span>
            <button
              onClick={toggleUserPersona}
              className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm ${
                user.isNewUser
                  ? 'bg-[#588157] text-white hover:bg-[#476c46]'
                  : 'bg-[#C87D32] text-white hover:bg-[#a86524]'
              }`}
              title="Click to toggle between New User (Free Tasting) and Old User (VIP Offers)"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{user.isNewUser ? '🌱 New User / Guest (Free Demo)' : '👑 Returning VIP Customer (Offers Only)'}</span>
            </button>
            <span className="text-[10px] text-[#EBD9C8]/60 hidden md:inline">
              (Click to test dynamic transformation)
            </span>
          </div>

          {/* Dynamic Center Promo Message */}
          <div className="flex items-center gap-2 font-medium text-center">
            {user.isNewUser ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-[#588157] animate-pulse"></span>
                <span>First-time visitor exclusive: Win a Free Coffee or Tea Tasting Box!</span>
                <button 
                  onClick={() => setCurrentView('draw')} 
                  className="underline hover:text-[#C87D32] font-semibold ml-1 cursor-pointer"
                >
                  Spin Wheel &rarr;
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#DDA15E]">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>VIP Patron Perks: 20% Off Refills &amp; Double Bean Points Active</span>
                <button 
                  onClick={() => setCurrentView('offers')} 
                  className="underline text-white hover:text-[#DDA15E] font-semibold ml-1 cursor-pointer"
                >
                  View Offers &rarr;
                </button>
              </span>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[11px]">
            <span className="hover:text-white cursor-pointer" onClick={() => setCurrentView('admin')}>Admin Portal</span>
            <span>|</span>
            <span>Pan-India Courier</span>
          </div>
        </div>
      </div>

      {/* --- MAIN NAVIGATION BAR --- */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EBD9C8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div onClick={() => setCurrentView('home')}>
            <BrewNestLogo />
          </div>

          {/* Navigation Links (Dynamically segmented based on isNewUser) */}
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-medium tracking-tight text-[#432514]">
            <button 
              onClick={() => { setCurrentView('home'); setSelectedCategoryFilter('all'); }} 
              className={`hover:text-[#C87D32] transition py-1 relative ${currentView === 'home' ? 'text-[#C87D32] font-bold' : ''}`}
            >
              Home
              {currentView === 'home' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C87D32] rounded"></span>}
            </button>
            <button 
              onClick={() => { setCurrentView('coffee'); setSelectedCategoryFilter('all'); }} 
              className={`hover:text-[#C87D32] transition py-1 relative ${currentView === 'coffee' ? 'text-[#C87D32] font-bold' : ''}`}
            >
              Coffee
              {currentView === 'coffee' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C87D32] rounded"></span>}
            </button>
            <button 
              onClick={() => { setCurrentView('tea'); setSelectedCategoryFilter('all'); }} 
              className={`hover:text-[#C87D32] transition py-1 relative ${currentView === 'tea' ? 'text-[#C87D32] font-bold' : ''}`}
            >
              Tea
              {currentView === 'tea' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C87D32] rounded"></span>}
            </button>
            <button 
              onClick={() => { setCurrentView('snacks'); setSelectedCategoryFilter('all'); }} 
              className={`hover:text-[#C87D32] transition py-1 relative ${currentView === 'snacks' ? 'text-[#C87D32] font-bold' : ''}`}
            >
              Snacks
              {currentView === 'snacks' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#C87D32] rounded"></span>}
            </button>

            {/* DYNAMIC SEGMENTED NAV ITEM: Free Tasting (New Users) OR VIP Offers (Old Users) */}
            {user.isNewUser ? (
              <button 
                onClick={() => setCurrentView('draw')} 
                className={`flex items-center gap-1.5 transition py-1 px-3 rounded-full text-xs font-bold border ${
                  currentView === 'draw' 
                    ? 'bg-[#588157] text-white border-[#588157]' 
                    : 'bg-[#588157]/10 text-[#588157] border-[#588157]/30 hover:bg-[#588157]/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Free Tasting Demo</span>
                <span className="bg-[#588157] text-white text-[9px] px-1.5 py-0.2 rounded-full uppercase">New</span>
              </button>
            ) : (
              <button 
                onClick={() => setCurrentView('offers')} 
                className={`flex items-center gap-1.5 transition py-1 px-3 rounded-full text-xs font-bold border ${
                  currentView === 'offers' 
                    ? 'bg-[#C87D32] text-white border-[#C87D32]' 
                    : 'bg-[#C87D32]/10 text-[#C87D32] border-[#C87D32]/30 hover:bg-[#C87D32]/20'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-[#C87D32]" />
                <span>VIP Deals &amp; Offers</span>
                <span className="bg-[#C87D32] text-white text-[9px] px-1.5 py-0.2 rounded-full uppercase">Patron</span>
              </button>
            )}
          </nav>

          {/* Search bar & Action Icons */}
          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block w-56 xl:w-64">
              <input
                type="text"
                placeholder="Search beans, chai, puffs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5EBE1] border border-[#EBD9C8] rounded-full pl-9 pr-4 py-2 text-xs text-[#2B170B] placeholder-[#9C7A65] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
              />
              <Search className="w-4 h-4 text-[#9C7A65] absolute left-3 top-2.5" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-[#9C7A65]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Wishlist */}
            <button 
              onClick={() => showToast(`Wishlist contains ${wishlist.length} item(s)`)}
              className="relative p-2 rounded-full hover:bg-[#F5EBE1] text-[#432514] transition"
              title="Saved Favorites"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C87D32] text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Basket */}
            <button 
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2 rounded-full hover:bg-[#F5EBE1] text-[#432514] transition"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#588157] text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {cart.reduce((t, i) => t + i.quantity, 0)}
                </span>
              )}
            </button>

            {/* User Avatar & Profile Drawer */}
            {user.isLoggedIn ? (
              <div 
                onClick={() => setProfileDrawerOpen(true)}
                className="flex items-center gap-2 pl-2 border-l border-[#EBD9C8] cursor-pointer group"
              >
                <div className="relative">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-9 h-9 rounded-full object-cover border-2 border-[#C87D32] group-hover:scale-105 transition"
                  />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${user.isNewUser ? 'bg-green-500' : 'bg-[#C87D32]'}`}></span>
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-[#2B170B] leading-none truncate max-w-[110px]">{user.name}</p>
                  <p className="text-[10px] text-[#9C7A65] mt-0.5">
                    {user.isNewUser ? '🌱 New Member' : `👑 VIP (${user.vipPoints} pts)`}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#432514] text-white text-xs font-semibold hover:bg-[#2B170B] transition shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Subnav on Mobile */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-[#EBD9C8] bg-[#F5EBE1]/60 text-xs font-medium">
          <button 
            onClick={() => setCurrentView('home')} 
            className={`px-3 py-1 rounded-full ${currentView === 'home' ? 'bg-[#432514] text-white' : 'text-[#432514]'}`}
          >
            Home
          </button>
          <button 
            onClick={() => setCurrentView('coffee')} 
            className={`px-3 py-1 rounded-full ${currentView === 'coffee' ? 'bg-[#432514] text-white' : 'text-[#432514]'}`}
          >
            Coffee (15)
          </button>
          <button 
            onClick={() => setCurrentView('tea')} 
            className={`px-3 py-1 rounded-full ${currentView === 'tea' ? 'bg-[#432514] text-white' : 'text-[#432514]'}`}
          >
            Tea (15)
          </button>
          <button 
            onClick={() => setCurrentView('snacks')} 
            className={`px-3 py-1 rounded-full ${currentView === 'snacks' ? 'bg-[#432514] text-white' : 'text-[#432514]'}`}
          >
            Snacks (26)
          </button>
          {user.isNewUser ? (
            <button 
              onClick={() => setCurrentView('draw')} 
              className={`px-3 py-1 rounded-full font-bold ${currentView === 'draw' ? 'bg-[#588157] text-white' : 'text-[#588157]'}`}
            >
              Demo
            </button>
          ) : (
            <button 
              onClick={() => setCurrentView('offers')} 
              className={`px-3 py-1 rounded-full font-bold ${currentView === 'offers' ? 'bg-[#C87D32] text-white' : 'text-[#C87D32]'}`}
            >
              Offers
            </button>
          )}
        </div>
      </header>

      {/* --- TOAST NOTIFICATIONS --- */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2B170B] text-white shadow-2xl border border-[#C87D32]/40 animate-slide-up">
          {toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : toast.type === 'info' ? (
            <AlertCircle className="w-5 h-5 text-[#DDA15E]" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-[#A3B18A]" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: HOME (DYNAMICALLY ADAPTED FOR NEW USERS VS RETURNING OLD USERS)     */}
      {/* ========================================================================= */}
      {currentView === 'home' && (
        <main>
          {/* USER WELCOME RIBBON (Shows personalization based on segment) */}
          {user.isLoggedIn && (
            <div className="bg-gradient-to-r from-[#F5EBE1] via-[#EBD9C8] to-[#F5EBE1] border-b border-[#DDA15E]/30 py-3.5 px-4 sm:px-8">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div 
                    onClick={openAvatarEditor} 
                    className="relative w-11 h-11 rounded-full border-2 border-[#C87D32] overflow-hidden cursor-pointer group shadow-sm flex-shrink-0"
                    title="Click to change profile picture"
                  >
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover group-hover:scale-110 transition" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#2B170B] flex items-center gap-2">
                      <span>Welcome back, {user.name}!</span>
                      {!user.isNewUser && (
                        <span className="px-2 py-0.5 rounded-full bg-[#C87D32] text-white text-[10px] font-sans font-bold">
                          VIP Level 2
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#7D5A44]">
                      {user.isNewUser 
                        ? 'Your new customer status qualifies you for the Free Tasting Box draw.'
                        : `You have ${user.vipPoints} Bean points available to redeem towards artisan bakery treats.`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {user.isNewUser ? (
                    <button 
                      onClick={() => setCurrentView('draw')}
                      className="px-4 py-1.5 rounded-full bg-[#588157] text-white text-xs font-semibold hover:bg-[#3A5A40] transition shadow-sm flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Try Free Tasting Box
                    </button>
                  ) : (
                    <button 
                      onClick={() => setCurrentView('offers')}
                      className="px-4 py-1.5 rounded-full bg-[#C87D32] text-white text-xs font-semibold hover:bg-[#a86524] transition shadow-sm flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      View Returning Offers
                    </button>
                  )}
                  <button 
                    onClick={() => setCurrentView('orders')}
                    className="px-3 py-1.5 rounded-full border border-[#432514] text-[#432514] text-xs font-medium hover:bg-[#432514] hover:text-white transition"
                  >
                    My Past Orders
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. DYNAMIC HERO BANNER: Tailored for New vs Old Users */}
          <section className="relative overflow-hidden bg-gradient-to-b from-[#24140B] via-[#351B0D] to-[#24140B] text-white py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C87D32_1px,transparent_1px)] [background-size:24px_24px]"></div>
            
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              
              {/* Left Column Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                
                {/* Segment Pill */}
                {user.isNewUser ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#588157]/20 border border-[#588157]/40 text-[#A3B18A] text-xs font-semibold tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-[#588157]" /> First-Time Customer Exclusive Promotion
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C87D32]/20 border border-[#C87D32]/40 text-[#DDA15E] text-xs font-semibold tracking-wider uppercase">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" /> Returning Patron Exclusive Deals Active
                  </div>
                )}

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-tight text-[#FDFBF7]">
                  {user.isNewUser ? (
                    <>
                      Discover Your <br />
                      <span className="text-[#DDA15E] italic font-serif">Perfect Cup.</span>
                    </>
                  ) : (
                    <>
                      Welcome Back, Connoisseur. <br />
                      <span className="text-[#DDA15E] italic font-serif">20% Off Your Favorite Brews.</span>
                    </>
                  )}
                </h1>

                {/* Supporting Text */}
                <p className="text-[#EBD9C8]/90 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                  {user.isNewUser
                    ? 'Explore hand-harvested Arabica coffees, estate first-flush teas, and oven-fresh snacks. New customers can participate in our Free Coffee or Tea Tasting promotion today.'
                    : 'As a valued BrewNest patron, unlock repeat order refill discounts, double loyalty bean rewards, and priority dispatch from our roastery.'
                  }
                </p>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <button
                    onClick={() => { setCurrentView('coffee'); setSelectedCategoryFilter('all'); }}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#C87D32] hover:bg-[#b56e29] text-white font-semibold text-sm transition-all shadow-lg hover:shadow-[#C87D32]/30 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Explore Our Collection</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </button>

                  {/* Secondary CTA: Free Tasting (New Users) OR VIP Offers (Old Users) */}
                  {user.isNewUser ? (
                    <button
                      onClick={() => setCurrentView('draw')}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#588157] hover:bg-[#476c46] text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Try Your Free Tasting</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentView('offers')}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#F5EBE1]/10 hover:bg-[#F5EBE1]/20 border border-[#EBD9C8]/40 text-[#FDFBF7] font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Tag className="w-4 h-4 text-[#DDA15E]" />
                      <span>View VIP Offers (4 Active)</span>
                    </button>
                  )}
                </div>

                {/* Trust stats / Patron status */}
                <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center lg:text-left">
                  <div>
                    <p className="text-2xl font-serif font-bold text-[#DDA15E]">15+</p>
                    <p className="text-xs text-[#EBD9C8]/70">Coffee Roasts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-serif font-bold text-[#DDA15E]">15+</p>
                    <p className="text-xs text-[#EBD9C8]/70">Estate Teas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-serif font-bold text-[#DDA15E]">{user.isNewUser ? '100%' : '680'}</p>
                    <p className="text-xs text-[#EBD9C8]/70">{user.isNewUser ? 'Free Tasting Demo' : 'VIP Bean Points'}</p>
                  </div>
                </div>
              </div>

              {/* Right Column Visual Banner */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative w-80 sm:w-96 h-80 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-[#C87D32]/30 group">
                  <img
                    src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
                    alt="Steaming Cup of BrewNest Coffee"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20"></div>
                  
                  <div className="absolute bottom-4 left-4 right-4 bg-[#2B170B]/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#C87D32]/40 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C87D32] flex items-center justify-center text-white font-bold">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {user.isNewUser ? 'Welcome Demo Box Ready' : 'Returning Patron Special Active'}
                      </p>
                      <p className="text-[10px] text-[#DDA15E]">
                        {user.isNewUser ? 'Draw open for first 500 visitors' : 'Use code BREWLOYAL20 at checkout'}
                      </p>
                    </div>
                    <div className="ml-auto flex text-[#DDA15E] text-xs">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold ml-1">4.9</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. DYNAMIC CALLOUT SECTION: Free Tasting for New Users OR VIP Offers for Old Users */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            {user.isNewUser ? (
              // NEW USERS: FREE TASTING PROMOTION (FIG 5 & 11)
              <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-[#DDA15E]/30 via-[#EBD9C8] to-[#F5EBE1] border border-[#C87D32]/30 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-xl text-center md:text-left">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#588157] text-white text-[11px] font-bold uppercase tracking-wider">
                    New Customers Only
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2B170B] leading-tight">
                    Free Coffee or Tea Tasting!
                  </h2>
                  <p className="text-[#432514] text-sm sm:text-base leading-relaxed">
                    "Your Next Favorite Cup Could Be Free!" New customers can enter our auditable tasting draw for a luxury welcome box featuring 3 single-origin coffees and 2 estate teas with zero shipping charges.
                  </p>
                  <button
                    onClick={() => setCurrentView('draw')}
                    className="px-8 py-3 rounded-full bg-[#432514] text-white font-semibold text-sm hover:bg-[#2B170B] transition shadow-md flex items-center justify-center gap-2 mx-auto md:mx-0"
                  >
                    <Sparkles className="w-4 h-4 text-[#DDA15E]" />
                    <span>Try Your Free Tasting Now</span>
                  </button>
                </div>

                <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80"
                    alt="Free Tasting Sampler"
                    className="w-full h-full object-cover rounded-2xl shadow-xl border-2 border-white"
                  />
                  <div className="absolute -bottom-3 -right-3 bg-[#588157] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5">
                    <Gift className="w-4 h-4" /> 100% Free Entry
                  </div>
                </div>
              </div>
            ) : (
              // OLD / RETURNING USERS: EXCLUSIVE PATRON OFFERS HUB
              <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-[#24140B] via-[#351B0D] to-[#24140B] text-white border border-[#C87D32]/50 p-8 sm:p-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#C87D32] text-white text-[11px] font-bold uppercase tracking-wider">
                      👑 Returning Customer Exclusive
                    </span>
                    <h2 className="text-3xl font-serif font-bold text-white mt-2">
                      VIP Offers &amp; Loyalty Rewards
                    </h2>
                    <p className="text-xs text-[#EBD9C8]/80 mt-1">
                      (Free tasting promotion claimed &bull; Enjoy your permanent loyalty perks)
                    </p>
                  </div>
                  <div className="bg-[#2B170B] px-5 py-3 rounded-2xl border border-[#C87D32]/40 text-center">
                    <span className="text-[10px] text-[#DDA15E] uppercase font-bold tracking-wider">Your Loyalty Balance</span>
                    <p className="text-2xl font-serif font-black text-white">{user.vipPoints} Bean Pts</p>
                    <span className="text-[10px] text-green-400">Worth ₹{Math.round(user.vipPoints / 2)} at checkout</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  {offers.map((offer, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-[#C87D32] transition">
                      <div>
                        <span className="text-[10px] font-bold text-[#DDA15E] uppercase">{offer.tag}</span>
                        <h4 className="font-serif font-bold text-sm text-white mt-1">{offer.title}</h4>
                        <p className="text-xs text-[#EBD9C8]/70 mt-1">{offer.desc}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-yellow-300">{offer.code}</span>
                        <button
                          onClick={() => {
                            setCouponCode(offer.code);
                            setAppliedCoupon({ code: offer.code, val: offer.val, type: offer.type });
                            showToast(`Applied VIP offer "${offer.code}" to basket!`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#C87D32] text-white text-[10px] font-bold hover:bg-[#b56e29]"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 3. FOUR CORE CAFÉ FEATURE BADGES */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                onClick={() => { setCurrentView('coffee'); }} 
                className="bg-white p-5 rounded-2xl shadow-sm border border-[#EBD9C8] flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-[#F5EBE1] text-[#432514] flex items-center justify-center group-hover:bg-[#432514] group-hover:text-white transition">
                  <Coffee className="w-6 h-6" />
                </div>
                <h4 className="mt-3 font-serif font-bold text-sm text-[#2B170B]">Fresh Beans</h4>
                <p className="text-[11px] text-[#7D5A44] mt-0.5">Whole &amp; custom ground</p>
              </div>

              <div 
                onClick={() => { setCurrentView('tea'); }} 
                className="bg-white p-5 rounded-2xl shadow-sm border border-[#EBD9C8] flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-[#F5EBE1] text-[#588157] flex items-center justify-center group-hover:bg-[#588157] group-hover:text-white transition">
                  <Leaf className="w-6 h-6" />
                </div>
                <h4 className="mt-3 font-serif font-bold text-sm text-[#2B170B]">Premium Tea</h4>
                <p className="text-[11px] text-[#7D5A44] mt-0.5">Assam, Darjeeling &amp; Matcha</p>
              </div>

              <div 
                onClick={() => { setCurrentView('snacks'); }} 
                className="bg-white p-5 rounded-2xl shadow-sm border border-[#EBD9C8] flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-[#F5EBE1] text-[#C87D32] flex items-center justify-center group-hover:bg-[#C87D32] group-hover:text-white transition">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="mt-3 font-serif font-bold text-sm text-[#2B170B]">Tasty Snacks</h4>
                <p className="text-[11px] text-[#7D5A44] mt-0.5">Muffins, cookies &amp; puffs</p>
              </div>

              {/* Dynamic 4th Card: Free Tasting (New) OR VIP Offers (Old) */}
              {user.isNewUser ? (
                <div 
                  onClick={() => setCurrentView('draw')} 
                  className="bg-gradient-to-br from-[#F5EBE1] to-[#EBD9C8] p-5 rounded-2xl shadow-sm border border-[#DDA15E]/50 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#588157] text-white flex items-center justify-center group-hover:scale-110 transition">
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </div>
                  <h4 className="mt-3 font-serif font-bold text-sm text-[#2B170B]">Free Tasting</h4>
                  <p className="text-[11px] text-[#588157] font-semibold mt-0.5">Spin Demo Wheel</p>
                </div>
              ) : (
                <div 
                  onClick={() => setCurrentView('offers')} 
                  className="bg-gradient-to-br from-[#F5EBE1] to-[#EBD9C8] p-5 rounded-2xl shadow-sm border border-[#C87D32]/50 flex flex-col items-center text-center hover:shadow-xl hover:-translate-y-1 transition cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#C87D32] text-white flex items-center justify-center group-hover:scale-110 transition">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="mt-3 font-serif font-bold text-sm text-[#2B170B]">VIP Offers</h4>
                  <p className="text-[11px] text-[#C87D32] font-semibold mt-0.5">Patron Discounts</p>
                </div>
              )}
            </div>
          </section>

          {/* 4. BESTSELLING ROASTS & BLENDS (PREVIEW GRID) */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-[#EBD9C8]">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-[#C87D32]">Artisan Roaster's Choice</span>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B170B]">Bestselling Coffee &amp; Teas</h3>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center gap-3">
                <button 
                  onClick={() => { setCurrentView('coffee'); }} 
                  className="text-xs font-semibold text-[#432514] hover:text-[#C87D32] flex items-center gap-1"
                >
                  View All 15 Coffees &rarr;
                </button>
                <span className="text-[#EBD9C8]">|</span>
                <button 
                  onClick={() => { setCurrentView('tea'); }} 
                  className="text-xs font-semibold text-[#432514] hover:text-[#C87D32] flex items-center gap-1"
                >
                  View All 15 Teas &rarr;
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-[#EBD9C8] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col group"
                >
                  <div className="relative h-48 overflow-hidden bg-[#F5EBE1]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-[#432514] hover:text-red-500 transition shadow"
                    >
                      <Heart
                        className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`}
                      />
                    </button>
                    {product.isBestseller && (
                      <span className="absolute top-3 left-3 bg-[#C87D32] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow">
                        Bestseller
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#9C7A65]">
                        <span>{product.subCategory}</span>
                        <div className="flex items-center text-[#C87D32]">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="ml-1 font-semibold text-[#2B170B]">{product.rating}</span>
                        </div>
                      </div>
                      <h4
                        onClick={() => openProductModal(product)}
                        className="font-serif font-bold text-base text-[#2B170B] mt-1 hover:text-[#C87D32] transition cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h4>
                      <p className="text-xs text-[#7D5A44] mt-1 line-clamp-2">{product.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F5EBE1] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#9C7A65]">Price / 250g</span>
                        <p className="font-bold text-base text-[#2B170B]">₹{product.price}</p>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="px-3.5 py-1.5 rounded-full bg-[#432514] text-white text-xs font-semibold hover:bg-[#2B170B] transition flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. BAKERY SNACKS SHOWCASE PREVIEW */}
          <section className="bg-[#F5EBE1] py-14 px-4 sm:px-6 lg:px-8 border-y border-[#EBD9C8]">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
                <div>
                  <span className="text-xs uppercase tracking-widest font-bold text-[#588157]">Oven Baked Daily</span>
                  <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B170B]">Café Snacks &amp; Delights</h3>
                </div>
                <button
                  onClick={() => setCurrentView('snacks')}
                  className="mt-3 sm:mt-0 px-4 py-2 rounded-full border border-[#432514] text-[#432514] text-xs font-semibold hover:bg-[#432514] hover:text-white transition"
                >
                  Explore All 26 Bakery Items &rarr;
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {products.filter((p) => p.category === 'snacks').slice(0, 6).map((snack) => (
                  <div
                    key={snack.id}
                    onClick={() => openProductModal(snack)}
                    className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition text-center cursor-pointer border border-[#EBD9C8] flex flex-col justify-between"
                  >
                    <div className="w-full h-28 rounded-lg overflow-hidden bg-[#F5EBE1] mb-2">
                      <img src={snack.image} alt={snack.name} className="w-full h-full object-cover hover:scale-105 transition" />
                    </div>
                    <h5 className="font-serif font-bold text-xs text-[#2B170B] line-clamp-1">{snack.name}</h5>
                    <p className="text-xs font-bold text-[#C87D32] mt-1">₹{snack.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEW: FREE TASTING DEMO & LOTTERY (EXCLUSIVELY FOR NEW USERS)             */}
      {/* ========================================================================= */}
      {currentView === 'draw' && (
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {user.isNewUser ? (
            <>
              <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
                <span className="px-3 py-1 rounded-full bg-[#588157] text-white text-xs font-bold uppercase tracking-wider">
                  🌱 New Customer Welcome Promotion
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#2B170B]">
                  Free Coffee or Tea Tasting Demo
                </h2>
                <p className="text-sm text-[#7D5A44] leading-relaxed">
                  "Your Next Favorite Cup Could Be Free!" New visitors can spin our official café wheel for a guaranteed prize code or our flagship Tasting Box delivered to your doorstep.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-[#EBD9C8] p-6 sm:p-12 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                
                {/* Spinning Wheel */}
                <div className="md:col-span-7 flex flex-col items-center justify-center">
                  <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 z-30 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-[#2B170B] drop-shadow-md"></div>

                    <div
                      className="w-full h-full rounded-full border-8 border-[#3A2012] shadow-2xl overflow-hidden relative transition-transform duration-[4500ms] ease-out"
                      style={{
                        transform: `rotate(${wheelRotation}deg)`,
                        background: 'conic-gradient(#C87D32 0% 16.66%, #588157 16.66% 33.33%, #DDA15E 33.33% 50%, #432514 50% 66.66%, #A3B18A 66.66% 83.33%, #8A5A36 83.33% 100%)'
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="absolute top-4 text-white text-[11px] font-bold tracking-tight">FREE BOX</span>
                        <span className="absolute right-4 text-white text-[11px] font-bold tracking-tight rotate-90">15% OFF</span>
                        <span className="absolute bottom-4 text-white text-[11px] font-bold tracking-tight">MUG</span>
                        <span className="absolute left-4 text-white text-[11px] font-bold tracking-tight -rotate-90">SAMPLER</span>
                      </div>
                    </div>

                    <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-[#2B170B] border-4 border-[#EBD9C8] text-white flex flex-col items-center justify-center shadow-lg z-20">
                      <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#DDA15E]">SPIN</span>
                      <Coffee className="w-4 h-4 text-white mt-0.5" />
                    </div>
                  </div>

                  <button
                    onClick={spinDrawWheel}
                    disabled={wheelSpinning}
                    className={`mt-8 px-10 py-3.5 rounded-full font-bold text-sm tracking-wide shadow-lg transition active:scale-95 ${
                      wheelSpinning
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-[#432514] hover:bg-[#2B170B] text-white hover:shadow-[#432514]/30'
                    }`}
                  >
                    {wheelSpinning ? 'Selecting Lucky Outcome...' : 'Spin the Wheel Now'}
                  </button>
                </div>

                {/* Right Info Box */}
                <div className="md:col-span-5 space-y-5 bg-[#FDFBF7] p-6 rounded-2xl border border-[#EBD9C8]">
                  <h3 className="font-serif font-bold text-lg text-[#2B170B]">Eligibility Rules</h3>
                  <ul className="text-xs text-[#7D5A44] space-y-2.5 list-disc pl-4 leading-relaxed">
                    <li>Exclusively open to first-time customers and new accounts.</li>
                    <li>Genuine server-auditable randomized draw.</li>
                    <li>Vouchers apply automatically on checkout with zero minimum order.</li>
                    <li>One demo entry permitted per verified mobile number.</li>
                  </ul>

                  {drawResult && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#EBD9C8] to-[#F5EBE1] border border-[#C87D32] animate-slide-up space-y-2">
                      <div className="flex items-center gap-2 text-[#588157]">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-bold text-sm text-[#2B170B]">You've Won!</span>
                      </div>
                      <p className="text-xs text-[#432514]">
                        Prize: <span className="font-bold text-sm text-[#2B170B]">{drawResult.text}</span>
                      </p>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-[#C87D32]/40">
                        <span className="font-mono font-bold text-xs text-[#C87D32]">{drawResult.code}</span>
                        <button
                          onClick={() => {
                            setCouponCode(drawResult.code);
                            setAppliedCoupon({ code: drawResult.code, val: 15, type: 'percent' });
                            showToast(`Coupon ${drawResult.code} applied to your cart!`);
                          }}
                          className="text-[11px] font-semibold text-[#432514] underline hover:text-[#C87D32]"
                        >
                          Apply Code
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // Notice shown if old user attempts to view tasting draw
            <div className="bg-white rounded-3xl border border-[#EBD9C8] p-10 text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#C87D32]/10 text-[#C87D32] flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#2B170B]">Tasting Already Claimed!</h3>
              <p className="text-xs text-[#7D5A44] leading-relaxed">
                The Free Tasting Box is an exclusive welcome demo reserved for new accounts. As an established patron, your account enjoys permanent <strong>Returning Customer Offers</strong> and VIP points!
              </p>
              <button
                onClick={() => setCurrentView('offers')}
                className="px-6 py-2.5 rounded-full bg-[#C87D32] text-white text-xs font-bold hover:bg-[#b56e29] transition"
              >
                Go to VIP Offers &rarr;
              </button>
            </div>
          )}
        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEW: OFFERS & VIP DEALS (EXCLUSIVELY FOR OLD / RETURNING CUSTOMERS)       */}
      {/* ========================================================================= */}
      {currentView === 'offers' && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="border-b border-[#EBD9C8] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-[#C87D32] flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-500" /> Returning Patron Exclusive Lounge
              </span>
              <h2 className="text-3xl font-serif font-black text-[#2B170B] mt-1">
                Special Offers &amp; VIP Perks
              </h2>
              <p className="text-xs text-[#7D5A44] mt-1">
                Thank you for being part of the BrewNest family! These discounts are reserved solely for returning customers.
              </p>
            </div>

            <div className="bg-white px-5 py-3 rounded-2xl border border-[#EBD9C8] shadow-sm flex items-center gap-4">
              <div>
                <span className="text-[10px] text-[#9C7A65] uppercase font-bold">VIP Points Available</span>
                <p className="text-xl font-serif font-bold text-[#2B170B]">{user.vipPoints} Bean Points</p>
              </div>
              <button
                onClick={() => {
                  setAppliedCoupon({ code: 'BEANSREDEEM', val: 100, type: 'fixed' });
                  showToast('Redeemed 200 Bean Points for ₹100 instant discount!');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#432514] text-white text-xs font-bold hover:bg-[#2B170B]"
              >
                Redeem ₹100
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {offers.map((offer, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-[#EBD9C8] p-5 shadow-sm hover:shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C87D32]/10 text-[#C87D32] text-[10px] font-bold">
                      {offer.tag}
                    </span>
                    <Percent className="w-4 h-4 text-[#C87D32]" />
                  </div>
                  <h4 className="font-serif font-bold text-base text-[#2B170B] mt-1">{offer.title}</h4>
                  <p className="text-xs text-[#7D5A44] mt-1 leading-relaxed">{offer.desc}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F5EBE1] flex items-center justify-between">
                  <span className="font-mono font-bold text-xs bg-[#F5EBE1] px-2.5 py-1 rounded text-[#2B170B]">
                    {offer.code}
                  </span>
                  <button
                    onClick={() => {
                      setCouponCode(offer.code);
                      setAppliedCoupon({ code: offer.code, val: offer.val, type: offer.type });
                      showToast(`Applied ${offer.code} to your cart!`);
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#432514] text-white text-xs font-semibold hover:bg-[#2B170B]"
                  >
                    Apply Deal
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Repeat Order Recommendation */}
          <div className="bg-[#F5EBE1] rounded-2xl p-6 border border-[#EBD9C8] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#432514] text-white flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[#DDA15E]" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-[#2B170B]">Quick 1-Click Repeat Order</h4>
                <p className="text-xs text-[#7D5A44]">Re-order your favorite "Arabica Coffee Beans" + "Kashmiri Green Tea" with VIP Refill discount.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setCart([
                  {
                    productId: 'c1',
                    name: 'Arabica Coffee Beans',
                    variant: '1 kg',
                    grind: 'Whole Bean',
                    price: 450,
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=400&q=80'
                  },
                  {
                    productId: 't5',
                    name: 'Kashmiri Organic Green Tea',
                    variant: '500 g',
                    grind: 'Loose Leaf',
                    price: 300,
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=400&q=80'
                  }
                ]);
                setAppliedCoupon({ code: 'REFILL15', val: 15, type: 'percent' });
                setCartDrawerOpen(true);
                showToast('Repeat order restored with 15% VIP refill discount!');
              }}
              className="px-6 py-2.5 rounded-full bg-[#C87D32] text-white text-xs font-bold hover:bg-[#a86524] transition shadow"
            >
              Reorder Favorite &rarr;
            </button>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEWS: SHOP CATALOGS (COFFEE, TEA, SNACKS WITH FILTER SIDEBARS)           */}
      {/* ========================================================================= */}
      {(currentView === 'coffee' || currentView === 'tea' || currentView === 'snacks') && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 pb-4 border-b border-[#EBD9C8] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#9C7A65] mb-1">
                <span onClick={() => setCurrentView('home')} className="hover:underline cursor-pointer">Home</span>
                <span>/</span>
                <span className="capitalize font-semibold text-[#432514]">{currentView}</span>
              </div>
              <h2 className="text-3xl font-serif font-black text-[#2B170B] capitalize">
                {currentView === 'coffee' && 'Coffee Collection (15 Types)'}
                {currentView === 'tea' && 'Estate & Herbal Teas (15 Types)'}
                {currentView === 'snacks' && 'Café Bakery & Snacks (26 Types)'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7D5A44]">Switch:</span>
              <button 
                onClick={() => { setCurrentView('coffee'); setSelectedCategoryFilter('all'); }} 
                className={`px-3 py-1 text-xs rounded-full border ${currentView === 'coffee' ? 'bg-[#432514] text-white' : 'bg-white text-[#432514]'}`}
              >
                Coffee
              </button>
              <button 
                onClick={() => { setCurrentView('tea'); setSelectedCategoryFilter('all'); }} 
                className={`px-3 py-1 text-xs rounded-full border ${currentView === 'tea' ? 'bg-[#588157] text-white' : 'bg-white text-[#432514]'}`}
              >
                Tea
              </button>
              <button 
                onClick={() => { setCurrentView('snacks'); setSelectedCategoryFilter('all'); }} 
                className={`px-3 py-1 text-xs rounded-full border ${currentView === 'snacks' ? 'bg-[#C87D32] text-white' : 'bg-white text-[#432514]'}`}
              >
                Snacks
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filter Sidebar */}
            <div className="space-y-6 bg-white p-5 rounded-2xl border border-[#EBD9C8] h-fit shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5EBE1]">
                <h4 className="font-serif font-bold text-sm text-[#2B170B] flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#C87D32]" />
                  <span>Filter {currentView.toUpperCase()}</span>
                </h4>
                <button
                  onClick={() => {
                    setSelectedCategoryFilter('all');
                    setPriceRange(700);
                    setSearchQuery('');
                  }}
                  className="text-[11px] text-[#C87D32] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#432514] uppercase tracking-wider block mb-2.5">
                  Sub-Category
                </label>
                <div className="space-y-1.5 text-xs text-[#7D5A44]">
                  <button
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${selectedCategoryFilter === 'all' ? 'bg-[#F5EBE1] text-[#2B170B] font-bold' : 'hover:bg-[#FDFBF7]'}`}
                  >
                    All {currentView}
                  </button>

                  {currentView === 'coffee' && (
                    <>
                      {['Arabica', 'Robusta', 'Espresso', 'Flavoured', 'Decaf', 'Coffee Beans', 'Coffee Powder', 'Cold Brew'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategoryFilter(cat)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${selectedCategoryFilter === cat ? 'bg-[#F5EBE1] text-[#2B170B] font-bold' : 'hover:bg-[#FDFBF7]'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </>
                  )}

                  {currentView === 'tea' && (
                    <>
                      {['Green Tea', 'Black Tea', 'Herbal Tea', 'Masala Tea', 'White Tea', 'Oolong Tea', 'Tea Powder'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategoryFilter(cat)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${selectedCategoryFilter === cat ? 'bg-[#F5EBE1] text-[#2B170B] font-bold' : 'hover:bg-[#FDFBF7]'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </>
                  )}

                  {currentView === 'snacks' && (
                    <>
                      {['Cupcakes', 'Cookies', 'Brownies', 'Muffins', 'Donuts', 'Pastries', 'Sandwiches', 'Savouries'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategoryFilter(cat)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition ${selectedCategoryFilter === cat ? 'bg-[#F5EBE1] text-[#2B170B] font-bold' : 'hover:bg-[#FDFBF7]'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#F5EBE1]">
                <div className="flex justify-between text-xs font-semibold text-[#432514] mb-2">
                  <span>Max Price:</span>
                  <span className="text-[#C87D32]">₹{priceRange}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="700"
                  step="20"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="w-full accent-[#C87D32] cursor-pointer"
                />
              </div>
            </div>

            {/* Product Grid */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-[#EBD9C8] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between group"
                  >
                    <div className="relative h-48 bg-[#F5EBE1] overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md text-[#432514] hover:text-red-500 transition shadow"
                      >
                        <Heart
                          className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`}
                        />
                      </button>
                      {product.isBestseller && (
                        <span className="absolute top-3 left-3 bg-[#C87D32] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow">
                          Bestseller
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-[#9C7A65]">
                          <span>{product.subCategory}</span>
                          <div className="flex items-center text-[#C87D32]">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="ml-1 font-semibold text-[#2B170B]">{product.rating}</span>
                          </div>
                        </div>
                        <h4
                          onClick={() => openProductModal(product)}
                          className="font-serif font-bold text-base text-[#2B170B] mt-1 hover:text-[#C87D32] transition cursor-pointer line-clamp-1"
                        >
                          {product.name}
                        </h4>
                        <p className="text-xs text-[#7D5A44] mt-1 line-clamp-2">{product.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#F5EBE1] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#9C7A65]">Starting from</span>
                          <p className="font-bold text-base text-[#2B170B]">₹{product.price}</p>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="px-4 py-2 rounded-full bg-[#432514] text-white text-xs font-semibold hover:bg-[#2B170B] transition flex items-center gap-1.5 shadow-sm active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEW: ORDER SUMMARY / RECEIPT                                             */}
      {/* ========================================================================= */}
      {currentView === 'orders' && (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white rounded-3xl border border-[#EBD9C8] p-6 sm:p-10 shadow-lg text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#588157]/15 text-[#588157] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-serif font-black text-[#2B170B]">Order Placed Successfully!</h2>
              <p className="text-sm text-[#7D5A44]">Thank you for your order. We are preparing your fresh brew.</p>
              <p className="text-base font-bold text-[#C87D32] pt-2">Order ID: {lastPlacedOrder.id}</p>
            </div>

            <div className="text-left bg-[#FDFBF7] p-5 rounded-2xl border border-[#EBD9C8] space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#EBD9C8] text-[#9C7A65]">
                <span><strong>From:</strong> BrewNest &lt;orders@brewnest.com&gt;</span>
                <span>{lastPlacedOrder.date}</span>
              </div>
              <p className="text-[#432514]">
                Hi {user.name || 'Priya'},<br />
                Your order is confirmed and routed to our roasting hub!
              </p>

              <div className="space-y-2 py-2">
                <p className="font-bold text-[#2B170B]">Items Ordered:</p>
                {lastPlacedOrder.items.length > 0 ? (
                  lastPlacedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[#432514]">
                      <span>{idx + 1}. {item.name} ({item.variant}) &times; {item.quantity}</span>
                      <span className="font-semibold">₹{item.price * item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-[#432514]">
                    <span>1. Arabica Coffee Beans (1 kg) &times; 1</span>
                    <span className="font-semibold">₹450</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#EBD9C8] flex justify-between font-bold text-sm text-[#2B170B]">
                <span>Total Paid:</span>
                <span className="text-[#C87D32]">₹{lastPlacedOrder.total}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setCurrentView('home')}
                className="px-8 py-3 rounded-full bg-[#432514] text-white text-xs font-bold hover:bg-[#2B170B] transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEW: ADMIN DASHBOARD                                                     */}
      {/* ========================================================================= */}
      {currentView === 'admin' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#EBD9C8]">
            <div>
              <span className="text-xs uppercase font-bold text-[#C87D32]">Store Owner Portal</span>
              <h2 className="text-3xl font-serif font-black text-[#2B170B]">BrewNest Admin Dashboard</h2>
            </div>
            <button
              onClick={() => setCurrentView('home')}
              className="px-4 py-2 rounded-full border border-[#432514] text-[#432514] text-xs font-semibold hover:bg-[#432514] hover:text-white transition"
            >
              Exit to Storefront
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-[#EBD9C8] shadow-sm">
              <span className="text-xs text-[#9C7A65]">Today's Revenue</span>
              <h4 className="text-2xl font-bold font-serif text-[#2B170B] mt-1">₹42,850</h4>
              <p className="text-[11px] text-[#588157] mt-1 font-semibold">+18.4% vs last week</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#EBD9C8] shadow-sm">
              <span className="text-xs text-[#9C7A65]">User Segments</span>
              <h4 className="text-2xl font-bold font-serif text-[#2B170B] mt-1">68% Returning</h4>
              <p className="text-[11px] text-[#C87D32] mt-1 font-semibold">32% New Demo Trials</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#EBD9C8] shadow-sm">
              <span className="text-xs text-[#9C7A65]">Total Active Products</span>
              <h4 className="text-2xl font-bold font-serif text-[#2B170B] mt-1">56 Items</h4>
              <p className="text-[11px] text-[#7D5A44] mt-1">15 Coffee, 15 Tea, 26 Snacks</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-[#EBD9C8] shadow-sm">
              <span className="text-xs text-[#9C7A65]">Active Promotions</span>
              <h4 className="text-2xl font-bold font-serif text-[#588157] mt-1">5 Active</h4>
              <p className="text-[11px] text-[#7D5A44] mt-1">1 Free Tasting, 4 VIP Deals</p>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUTHENTICATION (LOGIN & REGISTRATION WITH REALISTIC OTP)           */}
      {/* ========================================================================= */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#EBD9C8] w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[#F5EBE1] text-[#9C7A65]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-6">
              <BrewNestLogo showTagline={false} />
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-center space-y-1 mb-4">
                  <h3 className="text-2xl font-serif font-black text-[#2B170B]">Login to BrewNest</h3>
                  <p className="text-xs text-[#7D5A44]">Enter your credentials to access your personalized café perks.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#432514] mb-1">Email or Username</label>
                  <input
                    type="text"
                    required
                    placeholder="priya@example.com (or enter 'new@user' for demo)"
                    value={authFormData.email}
                    onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                    className="w-full bg-[#F5EBE1]/50 border border-[#EBD9C8] rounded-xl px-3.5 py-2.5 text-xs text-[#2B170B] focus:outline-none focus:ring-2 focus:ring-[#C87D32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#432514] mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter password"
                      value={authFormData.password}
                      onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                      className="w-full bg-[#F5EBE1]/50 border border-[#EBD9C8] rounded-xl px-3.5 py-2.5 text-xs text-[#2B170B] focus:outline-none focus:ring-2 focus:ring-[#C87D32]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#9C7A65]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#432514] text-white text-xs font-bold hover:bg-[#2B170B] transition shadow-md"
                >
                  Login
                </button>

                <div className="text-center pt-2 text-xs text-[#7D5A44]">
                  New to BrewNest?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="font-bold text-[#C87D32] hover:underline ml-1"
                  >
                    Sign Up for Free Tasting Box
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndRegister} className="space-y-3.5">
                <div className="text-center space-y-1 mb-3">
                  <h3 className="text-2xl font-serif font-black text-[#2B170B]">Create New Account</h3>
                  <p className="text-xs text-[#588157] font-semibold">Eligible for Free Tasting Box Promotion!</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#432514] mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={authFormData.username}
                    onChange={(e) => setAuthFormData({ ...authFormData, username: e.target.value })}
                    className="w-full bg-[#F5EBE1]/50 border border-[#EBD9C8] rounded-xl px-3 py-2 text-xs text-[#2B170B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#432514] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="priya@example.com"
                    value={authFormData.email}
                    onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                    className="w-full bg-[#F5EBE1]/50 border border-[#EBD9C8] rounded-xl px-3 py-2 text-xs text-[#2B170B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#432514] mb-1">Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 rounded-xl bg-[#F5EBE1] border border-[#EBD9C8] text-xs font-bold text-[#432514]">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      value={authFormData.phone}
                      onChange={(e) => setAuthFormData({ ...authFormData, phone: e.target.value })}
                      className="flex-1 bg-[#F5EBE1]/50 border border-[#EBD9C8] rounded-xl px-3 py-2 text-xs text-[#2B170B]"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpTimer > 0}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-[#432514] text-white whitespace-nowrap"
                    >
                      {otpTimer > 0 ? `${otpTimer}s` : 'Send OTP'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#432514] mb-1">Enter OTP (Dev: 824916)</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="824916"
                    value={authFormData.otp}
                    onChange={(e) => setAuthFormData({ ...authFormData, otp: e.target.value })}
                    className="w-full bg-[#F5EBE1]/50 border border-[#EBD9C8] rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-[#2B170B]"
                  />
                </div>

                <div className="flex items-start text-[11px] text-[#7D5A44] pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    checked={authFormData.agreedTerms}
                    onChange={(e) => setAuthFormData({ ...authFormData, agreedTerms: e.target.checked })}
                    className="mt-0.5 mr-2 accent-[#588157]"
                  />
                  <label htmlFor="terms">I agree to the Terms &amp; Tasting Promotion Rules.</label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#588157] text-white text-xs font-bold hover:bg-[#3A5A40] transition shadow-md"
                >
                  Verify &amp; Unlock Free Demo
                </button>

                <div className="text-center pt-1 text-xs text-[#7D5A44]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="font-bold text-[#C87D32] hover:underline ml-1"
                  >
                    Log In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: USER PROFILE (FIG 4)                                              */}
      {/* ========================================================================= */}
      {profileDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setProfileDrawerOpen(false)}
          ></div>
          <div className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col border-l border-[#EBD9C8] animate-slide-left">
            <div className="p-4 border-b border-[#EBD9C8] flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-[#2B170B]">Customer Account</span>
              <button
                onClick={() => setProfileDrawerOpen(false)}
                className="p-1 rounded-full hover:bg-[#F5EBE1] text-[#9C7A65]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="p-6 text-center border-b border-[#F5EBE1] bg-[#FDFBF7]">
              <div className="relative inline-block">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-[#C87D32] shadow-md mx-auto"
                />
                <button 
                  onClick={openAvatarEditor}
                  className="absolute bottom-0 right-0 bg-[#432514] text-white p-2 rounded-full border-2 border-white hover:bg-[#2B170B] shadow-md transition active:scale-95"
                  title="Change Profile Picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 className="font-serif font-bold text-lg text-[#2B170B] mt-3">{user.name}</h3>
              <p className="text-xs text-[#9C7A65]">{user.email}</p>
              
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F5EBE1] text-[#432514]">
                {user.isNewUser ? '🌱 New Member (Demo Active)' : `👑 VIP Patron (${user.vipPoints} Bean Points)`}
              </div>

              <div className="mt-3 flex items-center justify-center gap-3">
                <button 
                  onClick={openAvatarEditor}
                  className="px-3 py-1 rounded-full bg-[#C87D32] text-white text-[11px] font-semibold hover:bg-[#a86524] transition flex items-center gap-1 shadow-sm"
                >
                  <Camera className="w-3 h-3" />
                  <span>Change Photo</span>
                </button>
              </div>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-medium text-[#432514]">
              <button
                onClick={() => {
                  setProfileDrawerOpen(false);
                  setCurrentView('orders');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F5EBE1] transition text-left"
              >
                <Package className="w-4 h-4 text-[#C87D32]" />
                <span>My Orders</span>
              </button>

              {user.isNewUser ? (
                <button
                  onClick={() => {
                    setProfileDrawerOpen(false);
                    setCurrentView('draw');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F5EBE1] transition text-left text-[#588157] font-bold"
                >
                  <Sparkles className="w-4 h-4 text-[#588157]" />
                  <span>Free Tasting Demo Lottery</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setProfileDrawerOpen(false);
                    setCurrentView('offers');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F5EBE1] transition text-left text-[#C87D32] font-bold"
                >
                  <Tag className="w-4 h-4 text-[#C87D32]" />
                  <span>VIP Patron Offers ({offers.length})</span>
                </button>
              )}

              <button
                onClick={() => {
                  alert(`Saved Delivery Address:\n${user.address}`);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F5EBE1] transition text-left"
              >
                <MapPin className="w-4 h-4 text-[#588157]" />
                <span>Saved Addresses</span>
              </button>
            </div>

            <div className="p-4 border-t border-[#EBD9C8]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROFILE PICTURE & AVATAR EDITOR (100% WORKING)                     */}
      {/* ========================================================================= */}
      {avatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#EBD9C8] w-full max-w-lg p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setAvatarModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[#F5EBE1] text-[#9C7A65]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 mb-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C87D32]">Personalize Account</span>
              <h3 className="text-2xl font-serif font-black text-[#2B170B]">Edit Profile Picture</h3>
              <p className="text-xs text-[#7D5A44]">Upload from your device, choose a barista preset, or paste an image link.</p>
            </div>

            {/* Live Preview */}
            <div className="flex flex-col items-center justify-center py-3 bg-[#FDFBF7] rounded-2xl border border-[#EBD9C8] mb-5">
              <div className="relative">
                <img
                  src={avatarPreviewUrl}
                  alt="Avatar Preview"
                  className="w-28 h-28 rounded-full object-cover border-4 border-[#C87D32] shadow-lg"
                  onError={() => {
                    setAvatarPreviewUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80');
                    showToast('Invalid image source. Restored default preview.', 'error');
                  }}
                />
                <span className="absolute bottom-1 right-1 bg-[#588157] text-white p-1 rounded-full border-2 border-white">
                  <Check className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xs text-[#9C7A65] mt-2 font-medium">Live Avatar Preview</p>
            </div>

            {/* Option 1: File Upload */}
            <div className="space-y-3 mb-5">
              <label className="block text-xs font-bold text-[#432514]">
                1. Upload Photo from Device
              </label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleLocalImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-[#C87D32]/50 bg-[#F5EBE1]/40 hover:bg-[#F5EBE1] text-[#432514] text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#C87D32]" />
                <span>Choose Local Photo (PNG, JPG, WebP)</span>
              </button>
            </div>

            {/* Option 2: Image URL */}
            <div className="space-y-2 mb-5">
              <label className="block text-xs font-bold text-[#432514]">
                2. Or Paste Image Web Address (URL)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="w-full bg-[#F5EBE1]/50 border border-[#EBD9C8] rounded-xl px-3 py-2 text-xs text-[#2B170B]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!customAvatarUrl.trim()) {
                      showToast('Please paste a URL first', 'error');
                      return;
                    }
                    setAvatarPreviewUrl(customAvatarUrl.trim());
                    showToast('URL preview loaded!');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#432514] text-white text-xs font-bold"
                >
                  Preview
                </button>
              </div>
            </div>

            {/* Option 3: Presets */}
            <div className="space-y-2 mb-6">
              <label className="block text-xs font-bold text-[#432514]">
                3. Or Select from Barista Presets
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {PRESET_AVATARS.map((preset, index) => {
                  const isSelected = avatarPreviewUrl === preset.url;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setAvatarPreviewUrl(preset.url);
                        showToast(`Selected ${preset.label}`);
                      }}
                      className={`relative rounded-xl overflow-hidden p-1 transition border-2 flex flex-col items-center ${
                        isSelected ? 'border-[#C87D32] bg-[#F5EBE1] shadow-md scale-105' : 'border-transparent hover:border-[#EBD9C8]'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span className="text-[9px] text-[#432514] font-medium mt-1 truncate w-full text-center">
                        {preset.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-[#EBD9C8]">
              <button
                type="button"
                onClick={() => setAvatarModalOpen(false)}
                className="flex-1 py-2.5 rounded-full border border-[#432514] text-[#432514] text-xs font-bold hover:bg-[#F5EBE1]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAvatar}
                className="flex-1 py-2.5 rounded-full bg-[#432514] text-white text-xs font-bold hover:bg-[#2B170B] transition shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#A3B18A]" />
                <span>Save Profile Picture</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: BASKET & CHECKOUT                                                 */}
      {/* ========================================================================= */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartDrawerOpen(false)}
          ></div>
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col border-l border-[#EBD9C8] animate-slide-left">
            <div className="p-4 border-b border-[#EBD9C8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#432514]" />
                <h3 className="font-serif font-bold text-base text-[#2B170B]">
                  Your Basket ({cart.reduce((t, i) => t + i.quantity, 0)})
                </h3>
              </div>
              <button onClick={() => setCartDrawerOpen(false)} className="p-1.5 rounded-full hover:bg-[#F5EBE1]">
                <X className="w-5 h-5 text-[#9C7A65]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-[#EBD9C8] bg-[#FDFBF7]"
                >
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-serif font-bold text-xs text-[#2B170B] truncate">{item.name}</h4>
                    <p className="text-[10px] text-[#9C7A65]">{item.variant} {item.grind ? `• ${item.grind}` : ''}</p>
                    <p className="text-xs font-bold text-[#C87D32] mt-1">₹{item.price}</p>
                  </div>

                  <div className="flex items-center border border-[#EBD9C8] rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={() => updateCartQuantity(index, -1)}
                      className="px-2 py-1 text-xs text-[#432514] hover:bg-[#F5EBE1]"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(index, 1)}
                      className="px-2 py-1 text-xs text-[#432514] hover:bg-[#F5EBE1]"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeCartItem(index)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#EBD9C8] bg-[#FDFBF7] space-y-2">
              <div className="flex justify-between text-xs text-[#7D5A44]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#2B170B]">₹{cartSubtotal}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-xs text-[#588157]">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-serif font-bold text-[#2B170B] pt-2 border-t border-[#EBD9C8]">
                <span>Final Total</span>
                <span className="text-[#C87D32]">₹{cartTotal}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full mt-2 py-3.5 rounded-full bg-[#432514] hover:bg-[#2B170B] text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2"
              >
                <span>Confirm Order (₹{cartTotal})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRODUCT DETAILS (FIG 9)                                             */}
      {/* ========================================================================= */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#EBD9C8] w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 backdrop-blur-md text-[#432514]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-full bg-[#F5EBE1]">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 md:p-8 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase font-bold text-[#C87D32] tracking-wider">
                    {selectedProduct.category.toUpperCase()} &bull; {selectedProduct.subCategory}
                  </span>
                  <h3 className="text-2xl font-serif font-black text-[#2B170B] mt-1">{selectedProduct.name}</h3>
                  <p className="text-base font-bold text-[#2B170B] mt-1">₹{selectedProduct.price} / base</p>
                  <p className="text-xs text-[#7D5A44] mt-2 leading-relaxed">{selectedProduct.description}</p>

                  {selectedProduct.variants && (
                    <div className="mt-4">
                      <label className="block text-xs font-bold text-[#432514] mb-1.5">Select Weight / Pack:</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.variants.map((v) => (
                          <button
                            key={v}
                            onClick={() => setModalVariant(v)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              modalVariant === v
                                ? 'bg-[#432514] text-white shadow'
                                : 'bg-[#F5EBE1] text-[#432514]'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#F5EBE1] flex items-center gap-3">
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct, modalVariant, modalGrind, modalQuantity);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 py-3 rounded-full bg-[#432514] text-white text-xs font-bold hover:bg-[#2B170B] transition flex items-center justify-center gap-2 shadow"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Basket</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CAFÉ FOOTER --- */}
      <footer className="bg-[#24140B] text-[#EBD9C8] border-t border-[#3A2012] pt-14 pb-8 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          <div className="space-y-3">
            <BrewNestLogo light={true} />
            <p className="text-xs text-[#EBD9C8]/70 leading-relaxed font-light">
              Artisan coffee roastery and tea house dedicated to ethically-sourced single-origin beans, Darjeeling flushes, and oven-baked pastries.
            </p>
          </div>

          <div>
            <h5 className="font-serif font-bold text-sm text-white mb-3">Shop Collections</h5>
            <ul className="text-xs space-y-2 text-[#EBD9C8]/80">
              <li onClick={() => { setCurrentView('coffee'); }} className="hover:text-[#DDA15E] cursor-pointer">Arabica &amp; Robusta Beans</li>
              <li onClick={() => { setCurrentView('tea'); }} className="hover:text-[#DDA15E] cursor-pointer">Assam, Darjeeling &amp; Chai</li>
              <li onClick={() => { setCurrentView('snacks'); }} className="hover:text-[#DDA15E] cursor-pointer">Fresh Muffins &amp; Biscotti</li>
            </ul>
          </div>

          <div>
            <h5 className="font-serif font-bold text-sm text-white mb-3">Customer Care</h5>
            <ul className="text-xs space-y-2 text-[#EBD9C8]/80">
              <li onClick={() => setCurrentView(user.isNewUser ? 'draw' : 'offers')} className="hover:text-[#DDA15E] cursor-pointer">
                {user.isNewUser ? 'Free Tasting Draw Rules' : 'VIP Returning Offers'}
              </li>
              <li onClick={() => setCurrentView('orders')} className="hover:text-[#DDA15E] cursor-pointer">Order Tracking &amp; Invoices</li>
            </ul>
          </div>

          <div>
            <h5 className="font-serif font-bold text-sm text-white mb-3">BrewNest Roastery</h5>
            <p className="text-xs text-[#EBD9C8]/70 leading-relaxed">
              142 Plantation Way, Indiranagar, Bengaluru, KA 560038
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#EBD9C8]/60 gap-4">
          <p>&copy; 2026 BrewNest — For Coffee and Tea Lovers. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white cursor-pointer" onClick={() => setCurrentView('admin')}>Owner Dashboard</span>
            <span>&bull;</span>
            <span className="font-semibold text-[#DDA15E]">
              Current Mode: {user.isNewUser ? 'New User (Free Demo)' : 'Returning VIP (Offers Only)'}
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}