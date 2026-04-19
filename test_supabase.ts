import { createClient } from "@supabase/supabase-js";

const url = 'https://pqzjkvqmherngispxlzy.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxemprdnFtaGVybmdpc3B4bHp5Iiwicm9sZSI6InFub24iLCJpYXQiOjE3Njc0MjA3MjMsImV4cCI6MjA4Mjk5NjcyM30.Oa6ZXYw5-f3BOHHafFsLPtuBgmV4yOu5BMpulyDC-oc';

const supabase = createClient(url, key);

async function test() {
  console.log("Testing Supabase connection...");
  try {
    const { data, error } = await supabase.from('businesses').select('id').limit(1);
    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Supabase Success:", data);
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}

test();
