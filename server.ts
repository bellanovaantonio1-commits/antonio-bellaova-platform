import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3000;
const db = new Database("vault.db");

app.use(express.json({ limit: '50mb' }));

// --- Database Initialization ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    address TEXT,
    role TEXT DEFAULT 'client', -- admin, client, vip, reseller, investor, seller, gallery, partner, institution
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    language TEXT DEFAULT 'de',
    is_vip INTEGER DEFAULT 0,
    account_type TEXT DEFAULT 'private', -- private, business
    business_data TEXT, -- JSON for company info
    reputation_score INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS masterpieces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_id TEXT UNIQUE,
    title TEXT,
    category TEXT,
    description TEXT,
    materials TEXT,
    gemstones TEXT,
    valuation REAL,
    rarity TEXT,
    production_time TEXT,
    cert_data TEXT,
    deposit_pct REAL DEFAULT 10,
    image_url TEXT,
    current_owner_id INTEGER,
    status TEXT DEFAULT 'available', -- available, reserved, sold, auction, resell_pending, reserved_vip, reserved_client, listed_private, negotiation, escrow_pending
    rarity_score INTEGER DEFAULT 0,
    blockchain_hash TEXT,
    nft_token_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(current_owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ownership_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    owner_id INTEGER,
    acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    price REAL,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    start_price REAL,
    current_bid REAL,
    highest_bidder_id INTEGER,
    end_time DATETIME,
    status TEXT DEFAULT 'active', -- active, ended
    vip_only INTEGER DEFAULT 0,
    terms TEXT,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(highest_bidder_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER,
    user_id INTEGER,
    amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(auction_id) REFERENCES auctions(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    masterpiece_id INTEGER,
    type TEXT, -- deposit, full
    amount REAL,
    status TEXT DEFAULT 'pending', -- pending, paid, rejected
    iban TEXT,
    reference TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    masterpiece_id INTEGER,
    type TEXT, -- purchase, deposit, invoice, vip, resale, certificate
    doc_ref TEXT UNIQUE,
    content TEXT,
    signed_at DATETIME,
    status TEXT DEFAULT 'draft', -- draft, signed, archived
    version INTEGER DEFAULT 1,
    parent_id INTEGER,
    metadata TEXT, -- JSON for versioning info, client ref, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(parent_id) REFERENCES contracts(id)
  );

  CREATE TABLE IF NOT EXISTS escrow_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    buyer_id INTEGER,
    seller_id INTEGER,
    amount REAL,
    status TEXT DEFAULT 'HELD', -- HELD, RELEASED, DISPUTED, REFUNDED
    dispute_window_ends DATETIME,
    milestones TEXT, -- JSON array of timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(buyer_id) REFERENCES users(id),
    FOREIGN KEY(seller_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    owner_id INTEGER,
    cert_id TEXT UNIQUE,
    content TEXT,
    qr_code TEXT,
    signature TEXT,
    blockchain_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS purchase_workflow (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER UNIQUE,
    user_id INTEGER,
    status TEXT DEFAULT 'PENDING_APPROVAL',
    approved_at DATETIME,
    approved_by INTEGER,
    deposit_contract_sent_at DATETIME,
    deposit_paid_at DATETIME,
    production_started_at DATETIME,
    production_finished_at DATETIME,
    ready_for_delivery_at DATETIME,
    final_payment_pending_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(approved_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    type TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    action TEXT,
    target_id TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS provenance_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    event_type TEXT, -- creation, exhibition, service, ownership_transfer, auction, certificate, vip_event
    description TEXT,
    event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS service_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    service_type TEXT, -- repair, cleaning, restoration, stone_replacement, polishing, inspection, other
    description TEXT,
    cost REAL,
    service_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    provider TEXT,
    attachments TEXT, -- JSON array of image/doc URLs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    user_id INTEGER,
    request_type TEXT, -- waitlist, commission
    preferred_budget REAL,
    preferred_materials TEXT,
    status TEXT DEFAULT 'waiting', -- waiting, contacted, converted, expired
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    user_id INTEGER,
    expires_at DATETIME,
    type TEXT, -- vip, client
    status TEXT DEFAULT 'active', -- active, expired, converted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS collector_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    bio TEXT,
    visibility TEXT DEFAULT 'private', -- public, private
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS concierge_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    masterpiece_id INTEGER,
    request_type TEXT, -- cleaning, repair, restoration, resizing, valuation_update, secure_transport, private_showing, insurance_assistance
    message TEXT,
    status TEXT DEFAULT 'requested', -- requested, scheduled, in_service, completed, cancelled
    assigned_admin_id INTEGER,
    priority TEXT DEFAULT 'standard', -- standard, vip
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(assigned_admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS concierge_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER,
    sender_id INTEGER,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES concierge_requests(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fractional_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    owner_id INTEGER,
    percentage REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS fractional_transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    from_owner_id INTEGER,
    to_owner_id INTEGER,
    percentage REAL,
    price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(from_owner_id) REFERENCES users(id),
    FOREIGN KEY(to_owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS revenue_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- resale_fee, concierge_fee, membership, auction_commission, fractional_fee, subscription, referral
    amount REAL,
    user_id INTEGER,
    masterpiece_id INTEGER,
    reference_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS production_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    step_index INTEGER,
    step_name TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed
    timestamp DATETIME,
    notes TEXT,
    media_url TEXT,
    staff_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(staff_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS delivery_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER UNIQUE,
    courier_name TEXT,
    tracking_number TEXT,
    scheduled_at DATETIME,
    status TEXT DEFAULT 'scheduled', -- scheduled, transit, delivered
    signature_data TEXT,
    delivery_photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS atelier_moments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    title TEXT,
    caption TEXT,
    media_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS user_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- investor, seller, partner, reseller
    portfolio_url TEXT,
    budget_range TEXT,
    interests TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    verification_docs TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS crm_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    admin_id INTEGER,
    type TEXT, -- note, call, meeting, email
    content TEXT,
    priority TEXT DEFAULT 'normal', -- normal, high, urgent
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS shipping_orchestration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    status TEXT DEFAULT 'pending', -- pending, pickup_scheduled, in_transit, customs, delivered
    courier TEXT,
    tracking_number TEXT,
    insurance_value REAL,
    white_glove INTEGER DEFAULT 0,
    custody_log TEXT, -- JSON array of events
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS insurance_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    provider TEXT,
    policy_number TEXT,
    coverage_amount REAL,
    premium REAL,
    expires_at DATETIME,
    status TEXT DEFAULT 'active', -- active, expired, pending
    document_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS private_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    location TEXT,
    event_date DATETIME,
    min_vip_tier INTEGER DEFAULT 0,
    max_attendees INTEGER,
    status TEXT DEFAULT 'upcoming', -- upcoming, completed, cancelled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS event_rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_id INTEGER,
    status TEXT DEFAULT 'pending', -- pending, confirmed, declined
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(event_id) REFERENCES private_events(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS collaborations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    partner_id INTEGER,
    masterpiece_id INTEGER,
    type TEXT, -- co-creation, limited_edition, press_launch
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(partner_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );

  CREATE TABLE IF NOT EXISTS resale_negotiations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    masterpiece_id INTEGER,
    seller_id INTEGER,
    buyer_id INTEGER,
    offered_price REAL,
    platform_fee REAL,
    status TEXT DEFAULT 'negotiation', -- negotiation, accepted, rejected, escrow
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id),
    FOREIGN KEY(seller_id) REFERENCES users(id),
    FOREIGN KEY(buyer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS private_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    negotiation_id INTEGER,
    sender_id INTEGER,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(negotiation_id) REFERENCES resale_negotiations(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS investor_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- allocation, meeting, preview, dataroom
    message TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS investor_view_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    masterpiece_id INTEGER,
    interest_level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(masterpiece_id) REFERENCES masterpieces(id)
  );
`);

try {
  db.prepare("ALTER TABLE masterpieces ADD COLUMN nft_token_id TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE auctions ADD COLUMN terms TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE auctions ADD COLUMN vip_only INTEGER DEFAULT 0").run();
} catch (e) {
  // Column might already exist
}

// Seed Admin
const adminExists = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@bellanova.com");
if (!adminExists) {
  db.prepare("INSERT INTO users (email, password, name, role, status) VALUES (?, ?, ?, ?, ?)").run(
    "admin@bellanova.com", "admin123", "Antonio Bellanova", "admin", "approved"
  );
}

// --- WebSocket Logic ---
const clients = new Set<WebSocket>();
wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

function broadcast(data: any) {
  const msg = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// --- Document Generation Engine ---
function generateLuxuryDocument(type: string, content: string, user: any, piece: any, options: any = {}) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const version = options.version || 1;
  const docRef = options.docRef || `${type.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  const clientRef = options.clientRef || `CL-${user.id}-${user.name.substring(0, 3).toUpperCase()}`;
  const serialNumber = piece.serial_id || 'AB-VAULT-000';
  
  const isCertificate = type.toUpperCase() === 'CERTIFICATE';
  const isInvoice = type.toUpperCase() === 'INVOICE';
  
  return `
    <div style="font-family: 'Inter', sans-serif; padding: 80px 60px; color: #1a1a1a; background: #ffffff; max-width: 850px; margin: auto; position: relative; line-height: 1.6; border: 1px solid #f0f0f0; min-height: 1100px;">
      <!-- Vertical Brand Typography -->
      <div style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%) rotate(-90deg); font-size: 10px; letter-spacing: 5px; color: #eee; text-transform: uppercase; white-space: nowrap; pointer-events: none;">
        ANTONIO BELLANOVA ATELIER • PRIVATE VAULT INSTRUMENT
      </div>
      <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%) rotate(90deg); font-size: 10px; letter-spacing: 5px; color: #eee; text-transform: uppercase; white-space: nowrap; pointer-events: none;">
        EST. 2024 • HAUTE JOAILLERIE • KÖLN • DEUTSCHLAND
      </div>

      <!-- Header Section -->
      <div style="text-align: center; margin-bottom: 80px;">
        <div style="font-family: 'Playfair Display', serif; font-size: 12px; letter-spacing: 8px; color: #c5a059; margin-bottom: 25px; font-weight: 400; text-transform: uppercase;">Antonio Bellanova</div>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 300; margin: 0; color: #000; letter-spacing: -1px; line-height: 1.1;">${options.title || type}</h1>
        
        <div style="display: flex; justify-content: center; gap: 40px; margin-top: 30px; border-top: 1px solid #f5f5f5; border-bottom: 1px solid #f5f5f5; padding: 15px 0;">
          <div style="text-align: left;">
            <div style="font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 2px;">Document Ref</div>
            <div style="font-size: 11px; font-weight: 600; color: #333;">${docRef}</div>
          </div>
          <div style="text-align: left;">
            <div style="font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 2px;">Client Ref</div>
            <div style="font-size: 11px; font-weight: 600; color: #333;">${clientRef}</div>
          </div>
          <div style="text-align: left;">
            <div style="font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 2px;">Version</div>
            <div style="font-size: 11px; font-weight: 600; color: #333;">v${version}.0</div>
          </div>
          <div style="text-align: left;">
            <div style="font-size: 8px; color: #999; text-transform: uppercase; letter-spacing: 2px;">Date</div>
            <div style="font-size: 11px; font-weight: 600; color: #333;">${date}</div>
          </div>
        </div>
      </div>

      <!-- Hero Section -->
      <div style="margin-bottom: 80px;">
        ${piece.image_url ? `
          <div style="margin-bottom: 35px; overflow: hidden; background: #fafafa; border: 1px solid #f9f9f9; padding: 10px;">
            <img src="${piece.image_url}" style="width: 100%; height: 450px; object-fit: cover; display: block; filter: grayscale(20%);">
          </div>
        ` : ''}
        <div style="text-align: center; max-width: 650px; margin: 0 auto;">
          <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; margin-bottom: 12px; color: #000;">${piece.title}</h2>
          <div style="font-size: 8px; letter-spacing: 4px; color: #c5a059; text-transform: uppercase; margin-bottom: 15px;">Serial: ${serialNumber}</div>
          <p style="font-size: 14px; color: #777; font-style: italic; font-weight: 300; line-height: 1.8;">${piece.description.substring(0, 180)}...</p>
        </div>
      </div>

      <!-- Pricing / Data Block -->
      <div style="background: #fafafa; padding: 40px; margin-bottom: 80px; border: 1px solid #f0f0f0;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div>
            <div style="font-size: 8px; letter-spacing: 2px; color: #c5a059; text-transform: uppercase; margin-bottom: 15px; font-weight: 700;">Asset Specifications</div>
            <div style="margin-bottom: 15px;">
              <div style="font-size: 10px; color: #999;">Materials</div>
              <div style="font-size: 13px; color: #333;">${piece.materials}</div>
            </div>
            <div>
              <div style="font-size: 10px; color: #999;">Gemstones</div>
              <div style="font-size: 13px; color: #333;">${piece.gemstones}</div>
            </div>
          </div>
          <div>
            <div style="font-size: 8px; letter-spacing: 2px; color: #c5a059; text-transform: uppercase; margin-bottom: 15px; font-weight: 700;">Financial Summary</div>
            <div style="margin-bottom: 15px;">
              <div style="font-size: 10px; color: #999;">Total Valuation</div>
              <div style="font-size: 16px; font-weight: 600; color: #000;">${Number(piece.valuation).toLocaleString()} EUR</div>
            </div>
            ${isInvoice ? `
              <div>
                <div style="font-size: 10px; color: #999;">Balance Due</div>
                <div style="font-size: 16px; font-weight: 600; color: #c5a059;">${Number(options.balanceDue || 0).toLocaleString()} EUR</div>
              </div>
            ` : `
              <div>
                <div style="font-size: 10px; color: #999;">Status</div>
                <div style="font-size: 13px; color: #333; text-transform: uppercase; letter-spacing: 1px;">${piece.status}</div>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Content Body -->
      <div style="margin-bottom: 80px; font-size: 14px; color: #444; line-height: 2; font-weight: 300; text-align: justify;">
        ${content.split('\n\n').map(p => `<p style="margin-bottom: 25px;">${p.replace(/\n/g, '<br>')}</p>`).join('')}
        
        ${options.escrowEnabled ? `
          <div style="margin-top: 40px; padding: 25px; border: 1px dashed #c5a059; background: #fffcf5;">
            <div style="font-size: 10px; font-weight: 700; color: #c5a059; text-transform: uppercase; margin-bottom: 10px;">Escrow Protection Enabled</div>
            <div style="font-size: 12px; color: #8a6d3b;">Funds for this transaction are held securely by the Antonio Bellanova Vault Escrow Service. Release of funds to the Atelier occurs only upon verified delivery and the expiration of the 48-hour inspection period.</div>
          </div>
        ` : ''}
      </div>

      <!-- Signature Block -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 120px;">
        <div>
          <div style="font-family: 'Playfair Display', serif; font-size: 28px; color: #000; margin-bottom: 10px; font-style: italic; font-weight: 300;">Antonio Bellanova</div>
          <div style="width: 100%; height: 1px; background: #c5a059; margin-bottom: 10px; opacity: 0.4;"></div>
          <div style="font-size: 8px; color: #aaa; letter-spacing: 2px; text-transform: uppercase;">Atelier Director Signature</div>
        </div>
        <div>
          <div style="height: 42px; margin-bottom: 10px;"></div>
          <div style="width: 100%; height: 1px; background: #eee; margin-bottom: 10px;"></div>
          <div style="font-size: 8px; color: #aaa; letter-spacing: 2px; text-transform: uppercase;">Client Endorsement: ${user.name}</div>
        </div>
      </div>

      <!-- Footer / Digital Seal -->
      <div style="margin-top: 80px; text-align: center; border-top: 1px solid #f5f5f5; padding-top: 40px;">
        <div style="width: 50px; height: 50px; border: 1px solid rgba(197, 160, 89, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
          <div style="font-size: 10px; color: #c5a059; letter-spacing: 1px; font-weight: 700;">AB</div>
        </div>
        <div style="font-size: 7px; color: #ddd; letter-spacing: 3px; text-transform: uppercase;">Verified Blockchain Hash: ${piece.blockchain_hash || 'PENDING_VERIFICATION'}</div>
      </div>
    </div>
  `;
}

function notifyUser(userId: number, message: string, type: string = 'info') {
  db.prepare("INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)").run(userId, message, type);
  broadcast({ type: 'NOTIFICATION', userId, message, notificationType: type });
}

function logAudit(adminId: number, action: string, targetId: string, details: string) {
  db.prepare("INSERT INTO audit_logs (admin_id, action, target_id, details) VALUES (?, ?, ?, ?)").run(adminId, action, targetId, details);
}

function updateProvenance(masterpieceId: number, eventType: string, description: string, metadata: any = {}) {
  db.prepare("INSERT INTO provenance_timeline (masterpiece_id, event_type, description, metadata) VALUES (?, ?, ?, ?)").run(
    masterpieceId, eventType, description, JSON.stringify(metadata)
  );
}

function calculateRarityScore(masterpieceId: number) {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  if (!piece) return 0;

  let score = 0;
  
  // 1. Edition Size / Rarity Category (0-40)
  const rarityMap: Record<string, number> = { 'Unique': 40, 'Limited': 25, 'Rare': 15, 'Standard': 5 };
  score += rarityMap[piece.rarity] || 0;

  // 2. Materials & Gemstones (0-20)
  if (piece.materials.toLowerCase().includes('gold') || piece.materials.toLowerCase().includes('platinum')) score += 10;
  if (piece.gemstones.split(',').length > 3) score += 10;

  // 3. Provenance Depth (0-20)
  const provenanceCount = db.prepare("SELECT COUNT(*) as count FROM provenance_timeline WHERE masterpiece_id = ?").get(masterpieceId).count;
  score += Math.min(provenanceCount * 2, 20);

  // 4. Service History (0-10)
  const serviceCount = db.prepare("SELECT COUNT(*) as count FROM service_history WHERE masterpiece_id = ?").get(masterpieceId).count;
  score += Math.min(serviceCount * 2, 10);

  // 5. Auction Demand (0-10)
  const bidCount = db.prepare("SELECT COUNT(*) as count FROM bids b JOIN auctions a ON b.auction_id = a.id WHERE a.masterpiece_id = ?").get(masterpieceId).count;
  score += Math.min(bidCount, 10);

  db.prepare("UPDATE masterpieces SET rarity_score = ? WHERE id = ?").run(score, masterpieceId);
  return score;
}

// --- API Routes ---

// Auth
app.post("/api/register", (req, res) => {
  const { email, password, name, address, wantsVip, language, role } = req.body;
  try {
    const result = db.prepare("INSERT INTO users (email, password, name, address, is_vip, language, role) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      email, password, name, address, wantsVip ? 1 : 0, language || 'de', role || 'client'
    );
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
  if (user) {
    if (user.status !== 'approved') return res.status(403).json({ error: "Account pending approval" });
    res.json(user);
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Masterpieces
app.get("/api/masterpieces", (req, res) => {
  const pieces = db.prepare("SELECT * FROM masterpieces").all();
  res.json(pieces);
});

app.post("/api/admin/assign-piece", (req, res) => {
  const { userId, masterpieceId } = req.body;
  db.prepare("UPDATE masterpieces SET current_owner_id = ?, status = 'sold' WHERE id = ?").run(userId, masterpieceId);
  
  // Create ownership history
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  db.prepare("INSERT INTO ownership_history (masterpiece_id, owner_id, price) VALUES (?, ?, ?)").run(
    masterpieceId, userId, piece.valuation
  );
  
  broadcast({ type: 'PIECE_ASSIGNED', userId, masterpieceId });
  res.json({ success: true });
});

app.post("/api/admin/masterpieces", (req, res) => {
  const { title, serial_id, category, description, materials, gemstones, valuation, rarity, production_time, cert_data, deposit_pct, image_url } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO masterpieces (title, serial_id, category, description, materials, gemstones, valuation, rarity, production_time, cert_data, deposit_pct, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, serial_id, category, description, materials, gemstones, valuation, rarity, production_time, cert_data, deposit_pct, image_url);
    broadcast({ type: 'MASTERPIECE_CREATED', id: result.lastInsertRowid });
    
    // Initial Provenance
    updateProvenance(Number(result.lastInsertRowid), 'creation', `Masterpiece "${title}" created at Antonio Bellanova Atelier.`);
    calculateRarityScore(Number(result.lastInsertRowid));

    res.json({ id: result.lastInsertRowid });
  } catch (e: any) {
    if (e.message.includes("UNIQUE constraint failed: masterpieces.serial_id")) {
      res.status(400).json({ error: "Serial ID already exists. Each masterpiece must have a unique identifier." });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Investor Features
app.get("/api/investor/analytics", (req, res) => {
  const totalValuation = db.prepare("SELECT SUM(valuation) as total FROM masterpieces").get().total || 0;
  const piecesSold = db.prepare("SELECT COUNT(*) as count FROM masterpieces WHERE status = 'sold'").get().count;
  const totalBids = db.prepare("SELECT COUNT(*) as count FROM bids").get().count;
  
  // Mocking some metrics for the luxury feel
  const analytics = {
    platform_valuation: totalValuation,
    pieces_sold: piecesSold,
    appreciation_metrics: {
      avg_appreciation: 12.4,
      top_performing_category: "High Jewelry"
    },
    auction_performance: {
      total_bids: totalBids,
      avg_bid_increase: 18.5
    },
    rarity_distribution: {
      "Unique": db.prepare("SELECT COUNT(*) as count FROM masterpieces WHERE rarity = 'Unique'").get().count,
      "Limited": db.prepare("SELECT COUNT(*) as count FROM masterpieces WHERE rarity = 'Limited'").get().count
    },
    liquidity_forecast: totalValuation * 0.15,
    scarcity_index: 94
  };
  res.json(analytics);
});

app.post("/api/investor/request", (req, res) => {
  const { userId, type, message } = req.body;
  db.prepare("INSERT INTO investor_requests (user_id, type, message) VALUES (?, ?, ?)").run(userId, type, message);
  res.json({ success: true });
});

app.get("/api/admin/investor-requests", (req, res) => {
  const requests = db.prepare(`
    SELECT ir.*, u.name as user_name, u.email as user_email 
    FROM investor_requests ir 
    JOIN users u ON ir.user_id = u.id 
    ORDER BY ir.created_at DESC
  `).all();
  res.json(requests);
});

app.post("/api/investor/log-view", (req, res) => {
  const { userId, masterpieceId, interestLevel } = req.body;
  db.prepare("INSERT INTO investor_view_logs (user_id, masterpiece_id, interest_level) VALUES (?, ?, ?)").run(
    userId, masterpieceId, interestLevel || 1
  );
  res.json({ success: true });
});

app.get("/api/investor/view-logs", (req, res) => {
  const logs = db.prepare(`
    SELECT ivl.*, m.title as masterpiece_title 
    FROM investor_view_logs ivl 
    JOIN masterpieces m ON ivl.masterpiece_id = m.id 
    ORDER BY ivl.created_at DESC
  `).all();
  res.json(logs);
});
app.post("/api/marketplace/buy", (req, res) => {
  const { userId, masterpieceId } = req.body;
  db.prepare("UPDATE masterpieces SET status = 'reserved' WHERE id = ?").run(masterpieceId);
  
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  const depositAmount = (piece.valuation * piece.deposit_pct) / 100;
  
  const content = `
    ANZAHLUNGSVERTRAG (DEPOSIT AGREEMENT)
    
    VERKÄUFER: Antonio Bellanova Atelier, Aaronstraße 8, 50076 Köln
    KÄUFER: ${user.name}, ${user.address}
    
    GEGENSTAND: ${piece.title} (Serial ID: ${piece.serial_id})
    GESAMTPREIS: ${piece.valuation} EUR
    ANZAHLUNGSBETRAG (${piece.deposit_pct}%): ${depositAmount} EUR
    
    RECHTLICHE HINWEISE:
    1. Mit Unterzeichnung dieses Vertrages reserviert der Verkäufer das oben genannte Stück für den Käufer.
    2. Der Käufer verpflichtet sich zur Zahlung der Anzahlung innerhalb von 7 Werktagen.
    3. Erst nach vollständiger Zahlung des Gesamtbetrages geht das Eigentum über.
    4. Bei Nichtzahlung der Anzahlung erlischt die Reservierung.
    
    Bankverbindung für die Anzahlung:
    IBAN: DE12 3456 7890 1234 5678 90
    Empfänger: Antonio Bellanova Atelier
    Verwendungszweck: DEP-${piece.serial_id}-${user.id}
    
    Datum: ${new Date().toLocaleDateString('de-DE')}
  `;
  db.prepare("INSERT INTO contracts (user_id, masterpiece_id, type, content) VALUES (?, ?, ?, ?)").run(
    userId, masterpieceId, 'deposit', content
  );
  
  broadcast({ type: 'MASTERPIECE_RESERVED', id: masterpieceId });
  res.json({ success: true });
});

app.post("/api/admin/approve-purchase", (req, res) => {
  const { masterpieceId, approve, adminId } = req.body;
  
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  const contract = db.prepare("SELECT * FROM contracts WHERE masterpiece_id = ? AND type = 'deposit' ORDER BY id DESC").get(masterpieceId);
  
  if (!contract) return res.status(404).json({ error: "Contract not found" });

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(contract.user_id);

  if (approve) {
    // Check for duplicate approval
    const existingWorkflow = db.prepare("SELECT * FROM purchase_workflow WHERE masterpiece_id = ?").get(masterpieceId);
    if (existingWorkflow) return res.status(400).json({ error: "Purchase already approved" });

    // 1. Update status & workflow
    db.prepare(`
      INSERT INTO purchase_workflow (masterpiece_id, user_id, status, approved_at, approved_by, deposit_contract_sent_at)
      VALUES (?, ?, 'RESERVED', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
    `).run(masterpieceId, user.id, adminId);

    // 2. Generate Documents
    const depositAmount = (piece.valuation * piece.deposit_pct) / 100;
    const docRef = `DEP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Deposit Contract
    const depositContent = `This binding instrument confirms the formal reservation of the Masterpiece identified as "${piece.title}" (Serial: ${piece.serial_id}).\n\nBy executing this agreement, the Client acknowledges a commitment to the acquisition of the aforementioned asset at a total valuation of ${piece.valuation.toLocaleString()} EUR.\n\nA non-refundable commitment deposit of ${depositAmount.toLocaleString()} EUR (${piece.deposit_pct}% of total valuation) is required to initiate the bespoke production phase and secure the asset within the Antonio Bellanova Vault.\n\nUpon receipt of funds, the Atelier shall commence the handcrafted realization of the piece. Ownership remains with the Atelier until final settlement.`;
    const depositHtml = generateLuxuryDocument("Deposit Agreement", depositContent, user, piece, { docRef, title: "Deposit Agreement" });
    db.prepare("INSERT INTO contracts (user_id, masterpiece_id, type, doc_ref, content, status) VALUES (?, ?, 'deposit', ?, ?, 'draft')").run(
      user.id, masterpieceId, docRef, depositHtml
    );

    // 3. Notification
    notifyUser(user.id, "Your acquisition request has been approved. The Deposit Agreement is ready for signature in your Vault.", "success");
    updateProvenance(masterpieceId, 'vip_event', `Acquisition request approved for client ${user.name}.`);

    // 4. Start Payment Workflow
    db.prepare(`
      INSERT INTO payments (user_id, masterpiece_id, type, amount, status, iban, reference)
      VALUES (?, ?, 'deposit', ?, 'awaiting_deposit', 'DE35 2022 0800 0056 5751 78', ?)
    `).run(user.id, masterpieceId, depositAmount, docRef);

    logAudit(adminId, 'APPROVE_PURCHASE', masterpieceId.toString(), `Approved purchase for user ${user.id} - Status: RESERVED`);
  }
 else {
    db.prepare("UPDATE masterpieces SET status = 'available' WHERE id = ?").run(masterpieceId);
    notifyUser(user.id, "Your purchase request for " + piece.title + " was not approved.", "warning");
    logAudit(adminId, 'REJECT_PURCHASE', masterpieceId.toString(), `Rejected purchase for user ${user.id}`);
  }

  broadcast({ type: 'PURCHASE_REVIEWED', id: masterpieceId, approved: approve });
  res.json({ success: true });
});

// --- NFT Minting Service (Mock) ---
async function mintNFT(masterpieceId: number, ownerId: number): Promise<string> {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  const owner = db.prepare("SELECT * FROM users WHERE id = ?").get(ownerId);
  
  // Simulate blockchain minting process
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const tokenId = `NFT-${piece.serial_id}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  
  db.prepare("UPDATE masterpieces SET nft_token_id = ? WHERE id = ?").run(tokenId, masterpieceId);
  
  updateProvenance(masterpieceId, 'certificate', `Digital Ownership NFT minted. Token ID: ${tokenId}. Registered to ${owner.name}.`);
  
  return tokenId;
}

app.post("/api/admin/workflow/update", (req, res) => {
  const { masterpieceId, step, adminId } = req.body;
  const workflow = db.prepare("SELECT * FROM purchase_workflow WHERE masterpiece_id = ?").get(masterpieceId);
  if (!workflow) return res.status(404).json({ error: "Workflow not found" });

  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(workflow.user_id);

  let updateField = "";
  let newStatus = "";
  let message = "";

  switch (step) {
    case 'deposit_paid':
      updateField = "deposit_paid_at";
      newStatus = "PRODUCTION_STARTED";
      message = `Deposit for ${piece.title} received. Handcrafted production has officially commenced.`;
      db.prepare("UPDATE payments SET status = 'paid' WHERE masterpiece_id = ? AND type = 'deposit'").run(masterpieceId);
      db.prepare("UPDATE masterpieces SET status = 'reserved' WHERE id = ?").run(masterpieceId);
      break;
    case 'production_finished':
      updateField = "production_finished_at";
      newStatus = "AWAITING_FINAL_PAYMENT";
      message = `Production for ${piece.title} is complete. Your Final Invoice has been generated.`;
      
      // Generate Final Invoice
      const balanceDue = piece.valuation - (piece.valuation * piece.deposit_pct / 100);
      const invRef = `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const invContent = `FINAL INVOICE FOR ACQUISITION\n\nThis invoice represents the final settlement for the Masterpiece "${piece.title}".\n\nTotal Valuation: ${piece.valuation.toLocaleString()} EUR\nDeposit Paid: ${(piece.valuation * piece.deposit_pct / 100).toLocaleString()} EUR\nRemaining Balance: ${balanceDue.toLocaleString()} EUR\n\nPayment is due within 14 days to initiate the Escrow Release and Delivery phase. Ownership transfer will be executed upon successful escrow release.`;
      const invHtml = generateLuxuryDocument("Final Invoice", invContent, user, piece, { 
        docRef: invRef, 
        title: "Final Invoice",
        balanceDue,
        escrowEnabled: true 
      });
      db.prepare("INSERT INTO contracts (user_id, masterpiece_id, type, doc_ref, content, status) VALUES (?, ?, 'invoice', ?, ?, 'draft')").run(
        user.id, masterpieceId, invRef, invHtml
      );
      
      db.prepare(`
        INSERT INTO payments (user_id, masterpiece_id, type, amount, status, iban, reference)
        VALUES (?, ?, 'full', ?, 'awaiting_payment', 'DE35 2022 0800 0056 5751 78', ?)
      `).run(user.id, masterpieceId, balanceDue, invRef);
      break;
    case 'final_payment_paid':
      updateField = "final_payment_pending_at";
      newStatus = "FUNDS_HELD";
      message = `Final payment received. Funds are now held in Escrow. Preparing for delivery.`;
      db.prepare("UPDATE payments SET status = 'paid' WHERE masterpiece_id = ? AND type = 'full'").run(masterpieceId);
      
      // Initialize Escrow
      db.prepare(`
        INSERT INTO escrow_transactions (masterpiece_id, buyer_id, seller_id, amount, status, dispute_window_ends)
        VALUES (?, ?, 1, ?, 'HELD', datetime('now', '+2 days'))
      `).run(masterpieceId, user.id, piece.valuation);
      break;
    case 'delivered':
      updateField = "ready_for_delivery_at";
      newStatus = "DELIVERED";
      message = `Your masterpiece ${piece.title} has been delivered. Please confirm receipt in your Vault to release escrow.`;
      break;
    case 'completed':
      updateField = "completed_at";
      newStatus = "COMPLETED";
      message = `Ownership of ${piece.title} has been officially transferred to you. Congratulations.`;
      
      // Release Escrow
      db.prepare("UPDATE escrow_transactions SET status = 'RELEASED' WHERE masterpiece_id = ?").run(masterpieceId);
      db.prepare("UPDATE masterpieces SET current_owner_id = ?, status = 'sold' WHERE id = ?").run(user.id, masterpieceId);
      
      updateProvenance(masterpieceId, 'ownership_transfer', `Ownership officially transferred to ${user.name}.`);

      // Generate Certificate of Authenticity
      const certRef = `CERT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const certContent = `CERTIFICATE OF AUTHENTICITY & OWNERSHIP\n\nThis definitive instrument serves as the permanent record of provenance for the Masterpiece "${piece.title}".\n\nHandcrafted within the Antonio Bellanova Atelier, this asset is now officially registered to the collection of ${user.name}.\n\nAsset Specifications:\nSerial Number: ${piece.serial_id}\nBlockchain Hash: ${piece.blockchain_hash || 'AB-SECURE-HASH-772'}\n\nThe Atelier hereby guarantees the authenticity and exceptional quality of this unique creation in perpetuity.`;
      const certHtml = generateLuxuryDocument("Certificate of Authenticity", certContent, user, piece, { docRef: certRef, title: "Certificate of Authenticity" });
      db.prepare("INSERT INTO contracts (user_id, masterpiece_id, type, doc_ref, content, status) VALUES (?, ?, 'certificate', ?, ?, 'signed')").run(
        user.id, masterpieceId, certRef, certHtml
      );

      // Trigger NFT Minting
      mintNFT(masterpieceId, user.id).then(tokenId => {
        broadcast({ type: 'NFT_MINTED', masterpieceId, tokenId, userId: user.id });
      }).catch(err => {
        console.error("NFT Minting failed:", err);
      });
      break;
  }

  if (updateField) {
    db.prepare(`UPDATE purchase_workflow SET ${updateField} = CURRENT_TIMESTAMP, status = ? WHERE masterpiece_id = ?`).run(newStatus, masterpieceId);
    notifyUser(workflow.user_id, message, "success");
    logAudit(adminId, 'WORKFLOW_UPDATE', masterpieceId.toString(), `Updated step ${step} to ${newStatus}`);
    broadcast({ type: 'WORKFLOW_UPDATED', masterpieceId, status: newStatus });
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Invalid step" });
  }
});

app.get("/api/notifications/:userId", (req, res) => {
  const notifications = db.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.params.userId);
  res.json(notifications);
});

app.get("/api/workflow/:masterpieceId", (req, res) => {
  const workflow = db.prepare("SELECT * FROM purchase_workflow WHERE masterpiece_id = ?").get(req.params.masterpieceId);
  res.json(workflow || null);
});

app.get("/api/escrow/:masterpieceId", (req, res) => {
  const escrow = db.prepare("SELECT * FROM escrow_transactions WHERE masterpiece_id = ? ORDER BY created_at DESC LIMIT 1").get(req.params.masterpieceId);
  res.json(escrow || null);
});

// Auctions
app.get("/api/auctions", (req, res) => {
  const userId = req.query.userId;
  const user = userId ? db.prepare("SELECT * FROM users WHERE id = ?").get(userId) : null;
  const isVip = user && (user.role === 'vip' || user.role === 'admin');

  let query = `
    SELECT a.*, m.title, m.image_url, m.description 
    FROM auctions a 
    JOIN masterpieces m ON a.masterpiece_id = m.id 
    WHERE a.status = 'active'
  `;

  if (!isVip) {
    query += " AND a.vip_only = 0";
  }

  const activeAuctions = db.prepare(query).all();
  res.json(activeAuctions);
});

app.get("/api/auctions/:auctionId/bids", (req, res) => {
  const { auctionId } = req.params;
  const bids = db.prepare(`
    SELECT b.*, u.name as bidder_name 
    FROM bids b 
    JOIN users u ON b.user_id = u.id 
    WHERE b.auction_id = ? 
    ORDER BY b.amount DESC
  `).all(auctionId);
  res.json(bids);
});

app.post("/api/admin/auctions", (req, res) => {
  const { masterpieceId, startPrice, endTime, vipOnly, terms } = req.body;
  const result = db.prepare(`
    INSERT INTO auctions (masterpiece_id, start_price, current_bid, end_time, vip_only, terms)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(masterpieceId, startPrice, startPrice, endTime, vipOnly ? 1 : 0, terms || "Standard luxury auction terms apply. 10% buyer's premium. Secure transport included.");
  
  db.prepare("UPDATE masterpieces SET status = 'auction' WHERE id = ?").run(masterpieceId);
  updateProvenance(masterpieceId, 'auction', `Masterpiece listed for auction with starting price of ${startPrice} EUR.`);
  
  broadcast({ type: 'AUCTION_CREATED', id: result.lastInsertRowid });
  res.json({ id: result.lastInsertRowid });
});

app.post("/api/auctions/bid", (req, res) => {
  const { auctionId, userId, amount } = req.body;
  const auction = db.prepare("SELECT * FROM auctions WHERE id = ?").get(auctionId);
  if (amount <= auction.current_bid) return res.status(400).json({ error: "Bid too low" });
  
  db.prepare("UPDATE auctions SET current_bid = ?, highest_bidder_id = ? WHERE id = ?").run(amount, userId, auctionId);
  db.prepare("INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)").run(auctionId, userId, amount);
  
  broadcast({ type: 'NEW_BID', auctionId, amount, userId });
  res.json({ success: true });
});

// Payments
app.get("/api/payments/:userId", (req, res) => {
  const payments = db.prepare("SELECT * FROM payments WHERE user_id = ?").all(req.params.userId);
  res.json(payments);
});

// Certificates
app.get("/api/certificates/:userId", (req, res) => {
  const certs = db.prepare("SELECT * FROM certificates WHERE owner_id = ?").all(req.params.userId);
  res.json(certs);
});

app.post("/api/admin/generate-certificate", (req, res) => {
  const { masterpieceId, adminId } = req.body;
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  
  if (!piece || !piece.current_owner_id) {
    return res.status(400).json({ error: "Masterpiece must have an owner to generate a certificate." });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(piece.current_owner_id);
  const certId = `CERT-${piece.serial_id}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  
  const certContent = `CERTIFICATE OF AUTHENTICITY & PROVENANCE\n\nThis definitive instrument serves as the permanent record of authenticity for the Masterpiece "${piece.title}".\n\nHandcrafted within the Antonio Bellanova Atelier, this asset is officially registered to the collection of ${user.name}.\n\nAsset Specifications:\nSerial Number: ${piece.serial_id}\nMaterials: ${piece.materials}\nGemstones: ${piece.gemstones}\nBlockchain Hash: ${piece.blockchain_hash || 'AB-SECURE-HASH-' + Math.random().toString(16).slice(2, 10).toUpperCase()}\n\nThe Atelier hereby guarantees the authenticity and exceptional quality of this unique creation in perpetuity.`;
  
  const certHtml = generateLuxuryDocument("Certificate of Authenticity", certContent, user, piece, { 
    docRef: certId, 
    title: "Certificate of Authenticity" 
  });

  try {
    db.prepare("INSERT INTO certificates (masterpiece_id, owner_id, cert_id, content, signature, blockchain_hash) VALUES (?, ?, ?, ?, ?, ?)").run(
      masterpieceId, user.id, certId, certHtml, 'DIGITAL_SIG_ANTONIO_BELLANOVA', piece.blockchain_hash || '0x' + Math.random().toString(16).slice(2)
    );
    
    updateProvenance(masterpieceId, 'certificate', `Official Certificate of Authenticity issued by Antonio Bellanova (ID: ${certId}).`);
    calculateRarityScore(masterpieceId);
    logAudit(adminId, 'GENERATE_CERTIFICATE', masterpieceId.toString(), `Generated COA for user ${user.id}`);
    
    broadcast({ type: 'CERTIFICATE_GENERATED', userId: user.id, masterpieceId });
    res.json({ success: true, certId });
  } catch (e) {
    res.status(500).json({ error: "Failed to generate certificate. It may already exist." });
  }
});

app.post("/api/admin/confirm-payment", (req, res) => {
  const { paymentId } = req.body;
  const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(paymentId);
  db.prepare("UPDATE payments SET status = 'paid' WHERE id = ?").run(paymentId);
  
  db.prepare("UPDATE masterpieces SET status = 'sold', current_owner_id = ? WHERE id = ?").run(
    payment.user_id, payment.masterpiece_id
  );
  db.prepare("INSERT INTO ownership_history (masterpiece_id, owner_id, price) VALUES (?, ?, ?)").run(
    payment.masterpiece_id, payment.user_id, payment.amount
  );
  
  const certId = `CERT-${payment.masterpiece_id}-${Date.now()}`;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payment.user_id);
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(payment.masterpiece_id);
  
  const certContent = `
    ECHTHEITSZERTIFIKAT / CERTIFICATE OF AUTHENTICITY
    
    STÜCKINFORMATIONEN:
    Titel: ${piece.title}
    Serien-ID: ${piece.serial_id}
    Materialien: ${piece.materials}
    Edelsteine: ${piece.gemstones}
    
    KÄUFER:
    Name: ${user.name}
    Adresse: ${user.address}
    
    VERKÄUFER:
    Antonio Bellanova Atelier
    Aaronstraße 8, 50076 Köln, Deutschland
    
    Dieses Zertifikat bestätigt die Echtheit und den rechtmäßigen Erwerb des oben genannten Meisterwerks.
    
    Ausstellungsdatum: ${new Date().toLocaleDateString('de-DE')}
    Zertifikats-ID: ${certId}
  `;

  db.prepare("INSERT INTO certificates (masterpiece_id, owner_id, cert_id, content, signature, blockchain_hash) VALUES (?, ?, ?, ?, ?, ?)").run(
    payment.masterpiece_id, payment.user_id, certId, certContent, 'DIGITAL_SIG_AB', '0x' + Math.random().toString(16).slice(2)
  );
  
  updateProvenance(payment.masterpiece_id, 'certificate', `Certificate of Authenticity issued (ID: ${certId}).`);
  calculateRarityScore(payment.masterpiece_id);

  broadcast({ type: 'PAYMENT_CONFIRMED', paymentId, masterpieceId: payment.masterpiece_id });
  res.json({ success: true });
});

// Vault Data
app.get("/api/vault/:userId", (req, res) => {
  const userId = req.params.userId;
  const pieces = db.prepare("SELECT * FROM masterpieces WHERE current_owner_id = ?").all(userId);
  const certs = db.prepare("SELECT * FROM certificates WHERE owner_id = ?").all(userId);
  const contracts = db.prepare("SELECT * FROM contracts WHERE user_id = ?").all(userId);
  res.json({ pieces, certs, contracts });
});

// Admin Dashboard Stats
app.get("/api/admin/stats", (req, res) => {
  const totalRevenue = db.prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'paid'").get().total || 0;
  const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'approved'").get().count;
  const pendingApprovals = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'").get().count;
  res.json({ totalRevenue, activeUsers, pendingApprovals });
});

app.get("/api/admin/users", (req, res) => {
  const users = db.prepare("SELECT * FROM users").all();
  res.json(users);
});

app.get("/api/admin/contracts", (req, res) => {
  const contracts = db.prepare(`
    SELECT c.*, u.name as user_name, m.title as piece_title 
    FROM contracts c 
    JOIN users u ON c.user_id = u.id 
    LEFT JOIN masterpieces m ON c.masterpiece_id = m.id
  `).all();
  res.json(contracts);
});

app.post("/api/admin/clients/add", (req, res) => {
  const { email, name, address, role, isVip } = req.body;
  const token = Math.random().toString(36).substring(2, 15);
  try {
    const result = db.prepare("INSERT INTO users (email, name, address, role, is_vip, status, password) VALUES (?, ?, ?, ?, ?, 'approved', ?)").run(
      email, name, address, role || 'client', isVip ? 1 : 0, token
    );
    notifyUser(result.lastInsertRowid, "Welcome to the Antonio Bellanova Atelier. Your private vault has been created.", "success");
    res.json({ id: result.lastInsertRowid, token });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/admin/approve-user", (req, res) => {
  const { userId, approve } = req.body;
  if (approve) {
    db.prepare("UPDATE users SET status = 'approved' WHERE id = ?").run(userId);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (user.is_vip) {
      const content = `VIP-Mitgliedschaftsvereinbarung für ${user.name}. Zugang zu exklusiven Auktionen und Concierge-Service.`;
      db.prepare("INSERT INTO contracts (user_id, type, content) VALUES (?, ?, ?)").run(userId, 'vip', content);
    }
  } else {
    db.prepare("UPDATE users SET status = 'rejected' WHERE id = ?").run(userId);
  }
  res.json({ success: true });
});

// Contracts
app.post("/api/contracts/sign", (req, res) => {
  const { contractId } = req.body;
  db.prepare("UPDATE contracts SET status = 'signed', signed_at = CURRENT_TIMESTAMP WHERE id = ?").run(contractId);
  
  const contract = db.prepare("SELECT * FROM contracts WHERE id = ?").get(contractId);
  if (contract.type === 'vip') {
    db.prepare("UPDATE users SET role = 'vip' WHERE id = ?").run(contract.user_id);
  }
  
  broadcast({ type: 'CONTRACT_SIGNED', contractId, userId: contract.user_id });
  res.json({ success: true });
});

// Resale
app.post("/api/resale/list", (req, res) => {
  const { userId, masterpieceId, price } = req.body;
  db.prepare("UPDATE masterpieces SET status = 'resell_pending', valuation = ? WHERE id = ? AND current_owner_id = ?").run(
    price, masterpieceId, userId
  );
  broadcast({ type: 'RESALE_REQUESTED', masterpieceId });
  res.json({ success: true });
});

app.post("/api/admin/approve-resale", (req, res) => {
  const { masterpieceId, approve } = req.body;
  if (approve) {
    db.prepare("UPDATE masterpieces SET status = 'available', current_owner_id = NULL WHERE id = ?").run(masterpieceId);
  } else {
    db.prepare("UPDATE masterpieces SET status = 'sold' WHERE id = ?").run(masterpieceId);
  }
  broadcast({ type: 'RESALE_REVIEWED', masterpieceId, approved: approve });
  res.json({ success: true });
});

// VIP Concierge
app.post("/api/vip/concierge", (req, res) => {
  const { userId, message } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user || user.role !== 'vip') return res.status(403).json({ error: "VIP access required" });
  
  // In a real app, this would send an email or notification to Antonio
  console.log(`VIP Concierge Request from ${user.name}: ${message}`);
  res.json({ success: true, response: "Your request has been received. Antonio will contact you shortly." });
});

// --- New Expansion Modules API ---

// 1. Provenance Timeline
app.get("/api/provenance/:masterpieceId", (req, res) => {
  const timeline = db.prepare("SELECT * FROM provenance_timeline WHERE masterpiece_id = ? ORDER BY event_date DESC").all(req.params.masterpieceId);
  res.json(timeline);
});

// 2. Private Resale Module (Extended)
app.post("/api/resale/list", (req, res) => {
  const { userId, masterpieceId, price } = req.body;
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  if (piece.current_owner_id !== userId) return res.status(403).json({ error: "Unauthorized" });

  db.prepare("UPDATE masterpieces SET status = 'listed_private', valuation = ? WHERE id = ?").run(price, masterpieceId);
  
  updateProvenance(masterpieceId, 'vip_event', `Owner ${userId} listed piece for private resale at ${price} EUR.`);
  broadcast({ type: 'RESALE_REQUESTED', masterpieceId });
  res.json({ success: true });
});

app.post("/api/resale/negotiate", (req, res) => {
  const { masterpieceId, buyer_id, seller_id, offered_price } = req.body;
  const platform_fee = offered_price * 0.05; // 5% platform fee
  
  const result = db.prepare(`
    INSERT INTO resale_negotiations (masterpiece_id, seller_id, buyer_id, offered_price, platform_fee)
    VALUES (?, ?, ?, ?, ?)
  `).run(masterpieceId, seller_id, buyer_id, offered_price, platform_fee);
  
  db.prepare("UPDATE masterpieces SET status = 'negotiation' WHERE id = ?").run(masterpieceId);
  
  res.json({ id: result.lastInsertRowid });
});

app.post("/api/resale/message", (req, res) => {
  const { negotiation_id, sender_id, message } = req.body;
  db.prepare("INSERT INTO private_messages (negotiation_id, sender_id, message) VALUES (?, ?, ?)").run(
    negotiation_id, sender_id, message
  );
  res.json({ success: true });
});

app.get("/api/resale/negotiation/:id", (req, res) => {
  const negotiation = db.prepare("SELECT * FROM resale_negotiations WHERE id = ?").get(req.params.id);
  const messages = db.prepare("SELECT * FROM private_messages WHERE negotiation_id = ? ORDER BY created_at ASC").all(req.params.id);
  res.json({ negotiation, messages });
});

app.post("/api/resale/accept", (req, res) => {
  const { negotiation_id, userId } = req.body;
  const negotiation = db.prepare("SELECT * FROM resale_negotiations WHERE id = ?").get(negotiation_id);
  
  if (negotiation.seller_id !== userId) return res.status(403).json({ error: "Only seller can accept" });
  
  db.prepare("UPDATE resale_negotiations SET status = 'accepted' WHERE id = ?").run(negotiation_id);
  db.prepare("UPDATE masterpieces SET status = 'escrow_pending' WHERE id = ?").run(negotiation.masterpiece_id);
  
  // Create Escrow Transaction
  db.prepare(`
    INSERT INTO escrow_transactions (masterpiece_id, buyer_id, seller_id, amount, status, dispute_window_ends)
    VALUES (?, ?, ?, ?, 'HELD', datetime('now', '+2 days'))
  `).run(negotiation.masterpiece_id, negotiation.buyer_id, negotiation.seller_id, negotiation.offered_price);

  updateProvenance(negotiation.masterpiece_id, 'vip_event', `Resale offer of ${negotiation.offered_price} EUR accepted. Escrow initiated.`);
  
  broadcast({ type: 'RESALE_ACCEPTED', negotiation_id, masterpieceId: negotiation.masterpiece_id });
  res.json({ success: true });
});

app.post("/api/resale/complete", (req, res) => {
  const { masterpieceId, adminId } = req.body;
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(masterpieceId);
  const escrow = db.prepare("SELECT * FROM escrow_transactions WHERE masterpiece_id = ? AND status = 'HELD' ORDER BY created_at DESC LIMIT 1").get(masterpieceId);
  
  if (!escrow) return res.status(404).json({ error: "Escrow not found" });

  const buyer = db.prepare("SELECT * FROM users WHERE id = ?").get(escrow.buyer_id);

  // 1. Release Escrow
  db.prepare("UPDATE escrow_transactions SET status = 'RELEASED' WHERE id = ?").run(escrow.id);
  
  // 2. Transfer Ownership
  db.prepare("UPDATE masterpieces SET current_owner_id = ?, status = 'sold', valuation = ? WHERE id = ?").run(
    escrow.buyer_id, piece.id, escrow.amount
  );
  
  // 3. Provenance
  updateProvenance(piece.id, 'ownership_transfer', `Private resale completed. New owner: ${buyer.name}.`);
  
  // 4. Certificate
  const certId = `CERT-RES-${piece.id}-${Date.now()}`;
  const certContent = `CERTIFICATE OF AUTHENTICITY & PRIVATE TRANSFER\n\nThis document confirms the private resale and ownership transfer of "${piece.title}".\n\nNew Owner: ${buyer.name}\nTransfer Price: ${escrow.amount.toLocaleString()} EUR\n\nProvenance has been updated in the Antonio Bellanova Vault.`;
  const certHtml = generateLuxuryDocument("Certificate of Authenticity", certContent, buyer, piece, { docRef: certId, title: "Certificate of Authenticity" });
  db.prepare("INSERT INTO certificates (masterpiece_id, owner_id, cert_id, content, signature, blockchain_hash) VALUES (?, ?, ?, ?, ?, ?)").run(
    piece.id, buyer.id, certId, certHtml, 'DIGITAL_SIG_AB', '0x' + Math.random().toString(16).slice(2)
  );

  broadcast({ type: 'RESALE_COMPLETED', masterpieceId });
  res.json({ success: true });
});

// 3. Service Lifecycle Tracking (Extended)
app.post("/api/admin/service/add", (req, res) => {
  const { masterpieceId, serviceType, description, cost, provider, attachments, adminId } = req.body;
  db.prepare("INSERT INTO service_history (masterpiece_id, service_type, description, cost, provider, attachments) VALUES (?, ?, ?, ?, ?, ?)").run(
    masterpieceId, serviceType, description, cost, provider, JSON.stringify(attachments || [])
  );
  
  // Service affects valuation (e.g., restoration adds value)
  const piece = db.prepare("SELECT valuation FROM masterpieces WHERE id = ?").get(masterpieceId);
  const newValuation = piece.valuation + (cost * 0.5); // 50% of service cost added to valuation
  db.prepare("UPDATE masterpieces SET valuation = ? WHERE id = ?").run(newValuation, masterpieceId);

  updateProvenance(masterpieceId, 'service', `Service performed: ${serviceType}. ${description}`);
  calculateRarityScore(masterpieceId);
  logAudit(adminId, 'ADD_SERVICE', masterpieceId.toString(), `Added ${serviceType} service record. Valuation updated.`);
  
  res.json({ success: true });
});

// 4. Waitlist System (Extended)
app.post("/api/waitlist/join", (req, res) => {
  const { userId, masterpieceId, requestType, preferredBudget, preferredMaterials } = req.body;
  db.prepare("INSERT INTO waitlist (masterpiece_id, user_id, request_type, preferred_budget, preferred_materials) VALUES (?, ?, ?, ?, ?)").run(
    masterpieceId || null, userId, requestType, preferredBudget, preferredMaterials
  );
  res.json({ success: true });
});

app.get("/api/admin/waitlist", (req, res) => {
  const list = db.prepare(`
    SELECT w.*, u.name as user_name, m.title as piece_title 
    FROM waitlist w 
    JOIN users u ON w.user_id = u.id 
    LEFT JOIN masterpieces m ON w.masterpiece_id = m.id
  `).all();
  res.json(list);
});

// 5. Soft Reserve System
app.post("/api/admin/reserve", (req, res) => {
  const { masterpieceId, userId, durationHours, type, adminId } = req.body;
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
  
  db.prepare("INSERT INTO reservations (masterpiece_id, user_id, expires_at, type) VALUES (?, ?, ?, ?)").run(
    masterpieceId, userId, expiresAt, type
  );
  
  const status = type === 'vip' ? 'reserved_vip' : 'reserved_client';
  db.prepare("UPDATE masterpieces SET status = ? WHERE id = ?").run(status, masterpieceId);
  
  updateProvenance(masterpieceId, 'vip_event', `Piece reserved for ${type} (User ID: ${userId}) for ${durationHours}h.`);
  logAudit(adminId, 'SOFT_RESERVE', masterpieceId.toString(), `Reserved piece for ${type} until ${expiresAt}`);
  
  res.json({ success: true, expiresAt });
});

// 6. Collector Profile
app.get("/api/collector/:userId", (req, res) => {
  const profile = db.prepare("SELECT * FROM collector_profiles WHERE user_id = ?").get(req.params.userId);
  const user = db.prepare("SELECT id, name, role, is_vip FROM users WHERE id = ?").get(req.params.userId);
  const pieces = db.prepare("SELECT * FROM masterpieces WHERE current_owner_id = ?").all(req.params.userId);
  
  res.json({ profile, user, pieces });
});

app.post("/api/collector/update", (req, res) => {
  const { userId, bio, visibility } = req.body;
  db.prepare(`
    INSERT INTO collector_profiles (user_id, bio, visibility) 
    VALUES (?, ?, ?) 
    ON CONFLICT(user_id) DO UPDATE SET bio = excluded.bio, visibility = excluded.visibility
  `).run(userId, bio, visibility);
  res.json({ success: true });
});

// 7. Investor Analytics Dashboard
app.get("/api/admin/analytics", (req, res) => {
  const platformValuation = db.prepare("SELECT SUM(valuation) as total FROM masterpieces").get().total || 0;
  const piecesSold = db.prepare("SELECT COUNT(*) as count FROM masterpieces WHERE status = 'sold'").get().count;
  
  const rarityDistribution = db.prepare("SELECT rarity, COUNT(*) as count FROM masterpieces GROUP BY rarity").all().reduce((acc: any, curr: any) => {
    acc[curr.rarity] = curr.count;
    return acc;
  }, {});

  const auctionPerformance = {
    total_bids: db.prepare("SELECT COUNT(*) as count FROM bids").get().count,
    avg_bid_increase: 15.5
  };

  res.json({
    platform_valuation: platformValuation,
    pieces_sold: piecesSold,
    appreciation_metrics: {
      avg_appreciation: 12.4,
      top_performing_category: 'High Jewelry'
    },
    auction_performance: auctionPerformance,
    rarity_distribution: rarityDistribution
  });
});

// 9. Concierge Request Layer (Super System)
app.post("/api/concierge/request", (req, res) => {
  const { userId, masterpieceId, requestType, message, priority } = req.body;
  const result = db.prepare("INSERT INTO concierge_requests (user_id, masterpiece_id, request_type, message, priority) VALUES (?, ?, ?, ?, ?)").run(
    userId, masterpieceId, requestType, message, priority || 'standard'
  );
  
  if (masterpieceId) {
    updateProvenance(masterpieceId, 'service', `Concierge request initiated: ${requestType}. Status: requested.`);
  }
  
  res.json({ id: result.lastInsertRowid });
});

app.post("/api/concierge/message", (req, res) => {
  const { requestId, senderId, message } = req.body;
  db.prepare("INSERT INTO concierge_messages (request_id, sender_id, message) VALUES (?, ?, ?)").run(
    requestId, senderId, message
  );
  res.json({ success: true });
});

app.get("/api/concierge/request/:id", (req, res) => {
  const request = db.prepare(`
    SELECT cr.*, u.name as user_name, m.title as piece_title 
    FROM concierge_requests cr 
    JOIN users u ON cr.user_id = u.id 
    LEFT JOIN masterpieces m ON cr.masterpiece_id = m.id
    WHERE cr.id = ?
  `).get(req.params.id);
  const messages = db.prepare("SELECT * FROM concierge_messages WHERE request_id = ? ORDER BY created_at ASC").all(req.params.id);
  res.json({ request, messages });
});

app.post("/api/admin/concierge/update", (req, res) => {
  const { requestId, status, assignedAdminId, adminId } = req.body;
  db.prepare("UPDATE concierge_requests SET status = ?, assigned_admin_id = ? WHERE id = ?").run(
    status, assignedAdminId, requestId
  );
  
  const request = db.prepare("SELECT * FROM concierge_requests WHERE id = ?").get(requestId);
  if (request.masterpiece_id) {
    updateProvenance(request.masterpiece_id, 'service', `Concierge status updated to ${status}.`);
    if (status === 'completed') {
      calculateRarityScore(request.masterpiece_id);
    }
  }
  
  logAudit(adminId, 'CONCIERGE_UPDATE', requestId.toString(), `Updated concierge request to ${status}`);
  res.json({ success: true });
});

// 10. Fractional Ownership
app.post("/api/admin/fractional/initialize", (req, res) => {
  const { masterpieceId, shares, adminId } = req.body; // shares: [{ owner_id, percentage }]
  db.prepare("UPDATE masterpieces SET status = 'fractional_open' WHERE id = ?").run(masterpieceId);
  
  const insertShare = db.prepare("INSERT INTO fractional_shares (masterpiece_id, owner_id, percentage) VALUES (?, ?, ?)");
  for (const share of shares) {
    insertShare.run(masterpieceId, share.owner_id, share.percentage);
  }
  
  updateProvenance(masterpieceId, 'vip_event', `Masterpiece fractionalized into ${shares.length} initial shares.`);
  logAudit(adminId, 'FRACTIONAL_INIT', masterpieceId.toString(), `Fractionalized masterpiece.`);
  res.json({ success: true });
});

app.get("/api/fractional/shares/:masterpieceId", (req, res) => {
  const shares = db.prepare(`
    SELECT fs.*, u.name as owner_name 
    FROM fractional_shares fs 
    JOIN users u ON fs.owner_id = u.id 
    WHERE fs.masterpiece_id = ?
  `).all(req.params.masterpieceId);
  res.json(shares);
});

// 11. Monetization Dashboard
app.get("/api/admin/revenue", (req, res) => {
  const totalRevenue = db.prepare("SELECT SUM(amount) as total FROM revenue_ledger").get().total || 0;
  const revenueByType = db.prepare("SELECT type, SUM(amount) as total FROM revenue_ledger GROUP BY type").all();
  const recentTransactions = db.prepare(`
    SELECT rl.*, u.name as user_name, m.title as piece_title 
    FROM revenue_ledger rl 
    JOIN users u ON rl.user_id = u.id 
    LEFT JOIN masterpieces m ON rl.masterpiece_id = m.id
    ORDER BY rl.created_at DESC LIMIT 20
  `).all();
  
  res.json({ totalRevenue, revenueByType, recentTransactions });
});

app.post("/api/revenue/add", (req, res) => {
  const { type, amount, userId, masterpieceId, referenceId } = req.body;
  db.prepare("INSERT INTO revenue_ledger (type, amount, user_id, masterpiece_id, reference_id) VALUES (?, ?, ?, ?, ?)").run(
    type, amount, userId, masterpieceId, referenceId
  );
  res.json({ success: true });
});

// 12. Production Progress
app.get("/api/production/:masterpieceId", (req, res) => {
  const progress = db.prepare("SELECT * FROM production_progress WHERE masterpiece_id = ? ORDER BY step_index ASC").all(req.params.masterpieceId);
  res.json(progress);
});

app.post("/api/admin/production/update", (req, res) => {
  const { masterpieceId, stepIndex, status, notes, mediaUrl, adminId } = req.body;
  db.prepare(`
    INSERT INTO production_progress (masterpiece_id, step_index, status, notes, media_url, staff_id, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(masterpiece_id, step_index) DO UPDATE SET 
      status = excluded.status, 
      notes = excluded.notes, 
      media_url = excluded.media_url, 
      staff_id = excluded.staff_id,
      timestamp = CURRENT_TIMESTAMP
  `).run(masterpieceId, stepIndex, status, notes, mediaUrl, adminId);
  
  const steps = ["Deposit received", "Production started", "Production finished", "Quality control", "Ready for delivery", "Final payment requested", "Final payment received", "Shipped", "Delivered", "Completed"];
  const stepName = steps[stepIndex];
  
  updateProvenance(masterpieceId, 'service', `Production step "${stepName}" marked as ${status}.`);
  broadcast({ type: 'PRODUCTION_UPDATED', masterpieceId, stepIndex, status });
  res.json({ success: true });
});

// 13. Delivery Details
app.get("/api/delivery/:masterpieceId", (req, res) => {
  const delivery = db.prepare("SELECT * FROM delivery_details WHERE masterpiece_id = ?").get(req.params.masterpieceId);
  res.json(delivery || null);
});

app.post("/api/admin/delivery/update", (req, res) => {
  const { masterpieceId, courierName, trackingNumber, scheduledAt, status, adminId } = req.body;
  db.prepare(`
    INSERT INTO delivery_details (masterpiece_id, courier_name, tracking_number, scheduled_at, status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(masterpiece_id) DO UPDATE SET 
      courier_name = excluded.courier_name, 
      tracking_number = excluded.tracking_number, 
      scheduled_at = excluded.scheduled_at, 
      status = excluded.status
  `).run(masterpieceId, courierName, trackingNumber, scheduledAt, status);
  
  updateProvenance(masterpieceId, 'vip_event', `Delivery status updated to ${status}. Courier: ${courierName}`);
  broadcast({ type: 'DELIVERY_UPDATED', masterpieceId, status });
  res.json({ success: true });
});

// 14. Atelier Moments
app.get("/api/moments/:masterpieceId", (req, res) => {
  const moments = db.prepare("SELECT * FROM atelier_moments WHERE masterpiece_id = ? ORDER BY created_at DESC").all(req.params.masterpieceId);
  res.json(moments);
});

app.post("/api/admin/moments/add", (req, res) => {
  const { masterpieceId, title, caption, mediaUrl, adminId } = req.body;
  db.prepare("INSERT INTO atelier_moments (masterpiece_id, title, caption, media_url) VALUES (?, ?, ?, ?)").run(
    masterpieceId, title, caption, mediaUrl
  );
  broadcast({ type: 'NEW_MOMENT', masterpieceId });
  res.json({ success: true });
});

// 15. User Applications
app.post("/api/applications/apply", (req, res) => {
  const { userId, type, portfolioUrl, budgetRange, interests, verificationDocs } = req.body;
  db.prepare("INSERT INTO user_applications (user_id, type, portfolio_url, budget_range, interests, verification_docs) VALUES (?, ?, ?, ?, ?, ?)").run(
    userId, type, portfolioUrl, budgetRange, interests, JSON.stringify(verificationDocs)
  );
  res.json({ success: true });
});

app.get("/api/admin/applications", (req, res) => {
  const apps = db.prepare(`
    SELECT ua.*, u.name as user_name, u.email as user_email 
    FROM user_applications ua 
    JOIN users u ON ua.user_id = u.id 
    ORDER BY ua.created_at DESC
  `).all();
  res.json(apps);
});

app.post("/api/admin/applications/review", (req, res) => {
  const { applicationId, status, adminId } = req.body;
  const application = db.prepare("SELECT * FROM user_applications WHERE id = ?").get(applicationId);
  db.prepare("UPDATE user_applications SET status = ? WHERE id = ?").run(status, applicationId);
  
  if (status === 'approved') {
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(application.type, application.user_id);
    notifyUser(application.user_id, `Your application for ${application.type} status has been approved.`, "success");
  } else {
    notifyUser(application.user_id, `Your application for ${application.type} status was not approved.`, "warning");
  }
  
  res.json({ success: true });
});

// 16. AI Pricing Engine (Mock)
app.get("/api/pricing/estimate/:masterpieceId", (req, res) => {
  const piece = db.prepare("SELECT * FROM masterpieces WHERE id = ?").get(req.params.masterpieceId);
  if (!piece) return res.status(404).json({ error: "Piece not found" });
  
  // Mock AI logic
  const baseValue = piece.valuation;
  const appreciation = 1.15; // 15% appreciation
  const estimatedValue = baseValue * appreciation;
  const liquidityScore = 85;
  
  res.json({
    current_valuation: baseValue,
    estimated_future_value: estimatedValue,
    appreciation_rate: "15.5%",
    liquidity_score: liquidityScore,
    recommendation: "Hold - High appreciation potential due to rarity."
  });
});

// 17. Wealth CRM
app.get("/api/admin/crm/:userId", (req, res) => {
  const interactions = db.prepare(`
    SELECT ci.*, u.name as admin_name 
    FROM crm_interactions ci 
    JOIN users u ON ci.admin_id = u.id 
    WHERE ci.user_id = ? 
    ORDER BY ci.created_at DESC
  `).all(req.params.userId);
  res.json(interactions);
});

app.post("/api/admin/crm/add", (req, res) => {
  const { userId, adminId, type, content, priority } = req.body;
  db.prepare("INSERT INTO crm_interactions (user_id, admin_id, type, content, priority) VALUES (?, ?, ?, ?, ?)").run(
    userId, adminId, type, content, priority || 'normal'
  );
  res.json({ success: true });
});

// 18. Shipping & Logistics
app.get("/api/shipping/:masterpieceId", (req, res) => {
  const shipping = db.prepare("SELECT * FROM shipping_orchestration WHERE masterpiece_id = ?").get(req.params.masterpieceId);
  res.json(shipping || null);
});

app.post("/api/admin/shipping/update", (req, res) => {
  const { masterpieceId, status, courier, trackingNumber, insuranceValue, whiteGlove, custodyEvent } = req.body;
  const existing = db.prepare("SELECT * FROM shipping_orchestration WHERE masterpiece_id = ?").get(masterpieceId);
  
  let custodyLog = [];
  if (existing && existing.custody_log) {
    custodyLog = JSON.parse(existing.custody_log);
  }
  if (custodyEvent) {
    custodyLog.push({ event: custodyEvent, timestamp: new Date().toISOString() });
  }

  db.prepare(`
    INSERT INTO shipping_orchestration (masterpiece_id, status, courier, tracking_number, insurance_value, white_glove, custody_log)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(masterpiece_id) DO UPDATE SET 
      status = excluded.status, 
      courier = excluded.courier, 
      tracking_number = excluded.tracking_number, 
      insurance_value = excluded.insurance_value, 
      white_glove = excluded.white_glove,
      custody_log = excluded.custody_log
  `).run(masterpieceId, status, courier, trackingNumber, insuranceValue, whiteGlove ? 1 : 0, JSON.stringify(custodyLog));
  
  res.json({ success: true });
});

// 19. Insurance
app.get("/api/insurance/:masterpieceId", (req, res) => {
  const policies = db.prepare("SELECT * FROM insurance_policies WHERE masterpiece_id = ?").all(req.params.masterpieceId);
  res.json(policies);
});

app.post("/api/admin/insurance/add", (req, res) => {
  const { masterpieceId, provider, policyNumber, coverageAmount, premium, expiresAt, documentUrl } = req.body;
  db.prepare(`
    INSERT INTO insurance_policies (masterpiece_id, provider, policy_number, coverage_amount, premium, expires_at, document_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(masterpieceId, provider, policyNumber, coverageAmount, premium, expiresAt, documentUrl);
  res.json({ success: true });
});

// 20. Private Events
app.get("/api/events", (req, res) => {
  const events = db.prepare("SELECT * FROM private_events WHERE status = 'upcoming' ORDER BY event_date ASC").all();
  res.json(events);
});

app.post("/api/events/rsvp", (req, res) => {
  const { eventId, userId, status } = req.body;
  db.prepare(`
    INSERT INTO event_rsvps (event_id, user_id, status) 
    VALUES (?, ?, ?) 
    ON CONFLICT(event_id, user_id) DO UPDATE SET status = excluded.status
  `).run(eventId, userId, status);
  res.json({ success: true });
});

// 21. Platform Intelligence (Founder Dashboard)
app.get("/api/admin/intelligence", (req, res) => {
  const totalValue = db.prepare("SELECT SUM(valuation) as total FROM masterpieces").get().total || 0;
  const userGrowth = db.prepare("SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM users GROUP BY month").all();
  const liquidity = db.prepare("SELECT status, COUNT(*) as count FROM masterpieces GROUP BY status").all();
  const reputationAvg = db.prepare("SELECT AVG(reputation_score) as avg FROM users").get().avg || 0;
  
  res.json({
    total_portfolio_value: totalValue,
    user_growth: userGrowth,
    market_liquidity: liquidity,
    average_reputation: reputationAvg,
    geographic_distribution: { "Germany": 45, "Italy": 20, "Switzerland": 15, "Other": 20 }
  });
});

// 22. VIP Concierge AI
app.post("/api/concierge/ai", async (req, res) => {
  const { userId, message } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  const pieces = db.prepare("SELECT * FROM masterpieces WHERE current_owner_id = ?").all(userId);
  
  // Use Gemini to generate a luxury response
  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the AI Concierge for Antonio Bellanova Vault, a luxury asset platform. 
      The client is ${user.name}, a ${user.role}. They own ${pieces.length} masterpieces.
      Respond in a highly sophisticated, professional, and helpful tone.
      Client message: ${message}`,
    });
    res.json({ response: response.text });
  } catch (e) {
    res.json({ response: "I apologize, but I am currently attending to another matter. Antonio will contact you shortly." });
  }
});

// --- Vite Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist/index.html")));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Luxury Platform running on http://localhost:${PORT}`);
  });
}

startServer();
