import React, { useState, useEffect, useRef } from 'react';
import { 
  Diamond, 
  ShieldCheck, 
  FileText, 
  CreditCard, 
  Gavel, 
  ShoppingBag, 
  Users, 
  Plus, 
  LogOut, 
  CheckCircle, 
  Clock, 
  Upload,
  ChevronRight,
  User as UserIcon,
  MapPin,
  Mail,
  Lock,
  Signature,
  Globe,
  TrendingUp,
  History,
  Award,
  Download,
  Eye,
  AlertCircle,
  Check,
  Bell,
  FileDown,
  ExternalLink,
  Send,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from "jspdf";
import { User, UserRole, UserStatus, Masterpiece, Auction, Payment, Contract, Certificate, Bid, Notification, PurchaseWorkflow, EscrowTransaction, InvestorAnalytics, InvestorRequest } from './types';

// --- Constants ---
const COMPANY_INFO = {
  name: "Antonio Bellanova Vault",
  owner: "Antonio Bellanova",
  address: "Aaronstraße 8, 50076, Köln, Deutschland",
  iban: "DE12 3456 7890 1234 5678 90"
};

const LANGUAGES = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italiano' }
];

const TRANSLATIONS: any = {
  de: {
    dashboard: "Dashboard",
    marketplace: "Marktplatz",
    auctions: "Auktionen",
    vault: "Der Tresor",
    management: "Verwaltung",
    welcome: "Willkommen im Atelier",
    my_assets: "Meine Schätze",
    certificates: "Zertifikate",
    active_bids: "Aktive Gebote",
    membership: "Mitgliedschaftsstatus",
    featured: "Ausgewählte Meisterwerke",
    request_acquisition: "Erwerb anfragen",
    reserved: "Reserviert",
    sold: "Verkauft",
    resale_pending: "Wiederverkauf ausstehend",
    sign_out: "Abmelden",
    my_pieces: "Meine Stücke",
    contracts: "Verträge",
    payments: "Zahlungen",
    my_bids: "Meine Gebote",
    resale: "Wiederverkauf",
    vip: "VIP",
    view: "Ansehen",
    sign_digitally: "Digital unterzeichnen",
    signed_on: "Unterzeichnet am",
    list_resale: "Zum Wiederverkauf anbieten",
    resale_pending_approval: "Wiederverkauf wartet auf Genehmigung",
    deposit: "Anzahlung",
    full_payment: "Vollständige Zahlung",
    issued: "Ausgestellt",
    cert_details: "Details zum Zertifikat",
    blockchain_hash: "Blockchain-Hash",
    digital_signature: "Digitale Signatur",
    scan_verify: "Scannen zur Echtheitsprüfung auf der Blockchain",
    download_pdf: "Offizielles PDF herunterladen",
    view_details: "Details ansehen",
    materials: "Materialien",
    gemstones: "Edelsteine",
    rarity: "Seltenheit",
    description: "Beschreibung",
    close: "Schließen",
    legal_notice: "Durch Fortfahren müssen Sie die vertraglichen Dokumente zu diesem Stück prüfen und unterzeichnen.",
    sign_contract: "Vertrag unterzeichnen",
    typed_signature: "Getippte Unterschrift",
    draw_signature: "Gezeichnete Unterschrift",
    email_verification: "E-Mail-Verifizierung",
    confirm_review: "Ich habe alle Dokumente gelesen und verstanden.",
    signature_required: "Unterschrift erforderlich",
    clear: "Löschen",
    verify: "Verifizieren",
    ownership_pending: "Eigentumsübertragung ausstehend",
    ownership_transferred: "Eigentum übertragen",
    payment_unlocked: "Zahlung freigeschaltet",
    waiting_signature: "Wartet auf Unterschrift",
    payment_available: "Zahlung verfügbar",
    piece_reserved: "Stück reserviert",
    payment_pending: "Zahlung ausstehend",
    completed: "Abgeschlossen"
  },
  en: {
    dashboard: "Dashboard",
    marketplace: "Marketplace",
    auctions: "Auctions",
    vault: "The Vault",
    management: "Management",
    welcome: "Welcome to the Atelier",
    my_assets: "My Assets",
    certificates: "Certificates",
    active_bids: "Active Bids",
    membership: "Membership Status",
    featured: "Featured Masterpieces",
    request_acquisition: "Request Acquisition",
    reserved: "Reserved",
    sold: "Sold",
    resale_pending: "Resale Pending",
    sign_out: "Sign Out",
    view_details: "View Details",
    materials: "Materials",
    gemstones: "Gemstones",
    rarity: "Rarity",
    description: "Description",
    close: "Close",
    legal_notice: "By proceeding, you must review and sign the contractual documents related to this piece.",
    sign_contract: "Sign Contract",
    typed_signature: "Typed Signature",
    draw_signature: "Draw Signature",
    email_verification: "Email Verification",
    confirm_review: "I have reviewed and understood all documents.",
    signature_required: "Signature Required",
    clear: "Clear",
    verify: "Verify",
    ownership_pending: "Ownership Pending",
    ownership_transferred: "Ownership Transferred",
    payment_unlocked: "Payment Unlocked",
    waiting_signature: "Waiting Signature",
    payment_available: "Payment Available",
    piece_reserved: "Piece Reserved",
    payment_pending: "Payment Pending",
    completed: "Completed"
  },
  it: {
    dashboard: "Dashboard",
    marketplace: "Mercato",
    auctions: "Aste",
    vault: "Il Caveau",
    management: "Gestione",
    welcome: "Benvenuti nell'Atelier",
    my_assets: "I Miei Beni",
    certificates: "Certificati",
    active_bids: "Offerte Attive",
    membership: "Stato Membro",
    featured: "Capolavori in Primo Piano",
    request_acquisition: "Richiedi Acquisizione",
    reserved: "Riservato",
    sold: "Venduto",
    resale_pending: "Rivendita in Sospeso",
    sign_out: "Disconnetti"
  }
};

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }: any) => {
  const base = "px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700",
    outline: "bg-transparent border border-amber-600/50 text-amber-500 hover:bg-amber-600/10",
    ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
    danger: "bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20"
  };
  return (
    <button disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Input = ({ label, type = 'text', value, onChange, placeholder, icon: Icon, className = '' }: any) => (
  <div className={`space-y-1.5 w-full ${className}`}>
    {label && <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">{label}</label>}
    <div className="relative">
      {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 ${Icon ? 'pl-12' : 'px-4'} pr-4 text-zinc-200 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20 transition-all`}
      />
    </div>
  </div>
);

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: any) => {
  const variants: any = {
    default: "bg-zinc-800 text-zinc-400",
    amber: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    red: "bg-red-500/10 text-red-500 border border-red-500/20"
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold ${variants[variant]}`}>
      {children}
    </span>
  );
};

const SignaturePad = ({ onSave, onClear }: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas.toDataURL());
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    onClear();
  };

  return (
    <div className="space-y-4">
      <div className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[200px]"
        />
      </div>
      <button onClick={clear} className="text-xs text-zinc-500 hover:text-amber-500 transition-colors uppercase tracking-widest font-bold">Clear Signature</button>
    </div>
  );
};

const SignatureModal = ({ contract, onClose, onSign, t }: any) => {
  const [method, setMethod] = useState<'typed' | 'drawn' | 'email'>('typed');
  const [typedName, setTypedName] = useState('');
  const [drawnData, setDrawnData] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSign = () => {
    const data = method === 'typed' ? typedName : method === 'drawn' ? drawnData : 'verified-email';
    onSign(contract.id, method, data);
  };

  const canSign = hasReviewed && (
    (method === 'typed' && typedName.length > 2) ||
    (method === 'drawn' && drawnData.length > 100) ||
    (method === 'email' && emailVerified)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-2xl font-serif italic text-white">{t('signature_required')}</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">{contract.doc_ref}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Plus className="w-6 h-6 text-zinc-500 rotate-45" />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
            <div className="flex gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl h-fit">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-2">
                <p className="text-zinc-200 text-sm leading-relaxed">{t('legal_notice')}</p>
                <label className="flex items-center gap-3 cursor-pointer group pt-2">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${hasReviewed ? 'bg-amber-600 border-amber-600' : 'border-zinc-700 group-hover:border-amber-600/50'}`}>
                    {hasReviewed && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={hasReviewed} onChange={(e) => setHasReviewed(e.target.checked)} />
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors uppercase tracking-widest font-semibold">{t('confirm_review')}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              {(['typed', 'drawn', 'email'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all ${method === m ? 'bg-zinc-800 text-amber-500 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {t(`${m}_signature`)}
                </button>
              ))}
            </div>

            <div className="min-h-[240px] flex flex-col justify-center">
              {method === 'typed' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <Input 
                    label="Full Legal Name" 
                    placeholder="Enter your name as it appears on your ID" 
                    value={typedName} 
                    onChange={(e: any) => setTypedName(e.target.value)}
                  />
                  <div className="p-6 border border-zinc-800 border-dashed rounded-2xl text-center">
                    <p className="font-serif italic text-3xl text-zinc-400 opacity-50 select-none">{typedName || 'Your Signature'}</p>
                  </div>
                </div>
              )}

              {method === 'drawn' && (
                <div className="animate-in fade-in slide-in-from-bottom-2">
                  <SignaturePad onSave={setDrawnData} onClear={() => setDrawnData('')} />
                </div>
              )}

              {method === 'email' && (
                <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
                    <Mail className="w-12 h-12 text-amber-500 mx-auto opacity-50" />
                    <p className="text-zinc-400 text-sm">A verification code will be sent to your registered email address.</p>
                    <Button 
                      variant="outline" 
                      className="mx-auto" 
                      disabled={isVerifying}
                      onClick={() => {
                        setIsVerifying(true);
                        setTimeout(() => {
                          setIsVerifying(false);
                          setEmailVerified(true);
                        }, 1500);
                      }}
                    >
                      {isVerifying ? 'Sending...' : emailVerified ? 'Verified' : 'Send Verification Code'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 bg-zinc-950 border-t border-zinc-800 flex gap-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          <Button 
            variant="primary" 
            disabled={!canSign} 
            onClick={handleSign}
            className="flex-[2]"
          >
            <Signature className="w-4 h-4" />
            {t('sign_digitally')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard' | 'marketplace' | 'auctions' | 'vault' | 'admin' | 'portfolio' | 'investor'>('login');
  const [vaultTab, setVaultTab] = useState<'pieces' | 'certs' | 'contracts' | 'payments' | 'auctions' | 'resale' | 'vip' | 'investor_insights' | 'dataroom'>('pieces');
  const [loading, setLoading] = useState(false);
  const [masterpieces, setMasterpieces] = useState<Masterpiece[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [vaultData, setVaultData] = useState<{ pieces: Masterpiece[], certs: Certificate[], contracts: Contract[] }>({ pieces: [], certs: [], contracts: [] });
  const [payments, setPayments] = useState<Payment[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminContracts, setAdminContracts] = useState<any[]>([]);
  const [language, setLanguage] = useState('de');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Masterpiece | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [workflows, setWorkflows] = useState<Record<number, PurchaseWorkflow>>({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [contractToSign, setContractToSign] = useState<Contract | null>(null);
  const [investorAnalytics, setInvestorAnalytics] = useState<InvestorAnalytics | null>(null);
  const [investorRequests, setInvestorRequests] = useState<InvestorRequest[]>([]);
  const [adminInvestorRequests, setAdminInvestorRequests] = useState<any[]>([]);

  const handleGenerateCertificate = async (masterpieceId: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterpieceId, adminId: user.id })
      });
      if (res.ok) {
        alert("Certificate of Authenticity generated and stored in the user's vault.");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to generate certificate");
      }
    } finally {
      setLoading(false);
    }
  };

  const t = (key: string) => TRANSLATIONS[language]?.[key] || key;

  // Forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [wantsVip, setWantsVip] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CLIENT);

  // Admin Forms
  const [newPiece, setNewPiece] = useState({ 
    title: '', 
    serial_id: '', 
    category: 'Jewelry',
    description: '', 
    materials: '', 
    gemstones: '', 
    valuation: '', 
    rarity: 'Unique', 
    production_time: '4-6 Weeks',
    cert_data: '',
    deposit_pct: '50', 
    image: '' 
  });
  const [newAuction, setNewAuction] = useState({
    masterpieceId: '', startPrice: '', endTime: '', vipOnly: false
  });
  const [assignPiece, setAssignPiece] = useState({
    userId: '', masterpieceId: ''
  });
  const [newClient, setNewClient] = useState({ name: '', email: '', address: '', role: 'client', isVip: false });

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
      setupWebSocket();
      // Expose handleGenerateCertificate to window for the child component
      (window as any).handleGenerateCertificate = handleGenerateCertificate;
    }
    return () => ws.current?.close();
  }, [user]);

  const setupWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${protocol}//${window.location.host}`);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS Message:", data);
      
      if (data.type === 'NEW_BID') {
        setAuctions(prev => prev.map(a => 
          a.id === data.auctionId 
            ? { ...a, current_bid: data.amount, highest_bidder_id: data.userId } 
            : a
        ));
      } else {
        fetchData(); // Refresh on other updates
      }
    };
  };

  const notifyUser = (msg: string, type: 'success' | 'error' = 'success') => {
    alert(msg);
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      const [piecesRes, auctionsRes, vaultRes, payRes, notifRes] = await Promise.all([
        fetch('/api/masterpieces'),
        fetch(`/api/auctions?userId=${user.id}`),
        fetch(`/api/vault/${user.id}`),
        fetch(`/api/payments/${user.id}`),
        fetch(`/api/notifications/${user.id}`)
      ]);

      if (piecesRes.ok) setMasterpieces(await piecesRes.json());
      if (auctionsRes.ok) setAuctions(await auctionsRes.json());
      if (vaultRes.ok) setVaultData(await vaultRes.json());
      if (payRes.ok) setPayments(await payRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());

      if (user.role === UserRole.ADMIN) {
        const [statsRes, usersRes, contractsRes, invReqRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users'),
          fetch('/api/admin/contracts'),
          fetch('/api/admin/investor-requests')
        ]);
        if (statsRes.ok) setAdminStats(await statsRes.json());
        if (usersRes.ok) setAllUsers(await usersRes.json());
        if (contractsRes.ok) setAdminContracts(await contractsRes.json());
        if (invReqRes.ok) setAdminInvestorRequests(await invReqRes.json());
      }

      if (user.role === UserRole.INVESTOR) {
        const [analyticsRes] = await Promise.all([
          fetch('/api/investor/analytics')
        ]);
        if (analyticsRes.ok) setInvestorAnalytics(await analyticsRes.json());
      }
    } catch (e) {
      console.error("Fetch error", e);
    }
  };

  const handleInvestorRequest = async (type: 'allocation' | 'meeting' | 'preview' | 'dataroom', message: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/investor/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, type, message })
      });
      if (res.ok) {
        alert("Request submitted successfully. Our team will contact you shortly.");
      }
    } finally {
      setLoading(false);
    }
  };

  const logInvestorView = async (masterpieceId: number, interestLevel: number = 1) => {
    if (!user || user.role !== UserRole.INVESTOR) return;
    try {
      await fetch('/api/investor/log-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, masterpieceId, interestLevel })
      });
    } catch (e) {
      console.error("Log view error", e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setLanguage(data.language);
        setView('dashboard');
      } else {
        const err = await res.json();
        alert(err.error || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, address, wantsVip, language, role: selectedRole })
      });
      if (res.ok) {
        alert("Registration successful. Please wait for admin approval.");
        setView('login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePiece = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/masterpieces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPiece,
          valuation: parseFloat(newPiece.valuation),
          deposit_pct: parseFloat(newPiece.deposit_pct),
          image_url: newPiece.image
        })
      });
      if (res.ok) {
        alert("Masterpiece created successfully.");
        setNewPiece({ 
          title: '', 
          serial_id: '', 
          category: 'Jewelry',
          description: '', 
          materials: '', 
          gemstones: '', 
          valuation: '', 
          rarity: 'Unique', 
          production_time: '4-6 Weeks',
          cert_data: '',
          deposit_pct: '50', 
          image: '' 
        });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create masterpiece");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuction = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAuction,
          masterpieceId: parseInt(newAuction.masterpieceId),
          startPrice: parseFloat(newAuction.startPrice)
        })
      });
      if (res.ok) {
        alert("Auction created successfully.");
        setNewAuction({ masterpieceId: '', startPrice: '', endTime: '', vipOnly: false });
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPiece = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/assign-piece', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(assignPiece.userId),
          masterpieceId: parseInt(assignPiece.masterpieceId)
        })
      });
      if (res.ok) {
        alert("Stück erfolgreich zugewiesen.");
        setAssignPiece({ userId: '', masterpieceId: '' });
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (pieceId: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, masterpieceId: pieceId })
      });
      if (res.ok) {
        alert("Kaufanfrage gesendet. Warten auf Admin-Genehmigung.");
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePurchase = async (pieceId: number, approve: boolean, adminId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approve-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterpieceId: pieceId, approve, adminId })
      });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkflow = async (pieceId: number, step: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/workflow/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterpieceId: pieceId, step, adminId: user.id })
      });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (title: string, content: string, piece?: Masterpiece) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Soft Ivory Background
    doc.setFillColor(253, 252, 251);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Subtle Watermark
    doc.setFontSize(60);
    doc.setTextColor(245, 245, 245);
    doc.setFont("times", "italic");
    doc.text("ANTONIO BELLANOVA", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });

    // Vertical Brand Typography
    doc.setFontSize(6);
    doc.setTextColor(220, 220, 220);
    doc.setFont("helvetica", "normal");
    doc.text("ANTONIO BELLANOVA ATELIER • PRIVATE VAULT INSTRUMENT", 10, pageHeight / 2, { angle: 90, charSpace: 2 });
    doc.text("EST. 2024 • HAUTE JOAILLERIE • KÖLN • DEUTSCHLAND", pageWidth - 10, pageHeight / 2, { angle: -90, charSpace: 2 });

    // Header Logo
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.setTextColor(197, 160, 89); // Subtle Gold
    doc.text("ANTONIO BELLANOVA", pageWidth / 2, 35, { align: "center", charSpace: 4 });
    
    // Document Title
    doc.setFont("times", "normal");
    doc.setFontSize(38);
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), pageWidth / 2, 60, { align: "center", charSpace: 1 });
    
    // Metadata Block
    doc.setDrawColor(245, 245, 245);
    doc.setLineWidth(0.1);
    doc.line(40, 75, pageWidth - 40, 75);
    doc.line(40, 90, pageWidth - 40, 90);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text("DOCUMENT REF", 45, 80);
    doc.text("CLIENT REF", 85, 80);
    doc.text("VERSION", 125, 80);
    doc.text("DATE", 155, 80);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    const docRef = `REF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    doc.text(docRef, 45, 86);
    doc.text(`CL-${user?.id || '000'}`, 85, 86);
    doc.text("v1.0", 125, 86);
    doc.text(new Date().toLocaleDateString(), 155, 86);

    let currentY = 110;

    if (piece) {
        // Hero Image Placeholder (if we had base64, we'd put it here)
        // For now, we use a refined text block
        doc.setFont("times", "normal");
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        doc.text(piece.title, pageWidth / 2, currentY, { align: "center" });
        
        currentY += 8;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Serial Identification: ${piece.serial_id}`, pageWidth / 2, currentY, { align: "center", charSpace: 1 });
        
        currentY += 20;
        
        // Pricing Block
        doc.setFillColor(250, 250, 250);
        doc.rect(40, currentY, pageWidth - 80, 40, 'F');
        doc.setDrawColor(240, 240, 240);
        doc.rect(40, currentY, pageWidth - 80, 40, 'D');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(197, 160, 89);
        doc.text("ASSET SPECIFICATIONS", 45, currentY + 10);
        doc.text("FINANCIAL VALUATION", pageWidth / 2 + 5, currentY + 10);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(piece.materials, 45, currentY + 18);
        doc.text(piece.gemstones, 45, currentY + 24);
        
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`${Number(piece.valuation).toLocaleString()} EUR`, pageWidth / 2 + 5, currentY + 22);
        
        currentY += 60;
    }

    // Content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    
    const cleanContent = content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .trim();

    const splitText = doc.splitTextToSize(cleanContent, pageWidth - 80);
    doc.text(splitText, 40, currentY, { align: "justify", lineHeightFactor: 1.8 });

    // Signature Area
    const sigY = pageHeight - 50;
    doc.setFont("times", "italic");
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("Antonio Bellanova", 40, sigY);
    
    doc.setDrawColor(197, 160, 89);
    doc.setLineWidth(0.1);
    doc.line(40, sigY + 3, 90, sigY + 3);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text("ATELIER DIRECTOR", 40, sigY + 8, { charSpace: 2 });

    doc.line(pageWidth - 90, sigY + 3, pageWidth - 40, sigY + 3);
    doc.text("CLIENT ENDORSEMENT", pageWidth - 90, sigY + 8, { charSpace: 2 });

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  const handleBid = async (auctionId: number, amount: number) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auctions/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId, userId: user.id, amount })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error);
      }
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (paymentId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clients/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Client added successfully. Access Token: ${data.token}`);
        setNewClient({ name: '', email: '', address: '', role: 'client', isVip: false });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add client");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: number, approve: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approve })
      });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  };

  const [showCeremony, setShowCeremony] = useState<Masterpiece | null>(null);

  const handleSignContract = async (contractId: number, method: string, data: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, method, data })
      });
      if (res.ok) {
        const result = await res.json();
        fetchData();
        setContractToSign(null);
        notifyUser("Agreement executed successfully.", "success");
        
        // Emotional reinforcement for completion
        if (result.status === 'COMPLETED') {
          const piece = masterpieces.find(m => m.id === result.masterpieceId);
          if (piece) setShowCeremony(piece);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReviewContract = async (contractId: number) => {
    try {
      await fetch('/api/contracts/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleListResale = async (masterpieceId: number) => {
    if (!user) return;
    const price = prompt("Enter resale price (€):");
    if (!price) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/resale/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, masterpieceId, price: parseFloat(price) })
      });
      if (res.ok) {
        alert("Resale request submitted for admin approval.");
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveResale = async (masterpieceId: number, approve: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/approve-resale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterpieceId, approve })
      });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleConcierge = async (message: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/vip/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, message })
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.response);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPiece({ ...newPiece, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6 font-sans selection:bg-amber-500/30">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-900/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-900/20 blur-[120px] rounded-full" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md z-10">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mb-4 shadow-xl">
              <Diamond className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-4xl font-serif italic tracking-tight text-white">Antonio Bellanova</h1>
            <p className="text-zinc-500 text-sm uppercase tracking-[0.2em]">Luxury Asset Platform</p>
          </div>

          <Card className="p-8">
            <div className="flex gap-4 mb-8">
              <button onClick={() => setView('login')} className={`flex-1 pb-4 text-sm font-semibold uppercase tracking-widest transition-all border-b-2 ${view === 'login' ? 'border-amber-600 text-amber-500' : 'border-transparent text-zinc-600'}`}>Login</button>
              <button onClick={() => setView('register')} className={`flex-1 pb-4 text-sm font-semibold uppercase tracking-widest transition-all border-b-2 ${view === 'register' ? 'border-amber-600 text-amber-500' : 'border-transparent text-zinc-600'}`}>Register</button>
            </div>

            <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-6">
              {view === 'register' && (
                <>
                  <Input label="Full Name" icon={UserIcon} value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Antonio Bellanova" />
                  <Input label="Address" icon={MapPin} value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder="Aaronstraße 8, 50076, Köln" />
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Access Role</label>
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as UserRole)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                      <option value={UserRole.CLIENT}>Collector (Client)</option>
                      <option value={UserRole.INVESTOR}>Investor</option>
                      <option value={UserRole.VIEWER}>Viewer (Read-only)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Preferred Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              <Input label="Email Address" icon={Mail} type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="name@vault.com" />
              <Input label="Password" icon={Lock} type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />
              
              {view === 'register' && (
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${wantsVip ? 'bg-amber-600 border-amber-600' : 'border-zinc-700 bg-zinc-800'}`}>
                    {wantsVip && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={wantsVip} onChange={() => setWantsVip(!wantsVip)} />
                  <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">Apply for VIP Membership</span>
                </label>
              )}

              <Button disabled={loading} className="w-full mt-4">
                {loading ? "Processing..." : view === 'login' ? "Sign In" : "Create Account"}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-amber-500/30">
      {/* Sidebar */}
      <nav className="fixed left-0 top-0 h-full w-20 md:w-64 bg-zinc-950 border-r border-zinc-900 z-50 flex flex-col">
        <div className="p-6 flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-600/20 flex items-center justify-center">
            <Diamond className="w-5 h-5 text-amber-500" />
          </div>
          <span className="hidden md:block font-serif italic text-lg text-amber-500">Vault</span>
        </div>

        <div className="flex-1 px-4 space-y-2">
          <NavItem active={view === 'dashboard'} icon={TrendingUp} label={t('dashboard')} onClick={() => setView('dashboard')} />
          <NavItem active={view === 'marketplace'} icon={ShoppingBag} label={t('marketplace')} onClick={() => setView('marketplace')} />
          <NavItem active={view === 'auctions'} icon={Gavel} label={t('auctions')} onClick={() => setView('auctions')} />
          <NavItem active={view === 'vault'} icon={ShieldCheck} label={t('vault')} onClick={() => setView('vault')} />
          <NavItem active={view === 'portfolio'} icon={Award} label="Portfolio" onClick={() => setView('portfolio')} />
          {user.role === UserRole.INVESTOR && (
            <NavItem active={view === 'investor'} icon={BarChart3} label="Investor" onClick={() => setView('investor')} />
          )}
          {user.role === UserRole.ADMIN && (
            <NavItem active={view === 'admin'} icon={Users} label={t('management')} onClick={() => setView('admin')} />
          )}
        </div>

        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setUser(null)}>
            <LogOut className="w-5 h-5 text-zinc-500" />
            <span className="hidden md:block text-sm text-zinc-400">{t('sign_out')}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pl-20 md:pl-64 min-h-screen">
        <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-serif italic text-white capitalize">{view}</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-white/5 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-zinc-400" />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border border-zinc-950" />
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-[60] overflow-hidden"
                  >
                    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                      <h4 className="text-xs uppercase tracking-widest font-bold text-zinc-400">Notifications</h4>
                      <button className="text-[10px] text-amber-500 hover:text-amber-400">Mark all as read</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-zinc-800/50 hover:bg-white/5 transition-colors">
                          <p className="text-xs text-zinc-200 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-zinc-500 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-zinc-600 italic text-xs">No notifications</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
              <Globe className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] uppercase font-bold text-zinc-400">{language}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-zinc-200">{user.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-amber-500">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-zinc-400" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 space-y-6">
                    <h3 className="text-3xl font-serif italic">{t('welcome')}, {user.name.split(' ')[0]}</h3>
                    <p className="text-zinc-400">Your portal to the world's most exclusive jewelry and collectible masterpieces. Manage your assets, participate in private auctions, and explore the vault.</p>
                    <div className="grid grid-cols-3 gap-4">
                      <StatCard label={t('my_assets')} value={vaultData.pieces.length} icon={Award} />
                      <StatCard label={t('certificates')} value={vaultData.certs.length} icon={ShieldCheck} />
                      <StatCard label={t('active_bids')} value={auctions.filter(a => a.highest_bidder_id === user.id).length} icon={Gavel} />
                    </div>
                  </Card>
                  <Card className="flex flex-col justify-center items-center text-center space-y-4 border-amber-500/20 bg-amber-500/5">
                    <Award className="w-12 h-12 text-amber-500" />
                    <h4 className="text-xl font-serif italic">{t('membership')}</h4>
                    <Badge variant="amber">{user.role}</Badge>
                    <p className="text-xs text-zinc-500">Member since {new Date(user.created_at).toLocaleDateString()}</p>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm uppercase tracking-widest text-zinc-500 font-bold">{t('featured')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {masterpieces.filter(p => p.status === 'available').slice(0, 3).map(piece => (
                      <PieceCard 
                        key={piece.id} 
                        piece={piece} 
                        onBuy={(user.role === UserRole.VIEWER || user.role === UserRole.INVESTOR) ? undefined : () => handleBuy(piece.id)} 
                        onViewDetails={(p) => {
                          setSelectedPiece(p);
                          if (user.role === UserRole.INVESTOR) logInvestorView(p.id, 2);
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'marketplace' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-serif italic">Marketplace</h3>
                    <p className="text-zinc-500">Exquisite pieces available for immediate acquisition.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {masterpieces.filter(p => p.status === 'available').map(piece => (
                    <PieceCard 
                      key={piece.id} 
                      piece={piece} 
                      onBuy={(user.role === UserRole.VIEWER || user.role === UserRole.INVESTOR) ? undefined : () => handleBuy(piece.id)} 
                      onViewDetails={(p) => {
                        setSelectedPiece(p);
                        if (user.role === UserRole.INVESTOR) logInvestorView(p.id, 3);
                      }} 
                    />
                  ))}
                  {masterpieces.filter(p => p.status === 'available').length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
                      <ShoppingBag className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-500">No masterpieces currently available in the marketplace.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'auctions' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif italic">Private Auctions</h3>
                  <p className="text-zinc-500">Live bidding on rare and unique masterpieces.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {auctions.map(auction => (
                    <AuctionCard 
                      key={auction.id} 
                      auction={auction} 
                      onBid={(user.role === UserRole.VIEWER || user.role === UserRole.INVESTOR) ? undefined : (amt) => handleBid(auction.id, amt)} 
                      userId={user.id} 
                      onViewDetails={(pId) => {
                        const p = masterpieces.find(m => m.id === pId);
                        if (p) {
                          setSelectedPiece(p);
                          if (user.role === UserRole.INVESTOR) logInvestorView(p.id, 4);
                        }
                      }}
                    />
                  ))}
                  {auctions.length === 0 && (
                    <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
                      <Gavel className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                      <p className="text-zinc-500">No active auctions at this time.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'vault' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  <TabButton active={vaultTab === 'pieces'} label={t('my_pieces')} onClick={() => setVaultTab('pieces')} icon={Award} />
                  <TabButton active={vaultTab === 'certs'} label={t('certificates')} onClick={() => setVaultTab('certs')} icon={ShieldCheck} />
                  <TabButton active={vaultTab === 'contracts'} label={t('contracts')} onClick={() => setVaultTab('contracts')} icon={FileText} />
                  <TabButton active={vaultTab === 'payments'} label={t('payments')} onClick={() => setVaultTab('payments')} icon={CreditCard} />
                  <TabButton active={vaultTab === 'auctions'} label={t('my_bids')} onClick={() => setVaultTab('auctions')} icon={Gavel} />
                  <TabButton active={vaultTab === 'resale'} label={t('resale')} onClick={() => setVaultTab('resale')} icon={TrendingUp} />
                  <TabButton active={vaultTab === 'vip'} label={t('vip')} onClick={() => setVaultTab('vip')} icon={Diamond} />
                </div>

                <div className="min-h-[400px]">
                  {vaultTab === 'pieces' && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vaultData.pieces.map(piece => (
                          <div key={piece.id} className="space-y-4">
                            <PieceCard piece={piece} hideAction onViewDetails={setSelectedPiece} />
                            <WorkflowTimeline masterpieceId={piece.id} />
                          </div>
                        ))}
                        {vaultData.pieces.length === 0 && <EmptyState icon={Award} text="You don't own any pieces yet." />}
                      </div>
                    </div>
                  )}
                  {vaultTab === 'certs' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {vaultData.certs.map(cert => (
                        <Card key={cert.id} className="space-y-4">
                          <div className="aspect-video bg-zinc-800 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="w-12 h-12 text-amber-500/20" />
                          </div>
                          <div>
                            <h4 className="font-medium text-zinc-200">{cert.cert_id}</h4>
                            <p className="text-xs text-zinc-500">{t('issued')}: {new Date(cert.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 py-2 text-xs" onClick={() => setSelectedCert(cert)}><Eye className="w-3 h-3" /> {t('view')}</Button>
                            <Button variant="outline" className="flex-1 py-2 text-xs" onClick={() => {
                              const p = masterpieces.find(m => m.id === cert.masterpiece_id);
                              downloadPDF("Certificate of Authenticity", cert.content, p);
                            }}><FileDown className="w-3 h-3" /> PDF</Button>
                          </div>
                        </Card>
                      ))}
                      {vaultData.certs.length === 0 && <EmptyState icon={ShieldCheck} text="No certificates issued yet." />}
                    </div>
                  )}
                  {vaultTab === 'contracts' && (
                    <div className="space-y-6">
                      {vaultData.contracts.filter(c => c.status !== 'archived').map(contract => (
                        <Card key={contract.id} className="overflow-hidden border-zinc-800/50">
                          <div className="p-6 flex items-center justify-between bg-zinc-900/30">
                            <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${contract.status === 'signed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                <FileText className="w-7 h-7" />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="font-serif italic text-lg text-zinc-100 capitalize">{contract.type} Agreement</h4>
                                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-zinc-700 text-zinc-500">v{contract.version}.0</Badge>
                                </div>
                                <p className="text-xs text-zinc-500 font-mono uppercase tracking-tighter">{contract.doc_ref}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Button variant="ghost" className="p-2 text-zinc-400 hover:text-amber-500" onClick={() => {
                                const p = masterpieces.find(m => m.id === contract.masterpiece_id);
                                downloadPDF(`${contract.type} Agreement`, contract.content, p);
                              }}><FileDown className="w-5 h-5" /></Button>
                              
                              {contract.status === 'draft' ? (
                                <Button variant="primary" className="py-2.5 px-6 text-xs font-bold uppercase tracking-widest" onClick={() => {
                                  handleReviewContract(contract.id);
                                  setContractToSign(contract);
                                }}>
                                  <Signature className="w-4 h-4" /> {t('sign_digitally')}
                                </Button>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                                    <CheckCircle className="w-4 h-4" /> {t('signed')}
                                  </div>
                                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest">{new Date(contract.signed_at!).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Version History Mini-Timeline */}
                          <div className="px-6 py-3 bg-zinc-950/50 border-t border-zinc-800/30 flex items-center gap-4 overflow-x-auto scrollbar-hide">
                            <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">History:</span>
                            {[...Array(contract.version)].map((_, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${i + 1 === contract.version ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-zinc-800'}`} />
                                <span className={`text-[9px] font-mono ${i + 1 === contract.version ? 'text-zinc-300' : 'text-zinc-600'}`}>v{i + 1}.0</span>
                                {i < contract.version - 1 && <div className="w-4 h-[1px] bg-zinc-800" />}
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                      {vaultData.contracts.length === 0 && <EmptyState icon={FileText} text="No active agreements found." />}
                    </div>
                  )}
                  {vaultTab === 'resale' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {vaultData.pieces.map(piece => (
                        <PieceCard 
                          key={piece.id} 
                          piece={piece} 
                          hideAction 
                          onViewDetails={setSelectedPiece}
                          extraAction={
                            piece.status === 'sold' ? (
                              <Button variant="outline" className="w-full py-2 text-xs mt-4" onClick={() => handleListResale(piece.id)}>
                                <TrendingUp className="w-4 h-4" /> {t('list_resale')}
                              </Button>
                            ) : piece.status === 'resell_pending' ? (
                              <div className="w-full py-2 text-center bg-zinc-800/50 rounded-lg text-amber-500 text-[10px] mt-4 font-bold uppercase tracking-widest">
                                {t('resale_pending_approval')}
                              </div>
                            ) : null
                          }
                        />
                      ))}
                      {vaultData.pieces.length === 0 && <EmptyState icon={TrendingUp} text="No pieces available for resale." />}
                    </div>
                  )}
                  {vaultTab === 'payments' && (
                    <div className="space-y-4">
                      {payments.map(pay => (
                        <Card key={pay.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pay.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-medium text-zinc-200">{pay.reference}</h4>
                              <p className="text-xs text-zinc-500">{pay.type === 'deposit' ? t('deposit') : t('full_payment')} • {new Date(pay.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <p className="text-lg font-bold text-zinc-100">{pay.amount.toLocaleString()} €</p>
                            <Badge variant={pay.status === 'paid' ? 'emerald' : 'amber'}>{pay.status}</Badge>
                          </div>
                          {pay.status === 'pending' && (
                            <div className="ml-8 p-4 bg-zinc-900 rounded-xl border border-zinc-800 max-w-xs relative">
                              {vaultData.contracts.some(c => c.masterpiece_id === pay.masterpiece_id && c.status === 'draft') ? (
                                <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10 rounded-xl">
                                  <Lock className="w-5 h-5 text-amber-500 mb-2" />
                                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{t('signature_required')}</p>
                                  <p className="text-[8px] text-zinc-600 mt-1">Sign the agreement in the Contracts tab to unlock payment instructions.</p>
                                </div>
                              ) : null}
                              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Payment Instructions</p>
                              <p className="text-xs text-zinc-300 font-mono break-all">IBAN: {pay.iban}</p>
                              <p className="text-xs text-zinc-300 font-mono">REF: {pay.reference}</p>
                            </div>
                          )}
                        </Card>
                      ))}
                      {payments.length === 0 && <EmptyState icon={CreditCard} text="No payment history." />}
                    </div>
                  )}
                  {vaultTab === 'vip' && (
                    <div className="space-y-8">
                      {user.role !== 'vip' ? (
                        <Card className="text-center py-12 space-y-4">
                          <Diamond className="w-12 h-12 text-zinc-800 mx-auto" />
                          <h4 className="text-xl font-serif italic">VIP Membership Required</h4>
                          <p className="text-zinc-500 max-w-md mx-auto">Exclusive benefits and concierge services are reserved for our VIP members. Apply for membership to unlock these features.</p>
                          <Button variant="outline" onClick={() => alert("Please contact Antonio Bellanova for VIP application details.")}>Learn More</Button>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <Card className="space-y-6 border-amber-500/30 bg-amber-500/5">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                                <Diamond className="w-6 h-6 text-amber-500" />
                              </div>
                              <div>
                                <h4 className="text-xl font-serif italic">VIP Exclusive Benefits</h4>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">Antonio Bellanova Atelier</p>
                              </div>
                            </div>
                            <ul className="space-y-4">
                              <BenefitItem icon={Clock} title="Early Access" description="View and bid on private auctions 48 hours before the general public." />
                              <BenefitItem icon={Award} title="Private Previews" description="Receive invitations to exclusive physical previews in Cologne and Milan." />
                              <BenefitItem icon={ShieldCheck} title="Extended Warranty" description="Lifetime authenticity guarantee and complimentary maintenance for all pieces." />
                              <BenefitItem icon={TrendingUp} title="Resale Priority" description="Priority listing and lower commission rates for secondary market sales." />
                            </ul>
                          </Card>

                          <Card className="space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-zinc-400" />
                              </div>
                              <div>
                                <h4 className="text-xl font-serif italic">Concierge Service</h4>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">Direct Access to Antonio</p>
                              </div>
                            </div>
                            <p className="text-sm text-zinc-400">As a VIP member, you have a direct line to our atelier. Request bespoke commissions, private viewings, or asset consultations.</p>
                            <div className="space-y-4">
                              <textarea 
                                id="concierge-msg"
                                placeholder="How can we assist you today?" 
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-200 focus:outline-none focus:border-amber-600/50 h-32 resize-none"
                              />
                              <Button className="w-full" onClick={() => {
                                const msg = (document.getElementById('concierge-msg') as HTMLTextAreaElement).value;
                                if (msg) handleConcierge(msg);
                              }}>Send Request</Button>
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {view === 'portfolio' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <h3 className="text-5xl font-serif italic text-white">The Curated Collection</h3>
                  <p className="text-zinc-500 text-lg">A selection of Antonio Bellanova's most significant works, showcasing the pinnacle of craftsmanship and luxury design.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {masterpieces.map(piece => (
                    <div key={piece.id} className="group cursor-pointer" onClick={() => setSelectedPiece(piece)}>
                      <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-zinc-900 mb-6 relative">
                        <img 
                          src={piece.image_url || `https://picsum.photos/seed/${piece.id}/800/1200`} 
                          alt={piece.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                          <p className="text-white text-sm font-serif italic">{piece.description.substring(0, 100)}...</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="text-2xl font-serif italic text-white">{piece.title}</h4>
                          <Badge variant="outline" className="border-zinc-800 text-zinc-500">{piece.category}</Badge>
                        </div>
                        <p className="text-zinc-500 text-sm uppercase tracking-[0.2em]">{piece.rarity} Edition</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {view === 'investor' && user.role === UserRole.INVESTOR && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card className="p-6 space-y-2 border-emerald-500/20 bg-emerald-500/5">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Platform Valuation</p>
                    <p className="text-3xl font-bold text-emerald-500">{investorAnalytics?.platform_valuation.toLocaleString()} €</p>
                    <p className="text-[10px] text-emerald-600 font-bold">+12.4% vs Last Quarter</p>
                  </Card>
                  <Card className="p-6 space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Liquidity Forecast</p>
                    <p className="text-3xl font-bold text-zinc-100">{investorAnalytics?.liquidity_forecast.toLocaleString()} €</p>
                    <p className="text-[10px] text-zinc-500">Projected Secondary Market Volume</p>
                  </Card>
                  <Card className="p-6 space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Scarcity Index</p>
                    <p className="text-3xl font-bold text-amber-500">{investorAnalytics?.scarcity_index}/100</p>
                    <p className="text-[10px] text-amber-600 font-bold">High Demand Signal</p>
                  </Card>
                  <Card className="p-6 space-y-2">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Pieces Under Management</p>
                    <p className="text-3xl font-bold text-zinc-100">{masterpieces.length}</p>
                    <p className="text-[10px] text-zinc-500">{investorAnalytics?.pieces_sold} Sold to Date</p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xl font-serif italic">Market Performance</h4>
                      <div className="flex gap-2">
                        <TabButton active={vaultTab === 'investor_insights'} label="Insights" onClick={() => setVaultTab('investor_insights')} icon={TrendingUp} />
                        <TabButton active={vaultTab === 'dataroom'} label="Data Room" onClick={() => setVaultTab('dataroom')} icon={Lock} />
                      </div>
                    </div>

                    {vaultTab === 'investor_insights' ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Top Category</p>
                            <p className="text-lg font-medium text-zinc-200">{investorAnalytics?.appreciation_metrics.top_performing_category}</p>
                          </div>
                          <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Avg. Appreciation</p>
                            <p className="text-lg font-medium text-emerald-500">+{investorAnalytics?.appreciation_metrics.avg_appreciation}%</p>
                          </div>
                        </div>
                        <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-4">
                          <h5 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Rarity Distribution</h5>
                          <div className="space-y-3">
                            {Object.entries(investorAnalytics?.rarity_distribution || {}).map(([key, val]: any) => (
                              <div key={key} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-zinc-500">{key}</span>
                                  <span className="text-zinc-300">{val} Pieces</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full bg-amber-500" style={{ width: `${(val / masterpieces.length) * 100}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-12 text-center space-y-4 border border-dashed border-zinc-800 rounded-3xl">
                          <Lock className="w-12 h-12 text-zinc-800 mx-auto" />
                          <h5 className="text-lg font-serif italic">Restricted Data Room</h5>
                          <p className="text-sm text-zinc-500 max-w-xs mx-auto">Access to detailed financial reports, production pipelines, and brand audits requires specific authorization.</p>
                          <Button variant="primary" onClick={() => handleInvestorRequest('dataroom', 'Requesting access to the private data room for due diligence.')}>Request Access</Button>
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card className="space-y-6">
                    <h4 className="text-xl font-serif italic">Investor Actions</h4>
                    <div className="space-y-3">
                      <InvestorActionButton icon={Diamond} title="Request Allocation" description="Apply for priority access to upcoming drops." onClick={() => handleInvestorRequest('allocation', 'Requesting allocation for the next major release.')} />
                      <InvestorActionButton icon={Users} title="Schedule Meeting" description="Direct consultation with Antonio Bellanova." onClick={() => handleInvestorRequest('meeting', 'Requesting a private consultation meeting.')} />
                      <InvestorActionButton icon={Eye} title="VIP Preview" description="Request early access to physical exhibitions." onClick={() => handleInvestorRequest('preview', 'Requesting VIP preview access for the next exhibition.')} />
                    </div>
                    <div className="pt-6 border-t border-zinc-900">
                      <h5 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Recent Activity</h5>
                      <div className="space-y-4">
                        {adminInvestorRequests.filter(r => r.user_id === user.id).slice(0, 3).map(req => (
                          <div key={req.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div>
                              <p className="text-xs text-zinc-300 capitalize">{req.type} Request</p>
                              <p className="text-[10px] text-zinc-600">{new Date(req.created_at).toLocaleDateString()}</p>
                            </div>
                            <Badge variant="outline" className="ml-auto text-[8px] h-fit">{req.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {view === 'admin' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-4"><p className="text-xs text-zinc-500 uppercase tracking-widest">Gesamtumsatz</p><p className="text-3xl font-bold text-amber-500">{adminStats?.totalRevenue.toLocaleString()} €</p></Card>
                  <Card className="p-4"><p className="text-xs text-zinc-500 uppercase tracking-widest">Aktive Nutzer</p><p className="text-3xl font-bold text-zinc-100">{adminStats?.activeUsers}</p></Card>
                  <Card className="p-4"><p className="text-xs text-zinc-500 uppercase tracking-widest">Ausstehende Genehmigungen</p><p className="text-3xl font-bold text-zinc-100">{adminStats?.pendingApprovals}</p></Card>
                  <Card className="p-4"><p className="text-xs text-zinc-500 uppercase tracking-widest">Meisterstücke</p><p className="text-3xl font-bold text-zinc-100">{masterpieces.length}</p></Card>
                </div>

                    {/* Masterpiece Creation */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <section className="space-y-6">
                        <h3 className="text-2xl font-serif italic">Meisterstück erstellen</h3>
                        <Card className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="Titel" value={newPiece.title} onChange={(e: any) => setNewPiece({ ...newPiece, title: e.target.value })} />
                            <Input label="Kategorie" value={newPiece.category} onChange={(e: any) => setNewPiece({ ...newPiece, category: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="Seriennummer" value={newPiece.serial_id} onChange={(e: any) => setNewPiece({ ...newPiece, serial_id: e.target.value })} />
                            <Input label="Produktionszeit" value={newPiece.production_time} onChange={(e: any) => setNewPiece({ ...newPiece, production_time: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="Bewertung (€)" type="number" value={newPiece.valuation} onChange={(e: any) => setNewPiece({ ...newPiece, valuation: e.target.value })} />
                            <Input label="Anzahlung %" type="number" value={newPiece.deposit_pct} onChange={(e: any) => setNewPiece({ ...newPiece, deposit_pct: e.target.value })} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="Materialien" value={newPiece.materials} onChange={(e: any) => setNewPiece({ ...newPiece, materials: e.target.value })} />
                            <Input label="Edelsteine" value={newPiece.gemstones} onChange={(e: any) => setNewPiece({ ...newPiece, gemstones: e.target.value })} />
                          </div>
                          <Input label="Zertifikatsdaten (JSON)" value={newPiece.cert_data} onChange={(e: any) => setNewPiece({ ...newPiece, cert_data: e.target.value })} placeholder='{"cut": "Ideal", "clarity": "VVS1"}' />
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Seltenheitsgrad</label>
                            <select value={newPiece.rarity} onChange={(e) => setNewPiece({ ...newPiece, rarity: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                              <option>Unikat</option><option>Limitiert</option><option>Selten</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Beschreibung</label>
                            <textarea value={newPiece.description} onChange={(e) => setNewPiece({ ...newPiece, description: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50 h-32" />
                          </div>
                          <div className="space-y-4">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Bild des Meisterstücks</label>
                            <div className="border-2 border-dashed border-zinc-800 rounded-3xl aspect-video flex flex-col items-center justify-center p-8 text-center group hover:border-amber-600/50 transition-all cursor-pointer relative overflow-hidden" onClick={() => document.getElementById('file-upload')?.click()}>
                              {newPiece.image ? <img src={newPiece.image} alt="Preview" className="absolute inset-0 w-full h-full object-cover" /> : <><Upload className="w-12 h-12 text-zinc-700 group-hover:text-amber-500 transition-colors mb-4" /><p className="text-sm text-zinc-500">Klicken oder Bild hierher ziehen</p></>}
                              <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>
                          </div>
                          <Button className="w-full" onClick={handleCreatePiece} disabled={loading}>Meisterstück erstellen</Button>
                        </Card>
                      </section>

                  <div className="space-y-8">
                    <section className="space-y-6">
                      <h3 className="text-2xl font-serif italic">Neuen Kunden hinzufügen</h3>
                      <Card className="space-y-4">
                        <Input label="Name" value={newClient.name} onChange={(e: any) => setNewClient({ ...newClient, name: e.target.value })} />
                        <Input label="Email" value={newClient.email} onChange={(e: any) => setNewClient({ ...newClient, email: e.target.value })} />
                        <Input label="Adresse" value={newClient.address} onChange={(e: any) => setNewClient({ ...newClient, address: e.target.value })} />
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={newClient.isVip} onChange={() => setNewClient({ ...newClient, isVip: !newClient.isVip })} className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-amber-600" />
                            <span className="text-xs text-zinc-400">VIP Status</span>
                          </label>
                        </div>
                        <Button className="w-full" onClick={handleAddClient} disabled={loading}>Kunde anlegen & Vault erstellen</Button>
                      </Card>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-2xl font-serif italic">Auktion erstellen</h3>
                      <Card className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Meisterstück auswählen</label>
                          <select value={newAuction.masterpieceId} onChange={(e) => setNewAuction({ ...newAuction, masterpieceId: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                            <option value="">Stück wählen...</option>
                            {masterpieces.filter(m => m.status === 'available').map(m => (
                              <option key={m.id} value={m.id}>{m.title} ({m.serial_id})</option>
                            ))}
                          </select>
                        </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="Startpreis (€)" type="number" value={newAuction.startPrice} onChange={(e: any) => setNewAuction({ ...newAuction, startPrice: e.target.value })} />
                            <Input label="Endzeitpunkt" type="datetime-local" value={newAuction.endTime} onChange={(e: any) => setNewAuction({ ...newAuction, endTime: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Auktionsbedingungen (Terms)</label>
                            <textarea 
                              value={(newAuction as any).terms || ''} 
                              onChange={(e) => setNewAuction({ ...newAuction, terms: e.target.value } as any)} 
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50 h-24 resize-none"
                              placeholder="Standard luxury auction terms apply..."
                            />
                          </div>
                          <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${newAuction.vipOnly ? 'bg-amber-600 border-amber-600' : 'border-zinc-700 bg-zinc-800'}`}>
                            {newAuction.vipOnly && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={newAuction.vipOnly} onChange={() => setNewAuction({ ...newAuction, vipOnly: !newAuction.vipOnly })} />
                          <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">Nur VIP-Frühzugang</span>
                        </label>
                        <Button className="w-full" onClick={handleCreateAuction} disabled={loading || !newAuction.masterpieceId}>Auktion starten</Button>
                      </Card>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-2xl font-serif italic">Stück manuell zuweisen</h3>
                      <Card className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Nutzer auswählen</label>
                          <select value={assignPiece.userId} onChange={(e) => setAssignPiece({ ...assignPiece, userId: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                            <option value="">Nutzer wählen...</option>
                            {allUsers.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold ml-1">Meisterstück auswählen</label>
                          <select value={assignPiece.masterpieceId} onChange={(e) => setAssignPiece({ ...assignPiece, masterpieceId: e.target.value })} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-200 focus:outline-none focus:border-amber-600/50">
                            <option value="">Stück wählen...</option>
                            {masterpieces.map(m => (
                              <option key={m.id} value={m.id}>{m.title} ({m.serial_id}) - {m.status}</option>
                            ))}
                          </select>
                        </div>
                        <Button variant="secondary" className="w-full" onClick={handleAssignPiece} disabled={loading || !assignPiece.userId || !assignPiece.masterpieceId}>Besitz zuweisen</Button>
                      </Card>
                    </section>
                  </div>
                </div>

                {/* Approval Queues */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">Ausstehende Käufe</h3>
                    <div className="space-y-4">
                      {masterpieces.filter(p => p.status === 'reserved').map(piece => {
                        const contract = adminContracts.find(c => c.masterpiece_id === piece.id && c.type === 'deposit');
                        return (
                          <Card key={piece.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {piece.image_url && <img src={piece.image_url} className="w-12 h-12 rounded-xl object-cover" />}
                              <div>
                                <p className="text-sm font-medium text-zinc-200">{piece.title}</p>
                                <p className="text-xs text-zinc-500">{piece.valuation.toLocaleString()} €</p>
                                {contract && (
                                  <div className="mt-1">
                                    <Badge variant={contract.status === 'signed' ? 'emerald' : 'amber'}>
                                      Anzahlungsvertrag: {contract.status === 'signed' ? 'Unterzeichnet' : 'Entwurf'}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" className="py-1.5 px-3 text-xs" onClick={() => handleApprovePurchase(piece.id, true, user.id)} disabled={!contract || contract.status !== 'signed'}>Genehmigen</Button>
                              <Button variant="danger" className="py-1.5 px-3 text-xs" onClick={() => handleApprovePurchase(piece.id, false, user.id)}>Ablehnen</Button>
                            </div>
                          </Card>
                        );
                      })}
                      {masterpieces.filter(p => p.status === 'reserved').length === 0 && <p className="text-zinc-600 text-sm italic">Keine ausstehenden Käufe.</p>}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">Aktive Workflows</h3>
                    <div className="space-y-6">
                      {masterpieces.filter(p => p.status === 'sold' || p.status === 'reserved').map(piece => (
                        <AdminWorkflowChecklist key={piece.id} piece={piece} onUpdate={handleUpdateWorkflow} />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">Wiederverkaufsanfragen</h3>
                    <div className="space-y-4">
                      {masterpieces.filter(p => p.status === 'resell_pending').map(piece => (
                        <Card key={piece.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {piece.image_url && <img src={piece.image_url} className="w-12 h-12 rounded-xl object-cover" />}
                            <div>
                              <p className="text-sm font-medium text-zinc-200">{piece.title}</p>
                              <p className="text-xs text-zinc-500">Wiederverkaufspreis: {piece.valuation.toLocaleString()} €</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="py-1.5 px-3 text-xs" onClick={() => handleApproveResale(piece.id, true)}>Genehmigen</Button>
                            <Button variant="danger" className="py-1.5 px-3 text-xs" onClick={() => handleApproveResale(piece.id, false)}>Ablehnen</Button>
                          </div>
                        </Card>
                      ))}
                      {masterpieces.filter(p => p.status === 'resell_pending').length === 0 && <p className="text-zinc-600 text-sm italic">Keine ausstehenden Wiederverkaufsanfragen.</p>}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">Ausstehende Zahlungen</h3>
                    <div className="space-y-4">
                      {allUsers.map(u => (
                        <div key={u.id}>
                          {payments.filter(p => p.user_id === u.id && p.status === 'pending').map(pay => (
                            <Card key={pay.id} className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                                <p className="text-xs text-zinc-500">{pay.reference} • {pay.amount.toLocaleString()} €</p>
                              </div>
                              <Button variant="outline" className="py-1.5 px-3 text-xs" onClick={() => handleConfirmPayment(pay.id)}>Zahlung bestätigen</Button>
                            </Card>
                          ))}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">Nutzer-Genehmigungen</h3>
                    <div className="space-y-4">
                      {allUsers.filter(u => u.status === 'pending').map(u => (
                        <Card key={u.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                            <p className="text-xs text-zinc-500">{u.email} • {u.address}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="zinc" className="text-[8px] uppercase">{u.role}</Badge>
                              {u.is_vip && <Badge variant="amber" className="text-[8px] uppercase">Wünscht VIP</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="py-1.5 px-3 text-xs" onClick={() => handleApproveUser(u.id, true)}>Genehmigen</Button>
                            <Button variant="danger" className="py-1.5 px-3 text-xs" onClick={() => handleApproveUser(u.id, false)}>Ablehnen</Button>
                          </div>
                        </Card>
                      ))}
                      {allUsers.filter(u => u.status === 'pending').length === 0 && <p className="text-zinc-600 text-sm italic">Keine ausstehenden Registrierungen.</p>}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-xl font-serif italic">Investor-Anfragen</h3>
                    <div className="space-y-4">
                      {adminInvestorRequests.map(req => (
                        <Card key={req.id} className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-zinc-200 capitalize">{req.type} Request</p>
                              <p className="text-xs text-zinc-500">Investor: {req.user_name} ({req.user_email})</p>
                            </div>
                            <Badge variant={req.status === 'pending' ? 'amber' : 'emerald'}>{req.status}</Badge>
                          </div>
                          <p className="text-xs text-zinc-400 italic">"{req.message}"</p>
                          {req.status === 'pending' && (
                            <div className="flex gap-2 pt-2">
                              <Button variant="outline" className="flex-1 py-1.5 text-[10px]" onClick={() => alert("Request approved. Access granted.")}>Approve</Button>
                              <Button variant="danger" className="flex-1 py-1.5 text-[10px]" onClick={() => alert("Request rejected.")}>Reject</Button>
                            </div>
                          )}
                        </Card>
                      ))}
                      {adminInvestorRequests.length === 0 && <p className="text-zinc-600 text-sm italic">Keine Investor-Anfragen.</p>}
                    </div>
                  </section>

                  <section className="space-y-4 lg:col-span-2">
                    <h3 className="text-xl font-serif italic">Unterzeichnete Verträge</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {adminContracts.filter(c => c.status === 'signed').map(c => (
                        <Card key={c.id} className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-zinc-200 capitalize">{c.type === 'deposit' ? 'Anzahlungs' : c.type === 'purchase' ? 'Kauf' : c.type}vertrag</p>
                              <p className="text-xs text-zinc-500">Kunde: {c.user_name}</p>
                              {c.piece_title && <p className="text-xs text-zinc-500">Stück: {c.piece_title}</p>}
                            </div>
                            <Badge variant="emerald">Unterzeichnet</Badge>
                          </div>
                          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 max-h-40 overflow-y-auto">
                            <pre className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap">{c.content}</pre>
                          </div>
                          <p className="text-[10px] text-zinc-600 italic">Unterzeichnet am {new Date(c.signed_at).toLocaleString('de-DE')}</p>
                        </Card>
                      ))}
                      {adminContracts.filter(c => c.status === 'signed').length === 0 && <p className="text-zinc-600 text-sm italic col-span-full">Noch keine unterzeichneten Verträge.</p>}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Piece Details Modal */}
        <AnimatePresence>
          {selectedPiece && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={() => setSelectedPiece(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 h-full max-h-[90vh] overflow-y-auto">
                  <div className="aspect-square bg-zinc-900 relative">
                    <img src={selectedPiece.image_url || `https://picsum.photos/seed/${selectedPiece.id}/800/800`} alt={selectedPiece.title} className="w-full h-full object-cover" />
                    <div className="absolute top-6 left-6">
                      <Badge variant="amber">{selectedPiece.rarity}</Badge>
                    </div>
                  </div>
                  <div className="p-8 md:p-12 space-y-8 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-4xl font-serif italic text-white">{selectedPiece.title}</h3>
                        <p className="text-amber-500 text-2xl font-bold">{selectedPiece.valuation.toLocaleString()} €</p>
                      </div>
                      <button onClick={() => setSelectedPiece(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <Plus className="w-6 h-6 text-zinc-500 rotate-45" />
                      </button>
                    </div>

                    <div className="space-y-6 flex-1">
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('description')}</p>
                        <p className="text-zinc-400 leading-relaxed">{selectedPiece.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('materials')}</p>
                          <p className="text-zinc-200">{selectedPiece.materials}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('gemstones')}</p>
                          <p className="text-zinc-200">{selectedPiece.gemstones}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Serial ID</p>
                        <p className="font-mono text-xs text-zinc-400">{selectedPiece.serial_id}</p>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-zinc-900 space-y-4">
                      {selectedPiece.status === 'available' && view !== 'admin' && (
                        <>
                          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                            <p className="text-[10px] text-amber-500/80 leading-relaxed text-center italic">
                              {t('legal_notice')}
                            </p>
                          </div>
                          <Button className="w-full py-4 text-base" onClick={() => { handleBuy(selectedPiece.id); setSelectedPiece(null); }}>
                            <ShoppingBag className="w-5 h-5" /> {t('request_acquisition')}
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" className="w-full py-4 text-sm text-zinc-500" onClick={() => setSelectedPiece(null)}>
                        {t('close')}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Ownership Ceremony */}
        <AnimatePresence>
          {showCeremony && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="max-w-2xl w-full text-center space-y-12"
              >
                <div className="space-y-4">
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20"
                  >
                    <Award className="w-12 h-12 text-amber-500" />
                  </motion.div>
                  <h2 className="text-4xl font-serif italic text-zinc-100">Ownership Transfer Ceremony</h2>
                  <p className="text-zinc-500 uppercase tracking-[0.3em] text-[10px] font-bold">Antonio Bellanova Atelier</p>
                </div>

                <div className="aspect-video rounded-[3rem] overflow-hidden border border-zinc-800 shadow-2xl relative group">
                  <img src={showCeremony.image_url} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-0 right-0">
                    <h3 className="text-2xl font-serif italic text-white">{showCeremony.title}</h3>
                    <p className="text-xs text-amber-500 uppercase tracking-widest mt-1">Acquired by {user?.name}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <p className="text-zinc-400 font-light leading-relaxed italic">
                    "True luxury is not merely the possession of an object, but the stewardship of a legacy. Today, you become the custodian of a singular masterpiece, handcrafted with precision and passion."
                  </p>
                  <div className="flex flex-col gap-4">
                    <Button variant="primary" className="py-4 text-xs uppercase tracking-[0.2em] font-bold" onClick={() => setShowCeremony(null)}>
                      Enter the Vault
                    </Button>
                    <Button variant="ghost" className="text-zinc-500 text-[10px] uppercase tracking-widest" onClick={() => {
                      setShowCeremony(null);
                      setVaultTab('certs');
                    }}>
                      View Certificate of Authenticity
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Certificate Modal */}
        <AnimatePresence>
          {selectedCert && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
                onClick={() => setSelectedCert(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
              >
                <div className="p-8 md:p-12 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-serif italic text-amber-500">Certificate of Authenticity</h3>
                      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Antonio Bellanova Atelier</p>
                    </div>
                    <button onClick={() => setSelectedCert(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                      <Plus className="w-6 h-6 text-zinc-500 rotate-45" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('cert_details')}</p>
                        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                          {selectedCert.content || `
ECHTHEITSZERTIFIKAT
-------------------
ID: ${selectedCert.cert_id}
STÜCK: ${masterpieces.find(m => m.id === selectedCert.masterpiece_id)?.title}
BESITZER: ${user.name}
DATUM: ${new Date(selectedCert.created_at).toLocaleDateString()}
                          `}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{t('blockchain_hash')}</p>
                        <p className="font-mono text-[10px] text-zinc-400 break-all">{selectedCert.blockchain_hash}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{t('digital_signature')}</p>
                        <p className="font-serif italic text-zinc-300">{selectedCert.signature}</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="aspect-square bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center p-8">
                        <div className="w-32 h-32 bg-white p-2 rounded-xl mb-4">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://vault.bellanova.com/verify/${selectedCert.cert_id}`} alt="Verification QR" className="w-full h-full" />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 text-center">{t('scan_verify')}</p>
                      </div>
                      <Button className="w-full py-2 text-sm"><Download className="w-4 h-4" /> {t('download_pdf')}</Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Helper Components ---

const NavItem = ({ active, icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${active ? 'bg-amber-600/10 text-amber-500' : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'}`}>
    <Icon className={`w-5 h-5 ${active ? 'text-amber-500' : 'group-hover:text-amber-500'} transition-colors`} />
    <span className="hidden md:block text-sm font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, icon: Icon }: any) => (
  <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
    <Icon className="w-5 h-5 text-amber-500/50 mb-2" />
    <p className="text-2xl font-bold text-zinc-100">{value}</p>
    <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
  </div>
);

const TabButton = ({ active, label, onClick, icon: Icon }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${active ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-200 border border-zinc-800'}`}>
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const PieceCard = ({ piece, onBuy, onViewDetails, hideAction, extraAction }: { piece: Masterpiece, onBuy?: () => void, onViewDetails?: (p: Masterpiece) => void, hideAction?: boolean, extraAction?: React.ReactNode, key?: any }) => (
  <Card className="group hover:border-amber-600/30 transition-all">
    <div className="aspect-square rounded-2xl bg-zinc-800 mb-4 overflow-hidden relative cursor-pointer" onClick={() => onViewDetails?.(piece)}>
      <img src={piece.image_url || `https://picsum.photos/seed/${piece.id}/600/600`} alt={piece.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute top-3 right-3">
        <Badge variant="amber">{piece.rarity}</Badge>
      </div>
      {piece.status === 'reserved' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <Badge variant="amber">Reserved</Badge>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full">
          <Eye className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-zinc-200 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => onViewDetails?.(piece)}>{piece.title}</h4>
        <p className="text-amber-500 font-bold">{piece.valuation.toLocaleString()} €</p>
      </div>
      <p className="text-xs text-zinc-500 line-clamp-2">{piece.description}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        <span className="text-[8px] uppercase px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">ID: {piece.serial_id}</span>
        <span className="text-[8px] uppercase px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">{piece.materials}</span>
      </div>
      {!hideAction && piece.status === 'available' && onBuy && (
        <Button variant="outline" className="w-full py-2 text-xs mt-4" onClick={onBuy}>
          <ShoppingBag className="w-4 h-4" /> Request Acquisition
        </Button>
      )}
      {extraAction}
    </div>
  </Card>
);

const AuctionCard = ({ auction, onBid, onViewDetails, userId }: { auction: Auction, onBid: (amt: number) => void, onViewDetails?: (pId: number) => void, userId: number, key?: any }) => {
  const [bidAmt, setBidAmt] = useState(auction.current_bid + 1000);
  const [showHistory, setShowHistory] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const end = new Date(auction.end_time).getTime();
      const now = new Date().getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Auction Ended');
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.end_time]);

  // Update bid input when current bid changes
  useEffect(() => {
    setBidAmt(auction.current_bid + 1000);
  }, [auction.current_bid]);

  const fetchBids = async () => {
    try {
      const res = await fetch(`/api/auctions/${auction.id}/bids`);
      if (res.ok) {
        setBids(await res.json());
      }
    } catch (e) {
      console.error("Error fetching bids", e);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchBids();
    }
  }, [showHistory, auction.current_bid]);

  return (
    <Card className="group hover:border-amber-600/30 transition-all">
      <div className="aspect-square rounded-2xl bg-zinc-800 mb-4 overflow-hidden relative cursor-pointer" onClick={() => onViewDetails?.(auction.masterpiece_id)}>
        <img src={auction.image_url || `https://picsum.photos/seed/${auction.id}/600/600`} alt={auction.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          <Badge variant="red">Live Auction</Badge>
          {auction.vip_only === 1 && <Badge variant="amber">VIP Early Access</Badge>}
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-zinc-200 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => onViewDetails?.(auction.masterpiece_id)}>{auction.title}</h4>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Current Bid</p>
            <motion.p 
              key={auction.current_bid}
              initial={{ scale: 1.2, color: '#fbbf24' }}
              animate={{ scale: 1, color: '#f59e0b' }}
              transition={{ duration: 0.5 }}
              className="text-amber-500 font-bold text-lg"
            >
              {auction.current_bid.toLocaleString()} €
            </motion.p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
            <Clock className="w-4 h-4 text-amber-500" />
            <div className="flex flex-col">
              <p className="text-[8px] uppercase tracking-widest text-zinc-500">Time Left</p>
              <p className="text-[10px] text-zinc-200 font-mono font-bold">{timeLeft}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-xl border border-zinc-800">
            <Users className="w-4 h-4 text-zinc-500" />
            <div className="flex flex-col">
              <p className="text-[8px] uppercase tracking-widest text-zinc-500">Bidders</p>
              <p className="text-[10px] text-zinc-200 font-bold">{bids.length || '0'}</p>
            </div>
          </div>
        </div>

        {onBid && (
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Place Your Bid (€)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="number" 
                  value={bidAmt} 
                  onChange={(e) => setBidAmt(parseFloat(e.target.value))} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20" 
                />
              </div>
              <Button className="py-2.5 px-6 text-xs font-bold uppercase tracking-widest" onClick={() => onBid(bidAmt)}>Bid Now</Button>
            </div>
          </div>
        )}
        
        <div className="flex gap-4 pt-2 border-t border-zinc-800/50">
          <button 
            onClick={() => { setShowHistory(!showHistory); setShowTerms(false); }}
            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors font-bold ${showHistory ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <History className="w-3 h-3" />
            History
          </button>
          <button 
            onClick={() => { setShowTerms(!showTerms); setShowHistory(false); }}
            className={`flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors font-bold ${showTerms ? 'text-amber-500' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <ShieldCheck className="w-3 h-3" />
            Terms
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          {showHistory && (
            <motion.div 
              key="history"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                {bids.length > 0 ? bids.map((bid) => (
                  <div key={bid.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400">
                        {bid.bidder_name.charAt(0)}
                      </div>
                      <span className="text-xs text-zinc-300">{bid.bidder_name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-amber-500">{bid.amount.toLocaleString()} €</p>
                      <p className="text-[8px] text-zinc-600">{new Date(bid.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] text-zinc-600 italic text-center py-2">No bids yet.</p>
                )}
              </div>
            </motion.div>
          )}

          {showTerms && (
            <motion.div 
              key="terms"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                  {auction.terms || "Standard luxury auction terms apply. All bids are binding. 10% buyer's premium will be added to the final hammer price. Secure, insured white-glove transport is included for the winning bidder."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {auction.highest_bidder_id === userId && (
          <div className="flex items-center gap-2 text-emerald-500 text-[10px] uppercase font-bold tracking-widest bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
            <CheckCircle className="w-3 h-3" /> You are the highest bidder
          </div>
        )}
      </div>
    </Card>
  );
};

const InvestorActionButton = ({ icon: Icon, title, description, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex items-center gap-4 hover:bg-zinc-800 transition-all text-left group"
  >
    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
      <Icon className="w-5 h-5 text-zinc-500 group-hover:text-amber-500" />
    </div>
    <div>
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <p className="text-[10px] text-zinc-500">{description}</p>
    </div>
  </button>
);

const EmptyState = ({ icon: Icon, text }: any) => (
  <div className="col-span-full py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
    <Icon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
    <p className="text-zinc-500">{text}</p>
  </div>
);

const BenefitItem = ({ icon: Icon, title, description }: any) => (
  <li className="flex gap-4">
    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
      <Icon className="w-5 h-5 text-amber-500/50" />
    </div>
    <div>
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  </li>
);

const WorkflowTimeline = ({ masterpieceId, onAction }: { masterpieceId: number, onAction?: () => void }) => {
  const [workflow, setWorkflow] = useState<PurchaseWorkflow | null>(null);
  const [escrow, setEscrow] = useState<EscrowTransaction | null>(null);

  const fetchStatus = () => {
    fetch(`/api/workflow/${masterpieceId}`).then(res => res.json()).then(setWorkflow);
    fetch(`/api/escrow/${masterpieceId}`).then(res => res.json()).then(setEscrow);
  };

  useEffect(() => {
    fetchStatus();
  }, [masterpieceId]);

  if (!workflow) return null;

  const steps = [
    { key: 'approved_at', label: 'Contract Generated', icon: FileText, status: 'WAITING_SIGNATURE' },
    { key: 'signed_at', label: 'Contract Signed', icon: Signature, status: 'SIGNED' },
    { key: 'deposit_paid_at', label: 'Deposit Paid', icon: CreditCard, status: 'RESERVED' },
    { key: 'production_finished_at', label: 'Final Invoice Issued', icon: FileDown, status: 'AWAITING_FINAL_PAYMENT' },
    { key: 'final_payment_pending_at', label: 'Final Payment Received', icon: Lock, status: 'FUNDS_HELD' },
    { key: 'completed_at', label: 'Ownership Transferred', icon: Award, status: 'COMPLETED' },
  ];

  const handleConfirmDelivery = async () => {
    const res = await fetch('/api/admin/workflow/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masterpieceId, step: 'completed', adminId: 1 }) // In a real app, this would be a user action
    });
    if (res.ok) {
      fetchStatus();
      if (onAction) onAction();
    }
  };

  return (
    <div className="p-8 bg-zinc-950 rounded-[2.5rem] border border-zinc-800/40 space-y-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Diamond className="w-32 h-32 text-amber-500" />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-1">Asset Journey</p>
          <h4 className="text-xl font-serif italic text-zinc-100">Provenance Timeline</h4>
        </div>
        <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/5 px-4 py-1 text-[10px] uppercase tracking-widest font-bold">
          {workflow.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="relative space-y-8 pl-2">
        <div className="absolute left-[19px] top-2 bottom-2 w-[1px] bg-gradient-to-b from-amber-500/50 via-zinc-800 to-zinc-900" />
        {steps.map((step, idx) => {
          const isCompleted = !!(workflow as any)[step.key] || (step.key === 'signed_at' && workflow.status !== 'WAITING_SIGNATURE');
          const isCurrent = workflow.status === step.status;
          
          const StepIcon = step.icon;
          
          return (
            <div key={idx} className="flex items-start gap-8 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-700 ${
                isCompleted 
                  ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                  : isCurrent 
                    ? 'bg-zinc-900 border-amber-500 text-amber-500 animate-pulse' 
                    : 'bg-black border-zinc-800 text-zinc-700'
              }`}>
                <StepIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between mb-1">
                  <p className={`text-sm font-serif italic transition-colors ${isCompleted ? 'text-zinc-100' : isCurrent ? 'text-amber-500' : 'text-zinc-600'}`}>
                    {step.label}
                  </p>
                  {isCompleted && (
                    <span className="text-[9px] text-zinc-500 font-mono uppercase">
                      {new Date((workflow as any)[step.key]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                
                {isCurrent && step.key === 'ready_for_delivery_at' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                    <Button variant="primary" className="w-full py-3 text-[10px] uppercase tracking-[0.2em] font-bold" onClick={handleConfirmDelivery}>
                      Confirm Secure Receipt
                    </Button>
                    <p className="text-[9px] text-zinc-500 mt-2 text-center italic">Confirming receipt will release escrow funds to the Atelier.</p>
                  </motion.div>
                )}

                {step.key === 'final_payment_pending_at' && escrow && (
                  <div className="mt-2 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase tracking-widest text-zinc-500">Escrow Status</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${escrow.status === 'HELD' ? 'text-amber-500' : 'text-emerald-500'}`}>{escrow.status}</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${escrow.status === 'HELD' ? 'w-1/2 bg-amber-500' : 'w-full bg-emerald-500'}`} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdminWorkflowChecklist = ({ piece, onUpdate }: { piece: Masterpiece, onUpdate: (id: number, step: string) => Promise<void>, key?: any }) => {
  const [workflow, setWorkflow] = useState<PurchaseWorkflow | null>(null);

  useEffect(() => {
    fetch(`/api/workflow/${piece.id}`).then(res => res.json()).then(setWorkflow);
  }, [piece.id]);

  if (!workflow) return null;

  const steps = [
    { id: 'deposit_paid', label: 'Confirm Deposit Received', key: 'deposit_paid_at' },
    { id: 'production_started', label: 'Start Production', key: 'production_started_at' },
    { id: 'production_finished', label: 'Mark Production Finished', key: 'production_finished_at' },
    { id: 'ready_for_delivery', label: 'Confirm Ready for Delivery', key: 'ready_for_delivery_at' },
    { id: 'final_payment_pending', label: 'Confirm Final Payment Pending', key: 'final_payment_pending_at' },
    { id: 'completed', label: 'Confirm Completed', key: 'completed_at' },
  ];

  return (
    <Card className="space-y-6 bg-zinc-950 border-zinc-800/50">
      <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-zinc-100">{piece.title}</h4>
          <p className="text-[10px] text-zinc-500 font-mono">{piece.serial_id}</p>
        </div>
        <Badge variant="amber" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{workflow.status}</Badge>
      </div>
      <div className="space-y-4">
        {steps.map(step => {
          const isDone = !!(workflow as any)[step.key];
          return (
            <div key={step.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                <span className={`text-xs transition-colors ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-zinc-100'}`}>{step.label}</span>
              </div>
              <button 
                onClick={() => !isDone && onUpdate(piece.id, step.id)}
                disabled={!!isDone}
                className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${
                  isDone 
                    ? 'bg-amber-500 border-amber-500 text-black' 
                    : 'border-zinc-800 hover:border-amber-500/50 bg-zinc-900/50'
                }`}
              >
                {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <Plus className="w-3 h-3 text-zinc-600" />}
              </button>
            </div>
          );
        })}
        {workflow.status === 'COMPLETED' && (
          <div className="pt-4 border-t border-zinc-900">
            <Button variant="outline" className="w-full py-2 text-[10px] uppercase tracking-widest font-bold" onClick={() => (window as any).handleGenerateCertificate(piece.id)}>
              <Award className="w-3 h-3" /> Generate Official COA
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
