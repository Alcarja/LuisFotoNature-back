# Luis Foto Nature Backend

Express + Node.js backend with Neon PostgreSQL database integration.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update `.env` with your Neon database connection string:

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname
FRONTEND_URL=http://localhost:3000
```

**To get your Neon connection string:**
1. Go to [Neon Console](https://console.neon.tech)
2. Select your project and database
3. Click "Connect" and copy the connection string
4. Paste it into your `.env` file

### 3. Run the Server

**Development (with hot reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## Project Structure

```
back/
├── server.js              # Main server file
├── package.json
├── .env.example           # Example environment variables
├── .gitignore
└── src/
    ├── db.js              # Database connection setup
    └── routes/
        └── example.js     # Example route file
```

## Testing Connection

Once the server is running, test it with:

```bash
# Health check
curl http://localhost:5000/health

# Test database connection
curl http://localhost:5000/api/test
```

## Adding Routes

1. Create a new file in `src/routes/` (e.g., `photos.js`)
2. Define your routes using the example in `src/routes/example.js`
3. Import and use it in `server.js`:

```javascript
import photosRouter from './src/routes/photos.js';
app.use('/api/photos', photosRouter);
```

## Connecting to Next.js Frontend

In your Next.js frontend, use the backend URL:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Example fetch
const response = await fetch(`${API_URL}/api/photos`);
const data = await response.json();
```

## Database Setup

To create tables, you can either:
1. Use the Neon console SQL editor
2. Create a migration system (consider tools like `db-migrate` or `knex`)
3. Run SQL scripts directly from Node.js

## Notes

- CORS is configured to accept requests from `http://localhost:3000` by default
- Update `FRONTEND_URL` in `.env` if your frontend runs on a different port
- PostgreSQL connection uses SSL (required by Neon)
