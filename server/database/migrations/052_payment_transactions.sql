-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  order_id VARCHAR(255) NOT NULL UNIQUE,
  transaction_id VARCHAR(255) NOT NULL UNIQUE,
  gateway VARCHAR(50) NOT NULL, -- 'phonepe', 'razorpay', 'stripe'
  amount INTEGER NOT NULL, -- in paise/cents
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(50) NOT NULL DEFAULT 'initiated', -- 'initiated', 'pending', 'success', 'failed', 'refunded'
  gateway_response JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_transaction_id ON payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
