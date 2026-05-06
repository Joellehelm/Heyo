Note.destroy_all

[
  { title: "Tiny victory", body: "Make one adorable sticky note ✨", color: "banana" },
  { title: "Snack quest", body: "Find cookies for the coding goblin 🍪", color: "bubblegum" },
  { title: "Cozy idea", body: "Add more stickers, stars, and happy wiggles.", color: "mint" }
].each do |attrs|
  Note.create!(attrs)
end
