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
      items: []
    };

    await db.collection('users').doc(email).set(userData);
    const response = { message: "User created successfully." };
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/add/preferences", async (req, res) => {
  try {
      const emailId = req.body.email;

      const userRef = db.collection('users').doc(emailId);
      const userData = await userRef.get();

      if (!userData.exists) {
          return res.status(404).json({ error: "User not found" });
      }

      const existingPreferences = userData.data().preference || [];

      const newPreference = req.body.preference;

      const updatedPreferences = Array.isArray(existingPreferences) ? existingPreferences : [];

      updatedPreferences.push(newPreference);

      await userRef.update({
          preference: updatedPreferences
      });

      const response = { message: "Added successfully." };
      return res.status(200).json(response);
  } catch (error) {
      return res.status(500).json({ error: error.toString() });
  }
});


app.put("/add/items", async (req, res) => {
  try {
      const emailId = req.body.email;

      const userRef = db.collection('users').doc(emailId);
      const userData = await userRef.get();

      if (!userData.exists) {
          return res.status(404).json({ error: "User not found" });
      }

      const existingItems = userData.data().items || [];

      const newItem = req.body.items;

      // Ensure existing items is an array
      const updatedItems = Array.isArray(existingItems) ? existingItems : [];

      // Append the new item to the existing items array
      updatedItems.push(newItem);

      await userRef.update({
          items: updatedItems // Change 'preference' to 'items'
      });

      const response = { message: "Added successfully." };
      return res.status(200).json(response);
  } catch (error) {
      return res.status(500).json({ error: error.toString() });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});