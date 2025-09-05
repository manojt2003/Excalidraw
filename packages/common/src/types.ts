import { z } from "zod";

export const CreateUserSchema = z.object({
     username: z.string().min(3).max(20),
     password: z.string(),
     name: z.string(),
});

export let SigninSchema = z.object({
     username: z.string().min(3).max(20),
     password: z.string(),
});

export let CreateRoomSchema = z.object({
     name: z.string().min(3).max(20),
});