const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iistjlwthpsewvyebvir.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpc3RqbHd0aHBzZXd2eWVidmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjAzNzEsImV4cCI6MjEwMDQ5NjM3MX0.dI-wceg5ILOMLAzLi5UcwObEdIIRw-uaWe_m1iQvJQs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
  console.log("Listing buckets...");
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error("Error listing buckets:", bucketsError);
  } else {
    console.log("Buckets:", buckets.map(b => b.name));
  }

  console.log("\nAttempting test upload to 'avatars'...");
  const fakeFile = Buffer.from('hello world', 'utf-8');
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload('test.txt', fakeFile, {
      contentType: 'text/plain',
      upsert: false
    });

  if (error) {
    console.error("Upload error details:");
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log("Upload success!", data);
  }
}

testStorage();
