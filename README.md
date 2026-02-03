# Credit Card Benefits Tracker

A comprehensive Next.js application to track and manage all your credit card benefits in one place. Never miss out on using your benefits again!

## Features

- 📊 **Dashboard Overview**: See all your credit cards at a glance with key statistics
- 💳 **Card Management**: Add, view, and manage credit cards with their details
- 🎁 **Benefit Tracking**: Track benefits with different frequencies:
  - **Monthly**: Benefits that reset every month
  - **Quarterly**: Benefits that reset every quarter (Q1, Q2, Q3, Q4)
  - **Yearly**: Benefits that reset annually
- ✅ **Usage Tracking**: Mark benefits as used for specific periods
- 📈 **Analytics & Insights**: 
  - View unused benefits
  - See benefits expiring in the current period
  - Calculate potential value lost
  - Usage statistics per card
- 🔔 **Renewal Reminders**: Track when your annual fees are due

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Firebase Firestore** - Database for storing cards and benefits
- **Tailwind CSS** - Styling
- **date-fns** - Date manipulation utilities
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Firebase project set up

### Installation

1. Clone or navigate to the project directory:
```bash
cd credit-card-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Get your Firebase configuration values

4. Create a `.env.local` file in the root directory:
```bash
cp .env.local.example .env.local
```

5. Fill in your Firebase configuration in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Firestore Database**:
   - Go to Firestore Database in the left sidebar
   - Click "Create database"
   - Start in **test mode** (for development) or set up security rules
   - Choose a location for your database

4. Get your configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to add a web app
   - Copy the configuration values to your `.env.local` file

### Firestore Security Rules (Recommended for Production)

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /creditCards/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Note: The current implementation doesn't include authentication. For production use, you should add Firebase Authentication and update the security rules accordingly.

## Usage

### Adding a Credit Card

1. Click "Add New Credit Card" on the home page
2. Fill in:
   - Card name (e.g., "Chase Sapphire Preferred")
   - Bank/Issuer (e.g., "Chase")
   - Date opened
   - Annual fee
3. Click "Add Credit Card"

### Adding Benefits

1. Open a credit card from the home page
2. Click "Add Benefit"
3. Fill in:
   - Benefit name (e.g., "$50 Dining Credit")
   - Description (optional)
   - Frequency (Monthly, Quarterly, or Yearly)
   - Amount (optional)
4. Click "Add Benefit"

### Tracking Usage

1. Open a credit card
2. Find the benefit you want to track
3. Click on a period button to mark it as used/unused
   - Green = Used
   - Yellow = Current period (not used yet)
   - Gray = Past period (not used)

### Viewing Analytics

1. Click "View Analytics" from the home page
2. See:
   - Unused benefits count
   - Benefits expiring this period
   - Potential value lost
   - Usage statistics per card

## MCP Server (AI Assistant Integration)

An MCP server is included so you can query your credit card benefits from Cursor or other MCP-compatible AI assistants. Ask things like "What credits do I need to use this month?" and the AI will fetch your unused benefits.

See [mcp-server/README.md](mcp-server/README.md) for setup instructions.

## Project Structure

```
credit-card-tracker/
├── app/
│   ├── analytics/          # Analytics page
│   ├── cards/
│   │   ├── [id]/          # Individual card detail page
│   │   └── new/           # Add new card page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/
│   ├── firebase.ts        # Firebase initialization
│   ├── firestore.ts       # Firestore operations
│   ├── types.ts           # TypeScript types
│   └── utils.ts           # Utility functions
├── mcp-server/            # MCP server for AI assistants
├── package.json
└── README.md
```

## Future Enhancements

- [ ] Add user authentication
- [ ] Email reminders for expiring benefits
- [ ] Export data to CSV
- [ ] Mobile app version
- [ ] Benefit categories and tags
- [ ] Recurring benefit templates
- [ ] Historical usage charts

## License

MIT

