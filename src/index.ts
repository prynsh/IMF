import express from "express"
import { PrismaClient } from "../generated/prisma";


const app = express();
app.use(express.json())

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
  

function randomNumber(){
    const number = Math.floor(Math.random()*100)
    return number;
}


app.post("/gadgets",async (req,res)=>{
    try{

        const name = generateCodename(); 
        const gadget = await prisma.gadget.create({
            data:{
                name: name,
            }
        })
        
        res.status(200).json({
            message: "Gadget Created Successfully"
        })
    }catch(e){
        res.json({
            message:e
        })
    }
})


app.get("/gadgets",async (req,res)=>{
    const response = await prisma.gadget.findMany()
    
    console.log(randomNumber())
    response.forEach(gadget=>{
        console.log(gadget.name + "-"+ randomNumber() +"% success probability")
    })
})

app.patch("/gadgets",async (req,res)=>{
    const id = req.body.id;
    const response = await prisma.gadget.update({
        where:{
            id:id
        },
        data:{
            name:req.body.name,
        },
    })
    res.json({
        message:"Updated successfully"
    })
})  


app.delete("/gadgets", async (req,res)=>{
    const id = req.body.id;
    const updatedGadget =await prisma.gadget.update({
        where:{
            id: id
        },
        data:{
            status: "Decommissioned",            
            decommissionedAt: new Date(),     
        }
    })
    res.json(updatedGadget);
})


app.listen(3000)