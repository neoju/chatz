import { FastifyInstance } from "fastify";

export default function authRouter(app: FastifyInstance) {
  app.post("/login", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        }
      }
    }
  }, () => {
    return { message: "Login endpoint" };
  })

  app.post("/register", {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 },
        }
      }
    }
  }, () => {
    return { message: "Register endpoint" };
  })
}
