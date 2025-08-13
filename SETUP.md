# Premier League Predictor Setup Guide

## 🔑 API Football Setup

### Get Your Free API Key
1. Visit [API-Football.com](https://www.api-football.com/)
2. Create a free account
3. Navigate to Dashboard → My Access
4. Copy your API key (100 requests/day free tier)

### Environment Configuration
Create a `.env.local` file in the project root:
```bash
# API Football Configuration
API_FOOTBALL_KEY=your_api_key_here

# Database Configuration (Optional - uses mock data by default)
DATABASE_URL=your_postgresql_url_here
```

### Installation & Running
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📊 Current Season Information
- **Season**: 2025/26 Premier League
- **Start Date**: August 16, 2025
- **API League ID**: 39
- **Data Source**: API-Football.com

## 🚀 Quick Start (Without API Key)
The app includes mock data for demonstration purposes. You can explore the interface without an API key, but predictions will use sample data.

## 🎯 Rate Limiting
- Free tier: 100 requests/day
- Automatic rate limiting built-in
- Efficient caching to minimize API calls

## 📈 Multi-Season Data Strategy
The prediction algorithm uses weighted data from:
- **Current Season (2025/26)**: 50% weight
- **Previous Season (2024/25)**: 30% weight  
- **Historical Season (2023/24)**: 20% weight

This provides better statistical significance while prioritizing recent performance.