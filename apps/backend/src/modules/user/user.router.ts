import { FastifyInstance } from "fastify";

import * as userService from "./user.service.js";

export default function userRouter(app: FastifyInstance) {
  app.get("/me", () => {
    return userService.getUserProfile('id');
  })
}
