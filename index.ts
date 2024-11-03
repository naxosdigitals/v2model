import dotenv from "dotenv";
import fetch from "node-fetch";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";
import cors from "cors";
import express, { Request, Response } from "express";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

interface Action {
  type: string;
  payload: any;
}

// Modify the callApi function to accept runtime endpoint dynamically
async function callApi(action: Action, res: Response, userId: string, projectId: string) {
  const queryParams = new URLSearchParams({
    completion_events: "true",
    ...(process.env.ENVIRONMENT && { environment: process.env.ENVIRONMENT }),
  });

  const response = await fetch(
    `${process.env.RUNTIME_ENDPOINT}/v2/project/${projectId}/user/${userId}/interact/stream?${queryParams}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${process.env.API_KEY}`,
      },
      body: JSON.stringify({ action }),
    }
  );

  if (!response.ok || !response.body) {
    throw new Error(`API failed ${response.status} ${await response.text()}`);
  }

  const parser = createParser((event: ParsedEvent | ReconnectInterval) => {
    if ("data" in event) {
      const trace = JSON.parse(event.data);
      console.log("voiceflow:", trace);
      switch (trace.type) {
        case "speak":
        case "text":
          res.write(trace.payload.message);
          break;
        case "completion":
          console.log("Voiceflow Completion Event:", trace.payload.content);
          if (trace.payload.state === "content") {
            res.write(trace.payload.content);
          }
          break;
      }
    }
  });

  response.body!.on("data", (chunk: Buffer) => {
    parser.feed(chunk.toString());
  });

  response.body!.on("end", () => {
    res.end(); // End the response when the stream completes
  });
}

// API route for frontend communication with streaming support
app.post("/api/message", async (req: Request, res: Response) => {
  const { message, userId, projectId } = req.body; // Accept userId and projectId from the request body

  try {
    res.setHeader("Content-Type", "text/plain"); // Set content type to stream text
    await callApi({ type: "text", payload: message }, res, userId, projectId); // Pass userId and projectId
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({ error: "Error processing message" });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

