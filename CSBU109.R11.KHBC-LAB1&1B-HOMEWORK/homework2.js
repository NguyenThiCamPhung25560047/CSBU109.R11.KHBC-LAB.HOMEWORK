use blog_db;

db.posts.drop();

db.posts.insertMany([
  {
    title: "Mastering Node.js and Express",
    category: "Tech",
    views: 150,
    author: {
      name: "LyLy",
      email: "lyly@example.com"
    },
    tags: ["nodejs", "express", "backend"],
    comments: [
      { user: "Truong Giang", content: "Great article!", created_at: new Date("2026-09-01") },
      { user: "Nha Phuong", content: "Very helpful for backend devs.", created_at: new Date("2026-09-02") }
    ]
  },
  {
    title: "Introduction to MongoDB Atlas",
    category: "Tech",
    views: 85,
    author: {
      name: "Truong Giang",
      email: "truonggiang@example.com"
    },
    tags: ["mongodb", "database", "cloud"],
    comments: [
      { user: "LyLy", content: "Nice tutorial.", created_at: new Date("2026-09-03") }
    ]
  },
  {
    title: "10 Tips for Healthy Living",
    category: "Lifestyle",
    views: 200,
    author: {
      name: "Nha Phuong",
      email: "nhaphuong@example.com"
    },
    tags: ["health", "wellness", "lifestyle"],
    comments: [
      { user: "Truong Giang", content: "Awesome tips!", created_at: new Date("2026-09-04") }
    ]
  }
]);

// Query 1: Find posts in 'Tech' category AND views >= 100
db.posts.find({ category: "Tech", views: { $gte: 100 } });

// Query 2: Find all posts tagged with 'nodejs'
db.posts.find({ tags: "nodejs" });

db.posts.updateOne(
  { title: "Mastering Node.js and Express" },
  {
    $push: {
      comments: {
        user: "Phung",
        content: "Awesome explanation on express middleware!",
        created_at: new Date()
      }
    },
    $inc: { views: 1 }
  }
);

db.posts.find({ title: "Mastering Node.js and Express" });

db.posts.aggregate([
  {
    $group: {
      _id: "$category",
      totalViews: { $sum: "$views" },
      totalPosts: { $sum: 1 }
    }
  }
]);