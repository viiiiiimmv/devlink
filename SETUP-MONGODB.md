# MongoDB Setup for DevLink

This project requires MongoDB to store user data and profiles. Here are several ways to set up MongoDB:

## Option 1: MongoDB Community Server (Recommended)

1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install MongoDB following the installation guide
3. Start MongoDB service:
   - Windows: `net start MongoDB` or start from Services
   - macOS: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

## Option 2: Docker (If you have Docker installed)

1. Run the provided Docker Compose file:
   ```bash
   docker-compose up -d
   ```

## Option 3: MongoDB Atlas (Cloud)

1. Create a free account at https://cloud.mongodb.com
2. Create a new cluster (free tier available)
3. Get your connection string
4. Update the `.env` file with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/devlink?retryWrites=true&w=majority
   ```

## Verify Setup

Once MongoDB is running, start the development server:
```bash
npm run dev
```

You should see "✅ Connected to MongoDB successfully" in the console when the connection is established.
