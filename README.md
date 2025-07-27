# 🚀 NTA Decentralized Trustless Examination System Backend

A comprehensive backend system for decentralized, trustless examination management built with **MERN + Solana + Rust** following **SOLID principles**.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [SOLID Principles Implementation](#solid-principles-implementation)
- [Blockchain Integration](#blockchain-integration)
- [Security Features](#security-features)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

This backend system implements a decentralized examination platform where:

- **States** contribute questions to a shared pool
- **Questions** are encrypted and stored on Solana blockchain
- **Papers** are generated using Shamir Secret Sharing
- **Students** take exams with real-time monitoring
- **Results** are calculated and ranked automatically
- **All data** is verifiable on the blockchain

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Solana        │
│   (React)       │◄──►│   (Node.js)     │◄──►│   Blockchain    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   MongoDB       │
                       │   Database      │
                       └─────────────────┘
```

### Core Modules

1. **State Question Contribution** - States upload and manage questions
2. **Question Paper Generation** - Admin generates papers with Shamir encryption
3. **Exam Management** - Student exam sessions with monitoring
4. **Answer Management** - Encrypted answer storage and processing
5. **Result Evaluation** - Automated grading and ranking
6. **Blockchain Verification** - Solana integration for data integrity

## ✨ Features

### 🔐 Security & Trust
- **Shamir Secret Sharing** for paper encryption
- **AES-256-GCM** encryption for sensitive data
- **Blockchain verification** for data integrity
- **Role-based access control** (Student, State, Admin, Internal)
- **Rate limiting** and **DDoS protection**

### 📊 Exam Management
- **Real-time monitoring** of student activities
- **Anti-cheating detection** (tab switching, copy-paste, etc.)
- **Automatic time management** and session control
- **Question randomization** and difficulty distribution
- **Instant result calculation** and ranking

### 🔗 Blockchain Integration
- **Solana blockchain** for immutable data storage
- **Hash verification** for all critical data
- **Transaction tracking** and audit trails
- **Decentralized trust** without central authority

### 📈 Analytics & Reporting
- **Comprehensive statistics** for all entities
- **Performance analytics** and insights
- **Real-time dashboards** for administrators
- **Export capabilities** for reports

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging

### Blockchain
- **Solana** - High-performance blockchain
- **@solana/web3.js** - Solana JavaScript SDK
- **Shamir Secret Sharing** - Cryptographic secret sharing

### Security
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection
- **Input Validation** - Data sanitization

### Development
- **ESLint** - Code linting
- **Jest** - Testing framework
- **Nodemon** - Development server
- **Swagger** - API documentation

## 🚀 Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Solana CLI tools (optional, for development)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NTA-FIX-BACKEND
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Verify installation**
   ```bash
   curl http://localhost:5000/health
   ```

## ⚙️ Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/nta_exam_system

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your-solana-private-key
SOLANA_PROGRAM_ID=your-program-id

# Encryption Configuration
ENCRYPTION_KEY=your-32-byte-encryption-key
SHAMIR_THRESHOLD=3
SHAMIR_TOTAL_PARTS=5
```

### Database Setup

```bash
# Create database indexes
npm run setup-db

# Seed initial data (optional)
npm run seed
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "studentId": "STU123456"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### State Question Contribution

#### Upload Questions
```http
POST /api/state/upload-questions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "questions": [
    {
      "subject": "Mathematics",
      "topic": "Algebra",
      "questionText": "What is the value of x in 2x + 5 = 13?",
      "options": {
        "A": "3",
        "B": "4",
        "C": "5",
        "D": "6"
      },
      "correctAnswer": "B",
      "difficulty": "medium",
      "marks": 2
    }
  ]
}
```

#### Get Questions by State
```http
GET /api/state/get-questions?page=1&limit=20&subject=Mathematics
Authorization: Bearer <jwt_token>
```

### Paper Generation

#### Generate Paper
```http
POST /api/paper/generate
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Mathematics Final Exam",
  "subject": "Mathematics",
  "totalQuestions": 50,
  "duration": 180,
  "difficultyDistribution": {
    "easy": 20,
    "medium": 20,
    "hard": 10
  }
}
```

#### Distribute Shamir Keys
```http
GET /api/paper/distribute?paperId=P123456
Authorization: Bearer <jwt_token>
```

### Exam Management

#### Start Exam
```http
POST /api/exam/start
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paperId": "P123456"
}
```

#### Submit Answer
```http
POST /api/exam/submit
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "questionId": "Q123",
  "selectedOption": "B",
  "timeSpent": 45
}
```

### Result Management

#### Get Student Result
```http
GET /api/result/STU123456
Authorization: Bearer <jwt_token>
```

#### Get Rank List
```http
GET /api/result/ranklist?paperId=P123456&limit=100
```

### Blockchain Verification

#### Get Transaction Details
```http
GET /api/blockchain/get/TX123456
Authorization: Bearer <jwt_token>
```

## 🏛️ SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)
- Each service handles one specific domain
- Controllers only handle HTTP requests/responses
- Models only handle data persistence

### 2. Open/Closed Principle (OCP)
- Service interfaces allow extension without modification
- Plugin architecture for blockchain providers
- Configurable validation rules

### 3. Liskov Substitution Principle (LSP)
- All service implementations are interchangeable
- Consistent interface contracts
- Proper inheritance hierarchies

### 4. Interface Segregation Principle (ISP)
- Specific interfaces for each service type
- No forced dependencies on unused methods
- Clean separation of concerns

### 5. Dependency Inversion Principle (DIP)
- High-level modules depend on abstractions
- Dependency injection for all services
- Inversion of control container

## 🔗 Blockchain Integration

### Solana Integration

The system integrates with Solana blockchain for:

1. **Question Hash Storage** - Immutable question verification
2. **Paper Hash Storage** - Exam paper integrity
3. **Answer Hash Storage** - Student answer verification
4. **Result Hash Storage** - Final result integrity
5. **Rank Hash Storage** - Ranking verification

### Smart Contract Interaction

```javascript
// Example: Store question hash on Solana
const transaction = await solanaConfig.connection.sendTransaction(
  new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: keypair.publicKey,
      newAccountPubkey: questionAccount.publicKey,
      lamports: await solanaConfig.connection.getMinimumBalanceForRentExemption(QUESTION_ACCOUNT_SIZE),
      space: QUESTION_ACCOUNT_SIZE,
      programId: programId
    })
  )
);
```

## 🔒 Security Features

### Encryption
- **AES-256-GCM** for sensitive data
- **Shamir Secret Sharing** for paper encryption
- **HMAC** for data integrity verification

### Authentication & Authorization
- **JWT tokens** with refresh mechanism
- **Role-based access control**
- **Session management** with secure cookies

### Input Validation
- **Express-validator** for request validation
- **SQL injection prevention**
- **XSS protection** with helmet

### Rate Limiting
- **IP-based rate limiting**
- **User-based rate limiting**
- **Endpoint-specific limits**

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=stateController.test.js

# Generate coverage report
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/
│   ├── api/
│   └── database/
└── e2e/
    └── workflows/
```

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   MONGODB_URI_PROD=your-production-mongodb-uri
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   npm start
   ```

3. **Docker Deployment**
   ```bash
   docker build -t nta-backend .
   docker run -p 5000:5000 nta-backend
   ```

### Monitoring

- **Health checks** at `/health`
- **Logging** with Winston
- **Error tracking** with proper error handling
- **Performance monitoring** with metrics

## 🤝 Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   npm run lint
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Standards

- Follow **ESLint** rules
- Write **JSDoc** comments
- Maintain **test coverage** above 80%
- Follow **SOLID principles**
- Use **TypeScript** for new features (optional)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Documentation**: [API Docs](docs/api.md)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 🙏 Acknowledgments

- **Solana Foundation** for blockchain infrastructure
- **MongoDB** for database technology
- **Express.js** community for web framework
- **Open source contributors** for various libraries

---

**Built with ❤️ for the future of decentralized education** 