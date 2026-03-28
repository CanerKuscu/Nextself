-- Function to increment topic replies count atomically
CREATE OR REPLACE FUNCTION increment_topic_replies(
  p_topic_id UUID,
  p_author_id UUID,
  p_author_name TEXT,
  p_timestamp TIMESTAMPTZ
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE forum_topics
  SET 
    replies_count = replies_count + 1,
    last_reply_at = p_timestamp,
    last_reply_by = p_author_id,
    last_reply_by_name = p_author_name,
    updated_at = p_timestamp
  WHERE id = p_topic_id;
END;
$$;

-- Function to decrement topic replies count atomically
CREATE OR REPLACE FUNCTION decrement_topic_replies(p_topic_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE forum_topics
  SET replies_count = GREATEST(0, replies_count - 1)
  WHERE id = p_topic_id;
END;
$$;
