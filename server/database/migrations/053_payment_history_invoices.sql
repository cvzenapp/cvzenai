-- Payment History Table
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('user', 'company')),
  
  -- Payment details
  amount INTEGER NOT NULL, -- in paise/cents
  currency VARCHAR(3) DEFAULT 'INR',
  payment_method VARCHAR(50), -- 'phonepe', 'razorpay', 'stripe', etc.
  payment_gateway_id VARCHAR(255), -- external payment ID
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Transaction details
  transaction_id VARCHAR(255) UNIQUE,
  invoice_id UUID,
  
  -- Billing info
  billing_email VARCHAR(255),
  billing_name VARCHAR(255),
  billing_address JSONB,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  payment_date TIMESTAMP,
  refund_date TIMESTAMP,
  refund_amount INTEGER,
  refund_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  subscription_id UUID NOT NULL,
  subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('user', 'company')),
  payment_id UUID REFERENCES payment_history(id),
  
  -- Invoice details
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  amount INTEGER NOT NULL,
  tax_amount INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total_amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Billing info
  billing_name VARCHAR(255) NOT NULL,
  billing_email VARCHAR(255) NOT NULL,
  billing_address JSONB,
  billing_gstin VARCHAR(50), -- GST number for Indian businesses
  
  -- Line items
  line_items JSONB NOT NULL DEFAULT '[]',
  
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  
  -- PDF/Document
  pdf_url TEXT,
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription ON payment_history(subscription_id, subscription_type);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_history_date ON payment_history(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_transaction ON payment_history(transaction_id);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id, subscription_type);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date DESC);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_month TEXT;
  sequence_num INTEGER;
  invoice_num TEXT;
BEGIN
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 12) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'INV-' || year_month || '-%';
  
  invoice_num := 'INV-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();
