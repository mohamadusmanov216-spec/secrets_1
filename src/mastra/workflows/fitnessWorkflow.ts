import { createStep, createWorkflow } from "../inngest";
import { z } from "zod";
import { fitnessAgent } from "../agents/fitnessAgent";

/**
 * Fitness Bot Workflow
 *
 * This workflow handles incoming Telegram messages and callback queries
 * for the fitness coaching bot. It processes user interactions and
 * responds with appropriate menu options and information.
 */

/**
 * Step 1: Process Telegram Message or Callback
 * This step handles both regular messages and callback button presses
 */
const processTelegramMessage = createStep({
  id: "process-telegram-message",
  description: "Process incoming Telegram message or callback query using the fitness bot agent",

  inputSchema: z.object({
    threadId: z.string().describe("Unique thread ID for this conversation"),
    chatId: z.union([z.string(), z.number()]).describe("Telegram chat ID"),
    messageId: z.number().optional().describe("Message ID for editing (callback queries)"),
    messageText: z.string().optional().describe("Text of the message (for regular messages)"),
    callbackData: z.string().optional().describe("Callback data from button press"),
    userName: z.string().optional().describe("Username of the sender"),
  }),

  outputSchema: z.object({
    success: z.boolean(),
    response: z.string(),
    actionTaken: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🚀 [Step 1] Processing Telegram message/callback...", {
      chatId: inputData.chatId,
      messageText: inputData.messageText,
      callbackData: inputData.callbackData,
    });

    let prompt = "";

    // Determine the action based on message text or callback data
    if (inputData.messageText === "/start") {
      prompt = `
        A user just started the bot with the /start command.
        Chat ID: ${inputData.chatId}
        
        Please send the main menu message using the telegram-send-message tool.
        Use the MAIN_TEXT template with the appropriate inline keyboard buttons.
      `;
    } else if (inputData.callbackData) {
      // Handle callback query (button press)
      const action = inputData.callbackData;
      prompt = `
        A user pressed a button with callback data: "${action}"
        Chat ID: ${inputData.chatId}
        Message ID to edit: ${inputData.messageId}
        
        Please edit the message using the telegram-edit-message tool.
        Based on the callback data "${action}", show the appropriate page:
        - "nutrition" -> NUTRITION_TEXT with nutrition buttons
        - "coaching" -> COACHING_TEXT with coaching buttons
        - "application" -> APPLICATION_TEXT with application buttons
        - "main_menu" -> MAIN_TEXT with main menu buttons
      `;
    } else {
      // Handle regular message (not /start)
      prompt = `
        A user sent a message: "${inputData.messageText}"
        Chat ID: ${inputData.chatId}
        
        Please respond helpfully about fitness coaching services and suggest using the /start command
        to see the menu if they seem interested in the services.
      `;
    }

    logger?.info("📝 [Step 1] Calling fitness agent with prompt");

    // Call the agent using generateLegacy for SDK v4 compatibility
    const response = await fitnessAgent.generateLegacy(
      [{ role: "user", content: prompt }],
      {
        resourceId: "fitness-bot",
        threadId: inputData.threadId,
        maxSteps: 5,
      }
    );

    logger?.info("✅ [Step 1] Agent processing complete");

    return {
      success: true,
      response: response.text,
      actionTaken: inputData.callbackData || inputData.messageText || "unknown",
    };
  },
});

/**
 * Step 2: Log Results
 * This step logs the final results of the workflow
 */
const logResults = createStep({
  id: "log-results",
  description: "Log the results of the fitness bot interaction",

  inputSchema: z.object({
    success: z.boolean(),
    response: z.string(),
    actionTaken: z.string(),
  }),

  outputSchema: z.object({
    completed: z.boolean(),
    summary: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("📤 [Step 2] Logging workflow results...");

    const summary = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏋️‍♂️ FITNESS BOT WORKFLOW RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Success: ${inputData.success}
🎯 Action: ${inputData.actionTaken}

🤖 Agent Response:
${inputData.response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    logger?.info(summary);
    logger?.info("✅ [Step 2] Workflow completed successfully");

    return {
      completed: true,
      summary: `Fitness bot handled action: ${inputData.actionTaken}`,
    };
  },
});

/**
 * Create the fitness bot workflow by chaining steps
 */
export const fitnessWorkflow = createWorkflow({
  id: "fitness-bot-workflow",

  inputSchema: z.object({
    threadId: z.string().describe("Unique thread ID for this conversation"),
    chatId: z.union([z.string(), z.number()]).describe("Telegram chat ID"),
    messageId: z.number().optional().describe("Message ID for editing"),
    messageText: z.string().optional().describe("Text of the message"),
    callbackData: z.string().optional().describe("Callback data from button press"),
    userName: z.string().optional().describe("Username of the sender"),
  }) as any,

  outputSchema: z.object({
    completed: z.boolean(),
    summary: z.string(),
  }),
})
  .then(processTelegramMessage as any)
  .then(logResults as any)
  .commit();
