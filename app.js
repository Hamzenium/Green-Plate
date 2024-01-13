const express = require('express');
const app = express();
const port = 3000;
const admin = require("firebase-admin");
const credentials = require('./key.json');
admin.initializeApp({
	credential: admin.credential.cert(credentials)
});
app.use(express.json());

const db = admin.firestore();
app.post("/create/user", async (req, res) => {
  try {
    const email = req.body.email;
    const userData = {
      name: req.body.name,
      email: req.body.email,
      preference: [],
      recipee: []
    };

    await db.collection('users').doc(email).set(userData);

    const response = { message: "User created successfully." };
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});