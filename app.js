const OpenAI = require("openai");

const fileUpload = require('express-fileupload');
const express = require('express');
var cors = require('cors')
const app = express();
const admin = require("firebase-admin");
const credentials = require('./key.json');
admin.initializeApp({
    credential: admin.credential.cert(credentials)
});

app.use(express.json());
app.use(fileUpload());
app.use(cors());

const db = admin.firestore();

app.post("/create/user", async (req, res) => {
    try {
        const email = req.body.email;

        const userRef = db.collection('users').doc(email);
        const userData = await userRef.get();

        if (userData.exists) {
            const data = userData.data();
            return res.json(data);
        } else {
            const userData = {
                name: req.body.name,
                email: email,
                preference: [],
                items: []
            };

            await db.collection('users').doc(email).set(userData);
            const response = { message: "User created successfully." };
            return res.status(200).json(response);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
});


app.put("/add/preferences", async (req, res) => {
    try {
        const { email, preference } = req.body;

        if (!email || !preference) {
            return res.status(400).json({ error: "Invalid request body. Email and preference are required." });
        }

        const userRef = db.collection('users').doc(email);
        const userData = await userRef.get();

        if (!userData.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        const existingPreferences = userData.data().preference || [];

        const updatedPreferences = req.body.pr;

        await userRef.update({
            preference: updatedPreferences
        });

        const response = { message: "Preference added successfully." };
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ error: error.message || "Internal server error" });
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

        const updatedItems = Array.isArray(existingItems) ? existingItems : [];

        updatedItems.push(newItem);

        await userRef.update({
            items: updatedItems
        });
        const response = { message: "Added successfully." };
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ error: error.toString() });
    }
});

app.post('/dashboard', async (req, res) => {
    const userId = req.body.email;

    try {
        const userRef = db.collection('users');
        const userDoc = await userRef.doc(userId).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            res.send(userData);
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

app.post('/deleteItem', async (req, res) => {
    const userId = req.body.email;
    const itemIndex = req.body.itemIndex;

    try {
        const userRef = db.collection('users').doc(userId);

        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            res.status(404).send("User not found");
            return;
        }

        const userData = userDoc.data();

        if (!userData.items || !Array.isArray(userData.items)) {
            res.status(400).send("Invalid user data structure");
            return;
        }

        if (itemIndex < 0 || itemIndex >= userData.items.length) {
            res.status(400).send("Invalid item index");
            return;
        }

        userData.items.splice(itemIndex, 1);

        await userRef.update({
            items: userData.items
        });

        res.send("Item deleted successfully");
    } catch (error) {
        res.status(500).send(error);
    }
});

require('dotenv').config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});




app.post('/create/recipe', async (req, res) => {
    const userId = req.body.email;

    try {
        const userRef = db.collection('users');
        const userDoc = await userRef.doc(userId).get();

        if (userDoc.exists) {
            const userData = userDoc.data();

            let items_word = "";
            let preference_word = "";

            for (let i = 0; i < userData.items.length; i++) {
                if (i > 0 && i <= userData.items.length - 1) {
                    items_word += ", " + userData.items[i];
                }
            }

            for (let i = 0; i < userData.preference.length; i++) {
                if (i > 0 && i <= userData.preference.length - 1) {
                    preference_word += ", " + userData.preference[i];
                }
            }
            const prompt = `Based on your what sort of food I want to eat (${preference_word}) and available items in the fridge (${items_word}), list only 10 recipes in json format seperated by comma.`;

            const completion = await openai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant designed to output JSON.",
                    },
                    { role: "user", content: prompt },
                ],
                model: "gpt-3.5-turbo-1106",
                response_format: { type: "json_object" },
            });
            res.json(completion.choices[0].message.content);
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal request failed' });
    }
});
app.post('/create/recipe/steps', async (req, res) => {
    const itemName = req.body.itemName;

    try {
        const prompt = `Using the ingredients ${itemName}, provide short step-by-step instructions (dont start with sure...) for a healthy recipe. Only provide text instructions, not JSON. `;

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant.",
                },
                { role: "user", content: prompt },
            ],
            model: "gpt-3.5-turbo-1106"
        });
        res.json(completion.choices[0].message.content);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal request failed' });
    }
});

app.post('/upload', async (req, res) => {
    try {
        const fileBuffer = Buffer.from(JSON.parse(JSON.stringify(req.files)).undefined.data.data).toString('base64')

        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Not in a sentence, just name the food item in the image" },
                        {
                            type: "image_url",
                            image_url: {
                                //"url": "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAA…"
                                "url": "data:image/jpeg;base64," + fileBuffer
                            }
                        },
                    ],
                },
            ],
        });

        res.status(200).json({ item: response.choices[0] });
    } catch (error) {
        console.error(error); // Log the error for debugging purposes
        res.status(500).json({ error: 'Internal Server Error' }); // Send a generic error response

    }
});

app.listen(process.env.PORT || 3100, () => {
    console.log('http://localhost:3100/')
})