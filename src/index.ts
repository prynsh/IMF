import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { PrismaClient } from "../generated/prisma";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./middleware";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const app = express();
app.use(express.json());

const prisma = new PrismaClient();

function randomWord(length = 5) {
  const vowels = "aeiou";
  const consonants = "bcdfghjklmnpqrstvwxyz";
  let word = "";
  let useConsonant = Math.random() > 0.5;

  for (let i = 0; i < length; i++) {
    const pool = useConsonant ? consonants : vowels;
    word += pool[Math.floor(Math.random() * pool.length)];
    useConsonant = !useConsonant;
  }

  return word.charAt(0).toUpperCase() + word.slice(1);
}

function generateCodename() {
  const part1 = randomWord(4 + Math.floor(Math.random() * 2));
  const part2 = randomWord(4 + Math.floor(Math.random() * 2));
  return part1 + part2;
}

function randomNumber() {
  return Math.floor(Math.random() * 100);
}

// Signup
app.post("/signup", async (req: Request, res: Response):Promise<any> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const token = jwt.sign({ username, password }, JWT_SECRET);
    return res.status(200).json({ token });
  } catch (e) {
    return res.status(500).json({ message: "Signup failed", error: (e as Error).message });
  }
});

// Create Gadget
app.post("/gadgets", authenticateToken, async (req, res):Promise<any> => {
  try {
    const name = generateCodename();
    const gadget = await prisma.gadget.create({ data: { name } });

    return res.status(201).json({
      message: "Gadget Created Successfully",
      gadget,
    });
  } catch (e) {
    return res.status(500).json({ message: "Failed to create gadget", error: (e as Error).message });
  }
});

// Get Gadgets
app.get("/gadgets", authenticateToken, async (req, res):Promise<any> => {
  try {
    const status = req.query.status as string | undefined;
    const validStatuses = ["Available", "Deployed", "Destroyed", "Decommissioned"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const gadgets = await prisma.gadget.findMany({ where: status  ? { status } as any : {} });
    const enrichedGadgets = gadgets.map(gadget => ({
      ...gadget,
      missionSuccessProbability: `${Math.floor(Math.random() * 100) }%`,
    }));

    return res.status(200).json(enrichedGadgets);
  } catch (e) {
    return res.status(500).json({ message: "Failed to fetch gadgets", error: (e as Error).message });
  }
});

// Update Gadget
app.patch("/gadgets", authenticateToken, async (req, res):Promise<any> => {
  try {
    const { id, name, status } = req.body;
    if (!id || (!name && !status)) {
      return res.status(400).json({ message: "ID and at least one field to update are required" });
    }

    const updated = await prisma.gadget.update({
      where: { id },
      data: { name, status },
    });

    return res.status(200).json({ message: "Updated successfully", updated });
  } catch (e) {
    return res.status(500).json({ message: "Failed to update gadget", error: (e as Error).message });
  }
});

// Delete (Decommission) Gadget
app.delete("/gadgets", authenticateToken, async (req, res):Promise<any> => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "ID is required" });

    const updatedGadget = await prisma.gadget.update({
      where: { id },
      data: {
        status: "Decommissioned",
        decommissionedAt: new Date(),
      },
    });

    return res.status(200).json({ message: "Gadget decommissioned", updatedGadget });
  } catch (e) {
    return res.status(500).json({ message: "Failed to decommission gadget", error: (e as Error).message });
  }
});

// Self-destruct
app.post("/gadgets/self-destruct", authenticateToken, async (req, res):Promise<any> => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "ID is required" });

    const gadget = await prisma.gadget.findUnique({ where: { id } });
    if (!gadget) {
      return res.status(404).json({ message: "Gadget not found" });
    }

    const confirmationCode = Math.floor(100000 + Math.random() * 900000);
    return res.status(200).json({
      message: "Self-destruct initiated",
      confirmationCode,
      gadget: gadget.name,
    });
  } catch (e) {
    return res.status(500).json({ message: "Failed to initiate self-destruct", error: (e as Error).message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
