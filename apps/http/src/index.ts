import { CreateRoomSchema, CreateUserSchema, SigninSchema } from "@repo/com/types";
import { prismaClient } from '@repo/db/clint';
import express from 'express';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from './config';
import { middleware } from "./middleware";

// const app = express();
// app.use(express.json());

// app.post("/signup", async (req, res) => {

//     const pData = CreateUserSchema.safeParse(req.body);
//     if (!parsedData.success) {
//         console.log(parsedData.error);
//         res.json({
//             message: "Incorrect inputs"
//         })
//         return;
//     }
//     try {
//         const user = await prismaClient.user.create({
//             data: {
//                 email: parsedData.data?.username,
//                 password: parsedData.data.password,
//                 name: parsedData.data.name
//             }
//         })
//         res.json({
//             userId: user.id
//         })
//     } catch(e) {
//         res.status(411).json({
//             message: "User already exists with this username"
//         })
//     }
// })


// app.post("/signin", async (req, res) => {
//   let pdata = SigninSchema.safeParse(req.body);
//   if (!pdata.success) {
//     return res.status(400).json({});
//   }

//   let user = await prismaClient.user.findFirst({
//     where: {
//       email: pdata.data.username,
//       password: pdata.data.password,
//     },
//   });

//   if (!user) {
//     res.status(403).json({
//       message: "Not authorized",
//     });
//   } else {
//     let token = jwt.sign(
//       {
//         userId: user.id,
//       },
//       JWT_SECRET
//     );

//     res.json({
//       token: token,
//     });
//   }
// });

// // app.post("/room", middleware, async (req, res) => {
// //   let roomData = CreateRoomSchema.safeParse(req.body);
// //   if (!roomData.success) {
// //     console.log(roomData.error);
// //     res.json({
// //       message: "Incorrect input",
// //     });
// //   } else {
// //     // @ts-ignore
// //     let userId = req.userId;

// //     let room=await prismaClient.room.create({
// //       data : {
// //         slug: roomData.data?.name,
// //         adminId : userId,
// //       },
// //     });

// //     res.json({
// //       roomId: room.id,
// //     });
// //   }
// // });

// app.post("/room", middleware, async (req, res) => {
//   const parsedData = CreateRoomSchema.safeParse(req.body);
//   if (!parsedData.success) {
//       res.json({
//           message: "Incorrect inputs"
//       })
//       return;
//   }
//   // @ts-ignore: TODO: Fix this
//   const userId = req.userId;

//   try {
//       const room = await prismaClient.room.create({
//           data: {
//               slug: parsedData.data.name,
//               adminId: userId
//           }
//       })
//       res.json({
//         roomId: room.id
//     })
//   } catch(e) {
//       res.status(411).json({
//           message: "Room already exists with this name"
//       })
//   }
// })

// app.get("/chats/:roomId", async (req, res) => {
//   try {
//       const roomId = Number(req.params.roomId);
//       console.log(req.params.roomId);
//       const messages = await prismaClient.chat.findMany({
//           where: {
//               roomId: roomId
//           },
//           orderBy: {
//               id: "desc"
//           },
//           take: 1000
//       });

//       res.json({
//           messages
//       })
//   } catch(e) {
//       console.log(e);
//       res.json({
//           messages: []
//       })
//   }
  
// })

// app.get("/room/:slug", async (req, res) => {
//   const slug = req.params.slug;
//   const room = await prismaClient.room.findFirst({
//       where: {
//           slug
//       }
//   });

//   res.json({
//       room
//   })
// })


// app.listen(3001, () => {
//   console.log("Server running on port 3001");
// });


const app = express();
app.use(express.json());


app.post("/signup", async (req, res) => {

    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        console.log(parsedData.error);
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    try {
        const user = await prismaClient.user.create({
            data: {
                email: parsedData.data?.username,
                // TODO: Hash the pw
                password: parsedData.data.password,
                name: parsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
    } catch(e) {
        res.status(411).json({
            message: "User already exists with this username"
        })
    }
})

app.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }

    // TODO: Compare the hashed pws here
    const user = await prismaClient.user.findFirst({
        where: {
            email: parsedData.data.username,
            password: parsedData.data.password
        }
    })

    if (!user) {
        res.status(403).json({
            message: "Not authorized"
        })
        return;
    }

    const token = jwt.sign({
        userId: user?.id
    }, JWT_SECRET);

    res.json({
        token
    })
})

app.post("/room", middleware, async (req, res) => {
    const pData = CreateRoomSchema.safeParse(req.body);
    if (!pData.success) {
        res.json({
            message: "Incorrect inputs"
        })
        return;
    }
    // @ts-ignore: TODO: Fix this
    const userId: string | undefined = req.userId;

    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const room = await prismaClient.room.create({
            
            data: {
                slug: pData.data.name,
                adminId: userId
            }
            
        })

        res.json({
            roomId: room.id
        })
    } catch(e) {
        res.status(411).json({
            message: "Room already exists with this name"
        })
    }
})

app.get("/chats/:roomId", async (req, res) => {
    try {
        const roomId = Number(req.params.roomId);
        console.log(req.params.roomId);
        const messages = await prismaClient.chat.findMany({
            where: {
                roomId: roomId
            },
            orderBy: {
                id: "desc"
            },
            take: 1000
        });

        res.json({
            messages
        })
    } catch(e) {
        console.log(e);
        res.json({
            messages: []
        })
    }
    
})

app.get("/room/:slug", async (req, res) => {
    const slug = req.params.slug;
    const room = await prismaClient.room.findFirst({
        where: {
            slug
        }
    });

    res.json({
        room
    })
})

app.listen(3001);