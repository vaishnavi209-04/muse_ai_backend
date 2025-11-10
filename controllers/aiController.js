import OpenAI from "openai";
import sql from "../config/db.js";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import FormData from "form-data";
import { clerkClient } from "@clerk/express";
import { PDFParse } from "pdf-parse";


// Initialize AI
const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// ==========================
// Generate Article
// ==========================
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: length,
    });

    const content = response.choices[0].message.content;

    await sql`INSERT INTO creations (user_id, prompt, content, type)
              VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================
// Generate Blog Title
// ==========================
export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0].message.content;

    await sql`INSERT INTO creations (user_id, prompt, content, type)
              VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: { free_usage: free_usage + 1 },
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================
// Generate Image
// ==========================
export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is available for premium users only. Upgrade to continue.",
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
      headers: {
        "x-api-key": process.env.CLIPDROP_API_KEY,
        ...formData.getHeaders(),
      },
      responseType: "arraybuffer",
    });

    const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await sql`INSERT INTO creations (user_id, prompt, content, type, publish)
              VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================
// Remove Image Background
// ==========================
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is available for premium users only. Upgrade to continue.",
      });
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      ],
    });

    await sql`INSERT INTO creations (user_id, prompt, content, type)
              VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;

    res.json({ success: true, content: secure_url });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================
// Remove Image Object
// ==========================
export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is available for premium users only. Upgrade to continue.",
      });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);

    const imageUrl = cloudinary.url(public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
      resource_type: "image",
    });

    await sql`INSERT INTO creations (user_id, prompt, content, type)
              VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

    res.json({ success: true, content: imageUrl });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ==========================
// Resume Review
// ==========================
export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth;
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is available for premium users only. Upgrade to continue.",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      return res.json({ success: false, message: "File size exceeds 5MB limit." });
    }

    // Parse PDF
    const dataBuffer = fs.readFileSync(resume.path);
    let parser;
    try {
      parser = new PDFParse({ data: dataBuffer });
      const textResult = await parser.getText();
      await parser.destroy();

      // Validate extracted text
      if (!textResult || !textResult.text || textResult.text.trim().length === 0) {
        return res.json({ 
          success: false, 
          message: "Failed to extract text from PDF. The PDF might be empty, corrupted, or image-based." 
        });
      }

      const extractedText = textResult.text.trim();
      console.log(`Extracted text length: ${extractedText.length} characters`);

      // Generate AI review
      const prompt = `Review the following resume and provide constructive feedback on its strengths and areas for improvement.\n\nResume Content:\n\n${extractedText}`;

      const response = await AI.chat.completions.create({
        model: "gemini-2.0-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      });

      // Validate AI response
      if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
        return res.json({ 
          success: false, 
          message: "AI service returned an invalid response." 
        });
      }

      const content = response.choices[0].message.content;

      if (!content || content.trim().length === 0) {
        return res.json({ 
          success: false, 
          message: "AI service returned an empty response." 
        });
      }

      // Insert into database
      await sql`INSERT INTO creations (user_id, prompt, content, type)
                VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

      res.json({ success: true, content });
    } catch (error) {
      // Clean up parser if it exists
      if (parser) {
        try {
          await parser.destroy();
        } catch (destroyError) {
          console.error("Error destroying parser:", destroyError);
        }
      }
      // Log the specific error for debugging
      console.error("Error in resumeReview:", error);
      console.error("Error details:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Resume review error:", error);
    res.json({ 
      success: false, 
      message: error.message || "An error occurred while processing the resume. Please try again." 
    });
  }
};
