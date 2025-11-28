// ---------- Imports ----------
import express, { Request, Response } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";
import { OpenAI } from "openai";

dotenv.config();

// ---------- Firebase Setup ----------
const credentials = require("./key.json");

admin.initializeApp({
    credential: admin.credential.cert(credentials),
});

const db = admin.firestore();

// ---------- Express Setup ----------
const app = express();
app.use(express.json());
app.use(fileUpload());
app.use(cors());

// ---------- Type Definitions ----------
interface User {
    name: string;
    email: string;
    preference: string[];
    items: string[];
}

interface CreateUserBody {
    name: string;
    email: string;
}

interface PreferenceBody {
    email: string;
    preference: string[];
}

interface AddItemBody {
    email: string;
    items: string;
}

interface DashboardBody {
    email: string;
}

interface DeleteItemBody {
    email: string;
    itemIndex: number;
}

interface RecipeBody {
    email: string;
}

interface RecipeStepBody {
    itemName: string;
}

// ---------- OpenAI Setup ----------
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

// ------------------------------------------------------
//                  CREATE USER
// ------------------------------------------------------
app.post("/create/user", async (req: Request<{}, {}, CreateUserBody>, res: Response) => {
    try {
        const { email, name } = req.body;

        const userRef = db.collection("users").doc(email);
        const doc = await userRef.get();

        if (doc.exists) {
            return res.json(doc.data());
        }

        const newUser: User = {
            name,
            email,
            preference: [],
            items: []
        };

        await userRef.set(newUser);
        return res.status(200).json({ message: "User created successfully." });

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// ------------------------------------------------------
//              ADD PREFERENCES
// ------------------------------------------------------
app.put("/add/preferences", async (req: Request<{}, {}, PreferenceBody>, res: Response) => {
    try {
        const { email, preference } = req.body;

        const userRef = db.collection("users").doc(email);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: "User not found" });
        }

        await userRef.update({ preference });
        return res.json({ message: "Preference updated successfully." });

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

// ------------------------------------------------------
//              ADD ITEM
// ------------------------------------------------------
app.put("/add/items", async (req: Request<{}, {}, AddItemBody>, res: Response) => {
    try {
        const { email, items } = req.body;

        const userRef = db.collection("users").doc(email);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).json({ error: "User not found" });

        const data = doc.data() as User;

        const updatedItems = [...(data.items || []), items];

        await userRef.update({ items: updatedItems });

        return res.json({ message: "Item added successfully." });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// ------------------------------------------------------
//                  DASHBOARD
// ------------------------------------------------------
app.post("/dashboard", async (req: Request<{}, {}, DashboardBody>, res: Response) => {
    try {
        const userRef = db.collection("users").doc(req.body.email);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).send("User not found");

        return res.json(doc.data());

    } catch (err) {
        return res.status(500).send(err);
    }
});

// ------------------------------------------------------
//                  DELETE ITEM
// ------------------------------------------------------
app.post("/deleteItem", async (req: Request<{}, {}, DeleteItemBody>, res: Response) => {
    try {
        const { email, itemIndex } = req.body;

        const userRef = db.collection("users").doc(email);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).send("User not found");

        const data = doc.data() as User;

        if (!Array.isArray(data.items) || itemIndex >= data.items.length) {
            return res.status(400).send("Invalid item index");
        }

        data.items.splice(itemIndex, 1);
        await userRef.update({ items: data.items });

        return res.send("Item deleted successfully");

    } catch (error) {
        return res.status(500).send(error);
    }
});

// ------------------------------------------------------
//              CREATE RECIPE
// ------------------------------------------------------
app.post("/create/recipe", async (req: Request<{}, {}, RecipeBody>, res: Response) => {
    try {
        const userRef = db.collection("users").doc(req.body.email);
        const doc = await userRef.get();

        if (!doc.exists) return res.status(404).send("User not found");

        const data = doc.data() as User;

        const items = data.items.join(", ");
        const prefs = data.preference.join(", ");

        const prompt = data.preference.length === 0
            ? `Using items (${items}), list 5–10 healthy recipes in JSON under key "recipes".`
            : `Using preferences (${prefs}) and items (${items}), list 5–10 healthy recipes in JSON with name and calories.`

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-1106",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: "You are a helpful assistant returning JSON." },
                { role: "user", content: prompt }
            ]
        });

        return res.json(completion.choices[0].message.content);

    } catch (error) {
        return res.status(500).json({ error: "Internal request failed" });
    }
});

// ------------------------------------------------------
//              RECIPE STEPS
// ------------------------------------------------------
app.post("/create/recipe/steps", async (req: Request<{}, {}, RecipeStepBody>, res: Response) => {
    try {
        const prompt = `Using the ingredients ${req.body.itemName}, provide short step-by-step instructions.`

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-1106",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ]
        });

        return res.json(completion.choices[0].message.content);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// ------------------------------------------------------
//                 UPLOAD IMAGE
// ------------------------------------------------------
app.post("/upload", async (req: Request, res: Response) => {
    try {
        if (!req.files) return res.status(400).json({ error: "No file uploaded" });

        const file = req.files.file as UploadedFile;
        const base64 = file.data.toString("base64");

        const completion = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Name the food item and how many days it lasts in the fridge." },
                        {
                            type: "image_url",
                            image_url: { url: "data:image/jpeg;base64," + base64 }
                        }
                    ]
                }
            ]
        });

        return res.json({ item: completion.choices[0] });

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// ---------- Start Server ----------
app.listen(process.env.PORT || 3100, () => {
    console.log("http://localhost:3100/");
});
