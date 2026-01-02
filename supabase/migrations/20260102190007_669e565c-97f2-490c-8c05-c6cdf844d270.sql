-- Create cat_gifts table for gifting cats between friends
CREATE TABLE public.cat_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  cat_data JSONB NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.cat_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their gifts"
  ON public.cat_gifts FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send gifts"
  ON public.cat_gifts FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update gift status"
  ON public.cat_gifts FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Create trade_offers table for player trading
CREATE TABLE public.trade_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  offered_cats JSONB DEFAULT '[]',
  offered_money INTEGER DEFAULT 0,
  offered_resources JSONB DEFAULT '{}',
  requested_cats JSONB DEFAULT '[]',
  requested_money INTEGER DEFAULT 0,
  requested_resources JSONB DEFAULT '{}',
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

ALTER TABLE public.trade_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their trades"
  ON public.trade_offers FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create trades"
  ON public.trade_offers FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their trades"
  ON public.trade_offers FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_friends;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cat_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_offers;