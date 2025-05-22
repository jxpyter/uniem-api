# Uniem

**Uniem** is an online platform exclusively designed for university students. It provides a digital platform where students can connect, access academic materials, join events, participate in business simulations, and find internship opportunities — all within a single ecosystem. By combining various digital services into one unified system, Uniem enables students to access essential tools and opportunities that enhance their academic and professional journeys.

---

## 🚀 Features

- 🔐 User authentication with JWT
- 📚 Upload and listen to academic notes (developing LLM's & NLP)
- 🧠 Forum feature inspired by Reddit + Twitter
- 🏆 Earn points through participation
- 📅 Join or create events
- 💼 Internship and job simulation modules (job simulating modules developing)
- 💳 Membership system for advanced features (payment systems coming soon)
- ⏱ Scheduled jobs (via `cron`)
- 📁 File uploads using `multer`

---

## 🛠️ Built With

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **bcrypt**
- **JWT**
- **Multer**
- **Cron**
- **Postman**

---

## 📦 Installation

> This project does **not** use Docker. Installation is done via `npm`.

> Requires [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/)

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/uniem.git
   cd uniem
   ```

2. **Install dependencies**

   npm install

3. **Configure environment variables**

   Create a file named config.env in the root directory and add the following:

   NODE_ENV=development
   PORT=3000
   DATABASE=localhost

   JWT_SECRET=your_secret
   JWT_EXPIRES_IN=30d
   JWT_COOKIE_EXPIRES_IN=90

   EMAIL_USERNAME=your_username
   EMAIL_PASSWORD=your_password
   EMAIL_HOST=your_mail_host
   EMAIL_PORT=2525

4. **Run the server**

   npm start

## 📑 API Documentation

You can explore and test all Uniem API endpoints using the public Postman collection:

🔗 [Uniem API Postman Collection](https://www.postman.com/jxpyter/workspace/my-workspace/collection/31979414-ab191bb6-aaee-4ed5-8e32-0489db7505b1)

> Make sure to set up your environment variables in Postman for authenticated routes.

## 📂 Folder Structure (simplified)

    uniem-api/

├── controllers/
├── services/
├── models/
├── routes/
├── utils/
├── config.env
├── server.js
├── app.js
└── package.json

## 🛡 License

This project is licensed under the MIT License — see the LICENSE file for details.

## 👨‍💻 Author

- GitHub: [jxpyter](https://github.com/jxpyter)

- Project: Uniem - Empowering University Students

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.
Feel free to open a pull request or issue.

## 📬 Contact

For questions or feedback, feel free to reach out via GitHub or email.
